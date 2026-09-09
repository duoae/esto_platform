<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Services\SubjectService;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Traits\ApiResponseTrait;
use App\Models\Notification;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Exception;

class SubjectController extends Controller
{
    use ApiResponseTrait;

    protected $subjectService;

    public function __construct(SubjectService $subjectService)
    {
        $this->subjectService = $subjectService;
    }

    /**
     * @OA\Get(
     *     path="/api/subjects",
     *     tags={"Sujets"},
     *     summary="Lister tous les sujets de thèse",
     *     @OA\Parameter(
     *         name="lab",
     *         in="query",
     *         required=false,
     *         description="Filtrer par ID de laboratoire",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Liste des sujets de thèse")
     * )
     */
    public function index(Request $request)
    {
        try {
            // Auto-update schema to ensure lien column exists without requiring manual action
            \Illuminate\Support\Facades\Schema::table('notifications', function (\Illuminate\Database\Schema\Blueprint $table) {
                if (!\Illuminate\Support\Facades\Schema::hasColumn('notifications', 'lien')) {
                    $table->string('lien')->nullable();
                }
            });

            $subjects = $this->subjectService->getAllSubjects($request->all());
            return $this->successResponse(SubjectResource::collection($subjects), 'Sujets récupérés avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la récupération des sujets', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Post(
     *     path="/api/subjects",
     *     tags={"Sujets"},
     *     summary="Créer un nouveau sujet de thèse",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"titre","laboratoire_id"},
     *             @OA\Property(property="titre", type="string", example="Intelligence artificielle et santé"),
     *             @OA\Property(property="objectif", type="string", example="Objectif du sujet de recherche"),
     *             @OA\Property(property="laboratoire_id", type="integer", example=1),
     *             @OA\Property(property="equipe_id", type="integer", example=1),
     *             @OA\Property(property="statut", type="string", enum={"disponible","attribue","cloture"}, example="disponible")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Sujet créé avec succès"),
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'titre' => 'required|string|max:255',
                'laboratoire_id' => 'required|integer',
                'equipe_id' => 'nullable|integer',
                'pole_thematique' => 'nullable|string',
                'axe_recherche' => 'nullable|string',
                'objectif' => 'nullable|string',
                'retombees' => 'nullable|string',
                'conditions_accueil' => 'nullable|string',
                'financement' => 'nullable|string',
                'production_scientifique' => 'nullable|string',
                'statut' => 'nullable|string'
            ]);

            $anneeUniversitaire = date('Y') . '-' . (date('Y') + 1);

            // Vérifier la limite de 2 sujets par an pour ce professeur
            $count = \App\Models\SujetThese::where('enseignant_id', auth()->id())
                ->where('annee_universitaire', $anneeUniversitaire)
                ->count();

            if ($count >= 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez atteint la limite de 2 sujets par année universitaire.',
                    'data' => null
                ], 422);
            }

            $data['enseignant_id'] = auth()->id();
            $data['annee_universitaire'] = $anneeUniversitaire;
            $data['statut'] = $data['statut'] ?? 'en attente';

            $subject = $this->subjectService->createSubject($data);

            // Notify Directeur
            $directeur = Utilisateur::where('role', 'directeur')
                                    ->where('laboratoire_id', $data['laboratoire_id'])
                                    ->first();
            if ($directeur) {
                Notification::create([
                    'utilisateur_id' => $directeur->id,
                    'type' => 'info',
                    'message' => "Un nouveau sujet a été proposé par Pr. " . auth()->user()->nom,
                    'role_cible' => 'directeur',
                    'lien' => '/directeur/candidatures' // Directeur views subjects/candidatures
                ]);
            }

            // Notify Admin
            $admin = Utilisateur::where('role', 'admin')->first();
            if ($admin) {
                Notification::create([
                    'utilisateur_id' => $admin->id,
                    'type' => 'info',
                    'message' => "Nouveau sujet ajouté par Pr. " . auth()->user()->nom,
                    'role_cible' => 'admin',
                    'lien' => '/admin/dashboard'
                ]);
            }

            return $this->successResponse(new SubjectResource($subject), 'Sujet créé avec succès', 201);
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la création du sujet', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Put(
     *     path="/api/subjects/{id}",
     *     tags={"Sujets"},
     *     summary="Modifier un sujet de thèse",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="titre", type="string"),
     *             @OA\Property(property="description", type="string"),
     *             @OA\Property(property="statut", type="string", enum={"disponible","attribue","cloture"})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Sujet mis à jour"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(UpdateSubjectRequest $request, $id)
    {
        try {
            $subject = $this->subjectService->updateSubject($id, $request->validated());
            
            // Notification to the Professor if it's not them doing the update
            if (auth()->id() !== $subject->enseignant_id) {
                \App\Models\Notification::create([
                    'utilisateur_id' => $subject->enseignant_id,
                    'type' => 'info',
                    'message' => "Le statut de votre sujet '{$subject->titre}' a été mis à jour.",
                    'role_cible' => 'professeur',
                    'lien' => '/professeur/sujets'
                ]);
            }

            return $this->successResponse(new SubjectResource($subject), 'Sujet mis à jour avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la mise à jour du sujet', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/subjects/{id}",
     *     tags={"Sujets"},
     *     summary="Supprimer un sujet de thèse",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\Response(response=200, description="Sujet supprimé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($id)
    {
        try {
            $this->subjectService->deleteSubject($id);
            return $this->successResponse(null, 'Sujet supprimé avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la suppression du sujet', 500, $e->getMessage());
        }
    }
}
