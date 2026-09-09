<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Candidature;
use App\Models\SujetThese;

class CandidatController extends Controller
{
    public function profile(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'candidat' && $user->role !== 'doctorant') {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        $candidature = Candidature::where('doctorant_id', $user->id)->first();
        $laboratoire = null;
        if ($candidature && $candidature->laboratoire_id) {
            $laboratoire = DB::table('laboratoires')->where('id', $candidature->laboratoire_id)->first();
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'candidature' => $candidature,
            'laboratoire' => $laboratoire
        ]);
    }

    public function mesChoix(Request $request)
    {
        $user = $request->user();
        $candidature = Candidature::where('doctorant_id', $user->id)->first();

        if (!$candidature) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $choix = DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->leftJoin('utilisateurs as profs', 'sujets_these.enseignant_id', '=', 'profs.id')
            ->leftJoin('laboratoires', 'sujets_these.laboratoire_id', '=', 'laboratoires.id')
            ->where('candidature_choix.candidature_id', $candidature->id)
            ->select(
                'candidature_choix.id as choix_id',
                'candidature_choix.statut_choix',
                'candidature_choix.convocation_date',
                'candidature_choix.convocation_time',
                'candidature_choix.convocation_lieu',
                'sujets_these.id as sujet_id',
                'sujets_these.titre',
                'sujets_these.objectif',
                'laboratoires.nom as lab',
                'profs.nom as proposer_name'
            )
            ->get();

        return response()->json(['success' => true, 'data' => $choix]);
    }

    public function postuler(Request $request)
    {
        $request->validate([
            'sujet_id' => 'required|exists:sujets_these,id'
        ]);

        $user = $request->user();
        $candidature = Candidature::where('doctorant_id', $user->id)->first();

        if (!$candidature) {
            return response()->json(['message' => 'Dossier de candidature introuvable.'], 404);
        }

        // Vérifier si le candidat a déjà postulé à ce sujet
        $dejaPostule = DB::table('candidature_choix')
            ->where('candidature_id', $candidature->id)
            ->where('sujet_id', $request->sujet_id)
            ->exists();

        if ($dejaPostule) {
            return response()->json(['message' => 'Vous avez déjà postulé à ce sujet.'], 400);
        }

        // Vérifier la limite de 3 choix
        $count = DB::table('candidature_choix')
            ->where('candidature_id', $candidature->id)
            ->count();

        if ($count >= 3) {
            return response()->json(['message' => 'Vous avez atteint la limite maximale de 3 candidatures.'], 400);
        }

        DB::table('candidature_choix')->insert([
            'candidature_id' => $candidature->id,
            'sujet_id' => $request->sujet_id,
            'statut_choix' => 'en_attente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sujet = SujetThese::find($request->sujet_id);
        if ($sujet && $sujet->enseignant_id) {
            \App\Models\Notification::create([
                'utilisateur_id' => $sujet->enseignant_id,
                'type' => 'info',
                'message' => "Nouvelle candidature reçue pour votre sujet : " . $sujet->titre,
                'role_cible' => 'professeur',
                'lien' => '/professeur/candidatures'
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Candidature soumise avec succès.']);
    }

    public function notifications(Request $request)
    {
        $userId = $request->user()->id;
        $notifications = DB::table('notifications')
            ->where('utilisateur_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }
}
