<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Models\Encadrement;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;

/**
 * @OA\Tag(
 *     name="Encadrements",
 *     description="Gestion des encadrements de thèse"
 * )
 */
class EncadrementController extends Controller
{
    use ApiResponseTrait;

    /**
     * @OA\Get(
     *     path="/api/encadrements",
     *     summary="Lister les encadrements",
     *     tags={"Encadrements"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Succès")
     * )
     */
    public function index()
    {
        // Retourne les encadrements liés au professeur connecté ou tous pour l'admin
        $user = auth()->user();
        if ($user->role === 'admin') {
            $encadrements = Encadrement::with(['doctorant', 'professeur', 'sujet'])->get();
        } else {
            $encadrements = Encadrement::where('professeur_id', $user->id)
                ->with(['doctorant', 'sujet'])
                ->get();
        }

        return $this->successResponse($encadrements, 'Encadrements récupérés');
    }

    /**
     * @OA\Post(
     *     path="/api/encadrements",
     *     summary="Créer un encadrement",
     *     tags={"Encadrements"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"doctorant_id", "sujet_id"},
     *             @OA\Property(property="doctorant_id", type="integer"),
     *             @OA\Property(property="sujet_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Encadrement créé")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctorant_id' => 'required|exists:utilisateurs,id',
            'sujet_id' => 'required|exists:sujets_these,id',
        ]);

        $encadrement = Encadrement::create([
            'doctorant_id' => $validated['doctorant_id'],
            'professeur_id' => auth()->id(),
            'sujet_id' => $validated['sujet_id'],
            'date_debut' => now(),
            'annee_these' => 1
        ]);

        return $this->successResponse($encadrement, 'Encadrement créé avec succès', 201);
    }

    /**
     * @OA\Get(
     *     path="/api/doctorant/suivi",
     *     tags={"Encadrements"},
     *     summary="Afficher l'encadrement et le suivi du doctorant connecté",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Détails du suivi"),
     *     @OA\Response(response=404, description="Aucun encadrement trouvé")
     * )
     */
    public function monSuivi(Request $request)
    {
        $encadrement = Encadrement::with(['professeur', 'sujet', 'suiviEvaluations'])
            ->where('doctorant_id', $request->user()->id)
            ->first();

        if (!$encadrement) {
            return $this->errorResponse('Aucun encadrement trouvé', 404);
        }

        return $this->successResponse($encadrement, 'Détails du suivi');
    }
}
