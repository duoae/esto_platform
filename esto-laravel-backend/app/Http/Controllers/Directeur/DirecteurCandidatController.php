<?php

namespace App\Http\Controllers\Directeur;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class DirecteurCandidatController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Ensure the user is a directeur and has a lab assigned
        if ($user->role !== 'directeur' || !$user->laboratoire_id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé ou aucun laboratoire assigné.'], 403);
        }

        $labId = $user->laboratoire_id;

        // Fetch candidates who applied to subjects in this lab
        $candidatures = DB::table('candidature_choix')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->join('utilisateurs as candidat', 'candidatures.doctorant_id', '=', 'candidat.id')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->leftJoin('utilisateurs as prof', 'sujets_these.enseignant_id', '=', 'prof.id')
            ->where('sujets_these.laboratoire_id', $labId)
            ->select(
                'candidat.*',
                'candidat.photo_profil',
                'candidatures.id as candidature_id',
                'candidatures.diplome_obtenu',
                'candidatures.path_cv',
                'candidatures.path_bac',
                'candidatures.path_bac2',
                'candidatures.path_licence',
                'candidatures.path_master',
                'candidature_choix.id as choix_id',
                'candidature_choix.statut_choix',
                'candidature_choix.created_at as date_candidature',
                'sujets_these.id as sujet_id',
                'sujets_these.titre as sujet_titre',
                'prof.nom as prof_nom',
                'prof.prenom as prof_prenom'
            )
            ->orderBy('candidature_choix.created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $candidatures
        ]);
    }

    public function updateStatus(Request $request, $choix_id)
    {
        $user = Auth::user();

        if ($user->role !== 'directeur' || !$user->laboratoire_id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        $request->validate([
            'statut_choix' => 'required|in:admis,refuse'
        ]);

        // Verify the candidature belongs to this lab
        $choix = DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('candidature_choix.id', $choix_id)
            ->where('sujets_these.laboratoire_id', $user->laboratoire_id)
            ->first();

        if (!$choix) {
            return response()->json(['success' => false, 'message' => 'Non autorisé ou candidature introuvable.'], 403);
        }

        DB::table('candidature_choix')
            ->where('id', $choix_id)
            ->update(['statut_choix' => $request->statut_choix, 'updated_at' => now()]);

        // If admis -> create encadrement and switch role to doctorant
        if ($request->statut_choix === 'admis') {
            $choixInfo = DB::table('candidature_choix')
                ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
                ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
                ->where('candidature_choix.id', $choix_id)
                ->select('candidatures.doctorant_id as candidat_id', 'candidature_choix.sujet_id', 'sujets_these.enseignant_id as prof_id')
                ->first();

            if ($choixInfo) {
                $exists = \App\Models\Encadrement::where('doctorant_id', $choixInfo->candidat_id)
                    ->where('sujet_id', $choixInfo->sujet_id)
                    ->exists();

                if (!$exists) {
                    \App\Models\Encadrement::create([
                        'doctorant_id' => $choixInfo->candidat_id,
                        'professeur_id' => $choixInfo->prof_id,
                        'sujet_id' => $choixInfo->sujet_id,
                        'date_debut' => date('Y-m-d'),
                        'annee_these' => 1
                    ]);

                    \App\Models\Utilisateur::where('id', $choixInfo->candidat_id)
                        ->update(['role' => 'doctorant']);
                }
            }
        }

        // Notify candidate
        $fullChoix = DB::table('candidature_choix')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('candidature_choix.id', $choix_id)
            ->select('candidatures.doctorant_id as candidat_id', 'sujets_these.titre')
            ->first();

        if ($fullChoix) {
            \App\Models\Notification::create([
                'utilisateur_id' => $fullChoix->candidat_id,
                'type' => $request->statut_choix === 'admis' ? 'success' : 'warning',
                'message' => $request->statut_choix === 'admis'
                    ? "Félicitations ! Vous avez été admis pour le sujet '{$fullChoix->titre}'."
                    : "Votre candidature pour le sujet '{$fullChoix->titre}' a été refusée par le directeur du laboratoire.",
                'role_cible' => 'candidat',
                'lien' => '/candidat/mes-choix'
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Statut mis à jour avec succès.']);
    }
}
