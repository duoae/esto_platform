<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Models\SuiviEvaluation;
use App\Models\Encadrement;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;

/**
 * @OA\Tag(
 *     name="Suivi & Evaluation",
 *     description="Suivi de l'avancement des doctorants"
 * )
 */
class SuiviEvaluationController extends Controller
{
    use ApiResponseTrait;

    /**
     * @OA\Post(
     *     path="/api/suivi-evaluations",
     *     summary="Ajouter une évaluation et mettre à jour le taux d'avancement",
     *     tags={"Suivi & Evaluation"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"encadrement_id", "type", "taux_avancement"},
     *             @OA\Property(property="encadrement_id", type="integer"),
     *             @OA\Property(property="type", type="string", enum={"note", "rapport", "comite", "alerte"}),
     *             @OA\Property(property="taux_avancement", type="integer", minimum=0, maximum=100),
     *             @OA\Property(property="note", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Évaluation créée")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'encadrement_id' => 'required|exists:encadrements,id',
            'type' => 'required|in:note,rapport,comite,alerte',
            'taux_avancement' => 'required|integer|min:0|max:100',
            'note' => 'nullable|string',
        ]);

        $encadrement = Encadrement::findOrFail($validated['encadrement_id']);

        $suivi = SuiviEvaluation::create([
            'encadrement_id' => $validated['encadrement_id'],
            'type' => $validated['type'],
            'note' => $validated['note'] ?? null,
            'taux_avancement' => $validated['taux_avancement'],
            'cree_par' => auth()->id(),
            'date_evaluation' => now(),
        ]);

        Notification::create([
            'utilisateur_id' => $encadrement->doctorant_id,
            'titre' => 'Mise à jour d\'avancement',
            'message' => 'Votre encadrant a mis à jour votre taux d\'avancement à ' . $validated['taux_avancement'] . '%',
            'lu' => 0,
            'type' => 'info'
        ]);

        return $this->successResponse($suivi, 'Évaluation et pourcentage enregistrés avec succès', 201);
    }

    /**
     * @OA\Get(
     *     path="/api/my-suivi",
     *     summary="Récupérer l'historique de suivi du doctorant connecté",
     *     tags={"Suivi & Evaluation"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Historique récupéré")
     * )
     */
    public function mySuivi()
    {
        $userId = auth()->id();

        // Trouver l'encadrement du doctorant
        $encadrement = Encadrement::where('doctorant_id', $userId)->first();

        if (!$encadrement) {
            return $this->errorResponse('Aucun encadrement trouvé pour ce doctorant', 404);
        }

        $suivis = SuiviEvaluation::where('encadrement_id', $encadrement->id)
            ->with('createur:id,nom,prenom')
            ->orderBy('date_evaluation', 'desc')
            ->get();

        $latestTaux = $suivis->first()?->taux_avancement ?? 0;

        return $this->successResponse([
            'taux_actuel' => $latestTaux,
            'historique' => $suivis
        ], 'Suivi récupéré');
    }
}
