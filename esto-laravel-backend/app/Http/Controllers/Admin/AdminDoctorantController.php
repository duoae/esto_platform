<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDoctorantController extends Controller
{
    public function index()
    {
        $doctorants = DB::table('utilisateurs')
            ->where('utilisateurs.role', 'candidat')
            ->join('encadrements', 'utilisateurs.id', '=', 'encadrements.doctorant_id')
            ->leftJoin('candidatures', 'utilisateurs.id', '=', 'candidatures.doctorant_id')
            ->leftJoin('laboratoires', 'candidatures.laboratoire_id', '=', 'laboratoires.id')
            ->leftJoin('utilisateurs as profs', 'encadrements.professeur_id', '=', 'profs.id')
            ->leftJoin('sujets_these', 'encadrements.sujet_id', '=', 'sujets_these.id')
            ->select(
                'utilisateurs.id',
                'utilisateurs.nom',
                'utilisateurs.prenom',
                'utilisateurs.email',
                'utilisateurs.telephone',
                'laboratoires.nom as labo_nom',
                'profs.nom as prof_nom',
                'profs.prenom as prof_prenom',
                'sujets_these.titre as sujet_titre',
                'candidatures.path_cv',
                'candidatures.path_bac',
                'candidatures.path_bac2',
                'candidatures.path_licence',
                'candidatures.path_master',
                'utilisateurs.photo_profil',
                'profs.photo_profil as prof_photo'
            )
            ->orderBy('utilisateurs.nom')
            ->get();

        return response()->json(['success' => true, 'data' => $doctorants]);
    }
}
