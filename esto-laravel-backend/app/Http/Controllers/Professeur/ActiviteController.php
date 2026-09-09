<?php

namespace App\Http\Controllers\Professeur;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ActiviteDoctorat;
use App\Models\Encadrement;

class ActiviteController extends Controller
{
    public function getActivites($doctorant_id)
    {
        $userId = Auth::id();
        $encadrement = Encadrement::where('doctorant_id', $doctorant_id)
            ->where('professeur_id', $userId)
            ->first();
            
        if (!$encadrement) {
            return response()->json(['success' => false, 'message' => 'Encadrement introuvable.'], 404);
        }
        
        $activites = ActiviteDoctorat::where('encadrement_id', $encadrement->id)
                        ->orderBy('created_at', 'desc')
                        ->get();
                        
        return response()->json([
            'success' => true, 
            'data' => [
                'activites' => $activites,
                'stats' => [
                    'total_heures' => $encadrement->total_heures,
                    'total_points' => $encadrement->total_points,
                    'statut_these' => $encadrement->statut_these
                ]
            ]
        ]);
    }

    public function valider($id)
    {
        $userId = Auth::id();
        $activite = ActiviteDoctorat::with('encadrement')->find($id);
        
        if (!$activite || $activite->encadrement->professeur_id != $userId) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }
        
        if ($activite->statut === 'valide') {
            return response()->json(['success' => false, 'message' => 'Déjà validée.']);
        }

        $activite->statut = 'valide';
        $activite->save();

        $encadrement = $activite->encadrement;
        $encadrement->total_heures += $activite->heures;
        $encadrement->total_points += $activite->points;

        if ($encadrement->total_heures >= 200 && $encadrement->total_points >= 2.0) {
            $encadrement->statut_these = 'eligible_soutenance';
        }

        $encadrement->save();

        \App\Models\Notification::create([
            'utilisateur_id' => $encadrement->doctorant_id,
            'type' => 'success',
            'message' => "Votre activité '{$activite->titre}' a été validée par votre encadrant.",
            'role_cible' => 'doctorant',
            'lien' => '/doctorant/suivi'
        ]);

        return response()->json(['success' => true, 'message' => 'Activité validée avec succès.']);
    }

    public function refuser(Request $request, $id)
    {
        $request->validate([
            'motif' => 'required|string'
        ]);

        $userId = Auth::id();
        $activite = ActiviteDoctorat::with('encadrement')->find($id);
        
        if (!$activite || $activite->encadrement->professeur_id != $userId) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }
        
        if ($activite->statut === 'valide') {
            return response()->json(['success' => false, 'message' => 'Impossible de refuser une activité déjà validée.']);
        }

        $activite->statut = 'refuse';
        $activite->motif_refus = $request->motif;
        $activite->save();

        \App\Models\Notification::create([
            'utilisateur_id' => $activite->encadrement->doctorant_id,
            'type' => 'error',
            'message' => "Votre activité '{$activite->titre}' a été refusée. Motif : " . $request->motif,
            'role_cible' => 'doctorant',
            'lien' => '/doctorant/suivi'
        ]);

        return response()->json(['success' => true, 'message' => 'Activité refusée.']);
    }
}
