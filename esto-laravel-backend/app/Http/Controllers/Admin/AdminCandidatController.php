<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCandidatController extends Controller
{
    public function index()
    {
        // Fetch candidates with their dossier and choices
        $candidates = DB::table('utilisateurs')
            ->where('role', 'candidat')
            ->whereNotIn('utilisateurs.id', function($query) {
                $query->select('doctorant_id')->from('encadrements');
            })
            ->leftJoin('candidatures', 'utilisateurs.id', '=', 'candidatures.doctorant_id')
            ->leftJoin('laboratoires', 'candidatures.laboratoire_id', '=', 'laboratoires.id')
            ->select(
                'utilisateurs.id as user_id',
                'utilisateurs.nom',
                'utilisateurs.prenom',
                'utilisateurs.email',
                'utilisateurs.telephone',
                'candidatures.id as candidature_id',
                'candidatures.diplome_obtenu',
                'candidatures.path_cv',
                'candidatures.path_bac',
                'candidatures.path_master',
                'candidatures.created_at as candidature_date',
                'laboratoires.nom as labo_nom'
            )
            ->orderBy('candidatures.created_at', 'desc')
            ->orderBy('utilisateurs.id', 'desc')
            ->get();

        foreach ($candidates as $candidate) {
            if ($candidate->candidature_id) {
                $candidate->choix = DB::table('candidature_choix')
                    ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
                    ->select('candidature_choix.id as choix_id', 'candidature_choix.statut_choix', 'sujets_these.titre')
                    ->where('candidature_choix.candidature_id', $candidate->candidature_id)
                    ->get();
            } else {
                $candidate->choix = [];
            }
        }

        return response()->json(['success' => true, 'data' => $candidates]);
    }

    public function updateStatus(Request $request, $choix_id)
    {
        $request->validate([
            'statut_choix' => 'required|in:en_attente,accepte,refuse,admis'
        ]);

        DB::table('candidature_choix')
            ->where('id', $choix_id)
            ->update([
                'statut_choix' => $request->statut_choix,
                'updated_at' => now()
            ]);

        return response()->json(['success' => true, 'message' => 'Statut mis à jour avec succès.']);
    }
}
