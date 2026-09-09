<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCandidatureRequest;
use App\Http\Resources\CandidatureResource;
use App\Models\Candidature;
use App\Models\DocumentCandidature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CandidatureController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/candidatures",
     *     tags={"Candidatures"},
     *     summary="Lister toutes les candidatures",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Liste des candidatures avec documents et sujets"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function index()
    {
        $candidatures = Candidature::with([
            'utilisateur',
            'sujetThese.equipe.laboratoire',
            'documents'
        ])->latest()->get();

        return CandidatureResource::collection($candidatures);
    }

    /**
     * @OA\Post(
     *     path="/api/candidatures",
     *     tags={"Candidatures"},
     *     summary="Déposer une nouvelle candidature avec documents",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"laboratoire_id", "diplome_obtenu", "sujets", "cv", "diplome_bac", "diplome_master"},
     *                 @OA\Property(property="laboratoire_id", type="integer", example=1),
     *                 @OA\Property(property="diplome_obtenu", type="string", example="Master"),
     *                 @OA\Property(
     *                     property="sujets[]",
     *                     type="array",
     *                     @OA\Items(type="integer"),
     *                     description="Tableau contenant les IDs de 3 sujets maximum"
     *                 ),
     *                 @OA\Property(property="cv", type="string", format="binary"),
     *                 @OA\Property(property="diplome_bac", type="string", format="binary"),
     *                 @OA\Property(property="diplome_licence", type="string", format="binary"),
     *                 @OA\Property(property="diplome_master", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Candidature déposée avec succès")
     * )
     */
    public function store(StoreCandidatureRequest $request)
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($request, $validated) {
            $user = $request->user();

            $candidature = Candidature::create([
                'doctorant_id' => $user->id,
                'laboratoire_id' => $validated['laboratoire_id'],
                'diplome_obtenu' => $validated['diplome_obtenu'],
                'statut'         => 'depose',
                'date_depot'     => now(),
            ]);

            // Save the selected subjects with their rank
            $sujets = $validated['sujets'];
            foreach ($sujets as $index => $sujetId) {
                DB::table('candidature_sujets')->insert([
                    'candidature_id' => $candidature->id,
                    'sujet_id' => $sujetId,
                    'rang' => $index + 1
                ]);
            }

            $filesToUpload = [
                'cv' => 'CV',
                'diplome_bac' => 'Diplôme du Baccalauréat',
                'diplome_licence' => 'Licence',
                'diplome_master' => 'Master ou Diplôme d\'Ingénieur',
            ];

            foreach ($filesToUpload as $field => $docName) {
                if ($request->hasFile($field)) {
                    $path = $request->file($field)->store('candidatures/' . $user->id, 'public');
                    DocumentCandidature::create([
                        'candidature_id' => $candidature->id,
                        'nom_document'   => $docName,
                        'statut'         => 'depose',
                        'date_depot'     => now(),
                        'chemin_fichier' => $path,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Candidature déposée avec succès',
                'data'    => new CandidatureResource($candidature->load(['sujets', 'documents']))
            ], 201);
        });
    }

    /**
     * @OA\Get(
     *     path="/api/candidatures/{id}",
     *     tags={"Candidatures"},
     *     summary="Afficher le détail d'une candidature",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\Response(response=200, description="Détail de la candidature"),
     *     @OA\Response(response=404, description="Candidature introuvable"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function show(Candidature $candidature)
    {
        return new CandidatureResource(
            $candidature->load(['utilisateur', 'sujetThese.equipe.laboratoire', 'documents'])
        );
    }

    /**
     * @OA\Patch(
     *     path="/api/candidatures/{id}/statut",
     *     tags={"Candidatures"},
     *     summary="Mettre à jour le statut d'une candidature",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"statut"},
     *             @OA\Property(
     *                 property="statut",
     *                 type="string",
     *                 enum={"en_attente","preselectionne","accepte","refuse"},
     *                 example="accepte"
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Statut mis à jour"),
     *     @OA\Response(response=422, description="Statut invalide"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function updateStatut(Request $request, Candidature $candidature)
    {
        $request->validate([
            'statut' => 'required|in:en_attente,preselectionne,accepte,refuse',
        ]);

        $candidature->update(['statut' => $request->statut]);

        return response()->json([
            'message' => 'Statut mis à jour avec succès',
            'data'    => new CandidatureResource($candidature)
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/candidatures/{id}/documents",
     *     tags={"Candidatures"},
     *     summary="Ajouter de nouveaux documents à une candidature",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"nom_document", "fichier"},
     *                 @OA\Property(property="nom_document", type="string", example="Lettre de motivation"),
     *                 @OA\Property(property="fichier", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Document ajouté avec succès"),
     *     @OA\Response(response=403, description="Non autorisé")
     * )
     */
    public function uploadDocument(Request $request, $id)
    {
        $candidature = Candidature::findOrFail($id);
        $user = clone $request->user();

        if ($user->role !== 'admin' && $user->id !== $candidature->doctorant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'nom_document' => 'required|string|max:255',
            'fichier' => 'required|file|mimes:pdf|max:10240',
        ]);

        $path = $request->file('fichier')->store('candidatures/' . $candidature->doctorant_id, 'public');

        $document = DocumentCandidature::create([
            'candidature_id' => $candidature->id,
            'nom_document'   => $request->input('nom_document'),
            'statut'         => 'depose',
            'date_depot'     => now(),
            'chemin_fichier' => $path,
        ]);

        return response()->json([
            'message' => 'Document ajouté avec succès',
            'data' => $document
        ], 200);
    }
}