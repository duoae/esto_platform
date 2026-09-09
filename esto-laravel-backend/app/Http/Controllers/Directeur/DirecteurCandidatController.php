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
}
