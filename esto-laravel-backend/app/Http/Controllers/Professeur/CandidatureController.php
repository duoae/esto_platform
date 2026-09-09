<?php

namespace App\Http\Controllers\Professeur;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CandidatureController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        // Fetch candidatures that have a choice for a subject proposed by this professor
        $candidatures = DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->join('utilisateurs', 'candidatures.doctorant_id', '=', 'utilisateurs.id')
            ->leftJoin('laboratoires', 'candidatures.laboratoire_id', '=', 'laboratoires.id')
            ->where('sujets_these.enseignant_id', $userId)
            ->select(
                'candidature_choix.id as choix_id',
                'candidature_choix.statut_choix',
                'sujets_these.titre as sujet_titre',
                'utilisateurs.id as candidat_id',
                'utilisateurs.nom as candidat_nom',
                'utilisateurs.prenom as candidat_prenom',
                'utilisateurs.email as candidat_email',
                'utilisateurs.telephone as candidat_telephone',
                'utilisateurs.specialite',
                'utilisateurs.etablissement_origine as etablissement',
                'candidatures.diplome_obtenu',
                'candidatures.path_cv as cv_path',
                'candidatures.path_bac as bac_path',
                'candidatures.path_bac2 as bac2_path',
                'candidatures.path_licence as licence_path',
                'candidatures.path_master as master_path',
                'laboratoires.nom as labo_nom'
            )
            ->get();

        return response()->json(['success' => true, 'data' => $candidatures]);
    }

    public function updateStatus(Request $request, $choix_id)
    {
        $request->validate([
            'statut_choix' => 'required|in:en_attente,pre_selectionne,accepte,refuse,admis'
        ]);

        // Vérifier que le choix appartient bien à un sujet du professeur
        $userId = Auth::id();
        $choix = DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('candidature_choix.id', $choix_id)
            ->where('sujets_these.enseignant_id', $userId)
            ->first();

        if (!$choix) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        $updateData = [
            'statut_choix' => $request->statut_choix,
            'updated_at' => now()
        ];

        if ($request->statut_choix === 'pre_selectionne') {
            if ($request->has('convocation_date')) {
                $updateData['convocation_date'] = $request->convocation_date;
            }
            if ($request->has('convocation_time')) {
                $updateData['convocation_time'] = $request->convocation_time;
            }
            if ($request->has('convocation_lieu')) {
                $updateData['convocation_lieu'] = $request->convocation_lieu;
            }
        }

        DB::table('candidature_choix')
            ->where('id', $choix_id)
            ->update($updateData);

        if ($request->statut_choix === 'admis') {
            // Get the candidat_id and sujet_id
            $choixInfo = DB::table('candidature_choix')
                ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
                ->where('candidature_choix.id', $choix_id)
                ->select('candidatures.doctorant_id as candidat_id', 'candidature_choix.sujet_id')
                ->first();
            
            if ($choixInfo) {
                // Check if encadrement already exists
                $exists = \App\Models\Encadrement::where('doctorant_id', $choixInfo->candidat_id)
                    ->where('sujet_id', $choixInfo->sujet_id)
                    ->exists();
                
                if (!$exists) {
                    \App\Models\Encadrement::create([
                        'doctorant_id' => $choixInfo->candidat_id,
                        'professeur_id' => $userId,
                        'sujet_id' => $choixInfo->sujet_id,
                        'date_debut' => date('Y-m-d'),
                        'annee_these' => 1
                    ]);

                    // Mettre à jour le rôle du candidat vers doctorant
                    \App\Models\Utilisateur::where('id', $choixInfo->candidat_id)
                        ->update(['role' => 'doctorant']);
                }
            }
        }

        // Notify Candidate
        $fullChoix = DB::table('candidature_choix')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('candidature_choix.id', $choix_id)
            ->select('candidatures.doctorant_id as candidat_id', 'sujets_these.titre')
            ->first();
            
        if ($fullChoix) {
            \App\Models\Notification::create([
                'utilisateur_id' => $fullChoix->candidat_id,
                'type' => 'info',
                'message' => "Le statut de votre candidature pour le sujet '{$fullChoix->titre}' a été mis à jour : " . $request->statut_choix,
                'role_cible' => 'candidat',
                'lien' => '/candidat/mes-choix'
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Statut mis à jour avec succès.']);
    }

    public function notify(Request $request, $candidat_id)
    {
        $request->validate([
            'message' => 'required|string',
            'type' => 'required|string'
        ]);

        DB::table('notifications')->insert([
            'utilisateur_id' => $candidat_id,
            'role_cible' => 'candidat',
            'message' => $request->message,
            'type' => $request->type,
            'lu' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Notification envoyée au candidat.']);
    }

    public function getSuivi($candidat_id)
    {
        $userId = Auth::id();
        
        $encadrement = \App\Models\Encadrement::where('doctorant_id', $candidat_id)
            ->where('professeur_id', $userId)
            ->first();
            
        if (!$encadrement) {
            return response()->json(['success' => true, 'data' => []]);
        }
        
        $evaluations = \App\Models\SuiviEvaluation::where('encadrement_id', $encadrement->id)
            ->orderBy('date_evaluation', 'desc')
            ->get();
            
        return response()->json(['success' => true, 'data' => $evaluations]);
    }

    public function addSuivi(Request $request, $candidat_id)
    {
        $request->validate([
            'type' => 'required|string',
            'note' => 'nullable|string',
            'taux_avancement' => 'required|integer|min:0|max:100',
            'date_evaluation' => 'required|date'
        ]);

        $userId = Auth::id();
        
        $encadrement = \App\Models\Encadrement::where('doctorant_id', $candidat_id)
            ->where('professeur_id', $userId)
            ->first();
            
        if (!$encadrement) {
            return response()->json(['success' => false, 'message' => 'Encadrement introuvable.'], 404);
        }
        
        $evaluation = \App\Models\SuiviEvaluation::create([
            'encadrement_id' => $encadrement->id,
            'type' => $request->type,
            'note' => $request->note,
            'taux_avancement' => $request->taux_avancement,
            'date_evaluation' => $request->date_evaluation,
            'cree_par' => $userId
        ]);
        
        return response()->json(['success' => true, 'message' => 'Évaluation ajoutée avec succès.', 'data' => $evaluation]);
    }
}
