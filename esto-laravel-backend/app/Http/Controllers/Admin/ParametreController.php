<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Parametre;
use Illuminate\Http\Request;

class ParametreController extends Controller
{
    public function index()
    {
        $parametres = Parametre::all()->pluck('valeur', 'cle');
        return response()->json($parametres);
    }

    public function update(Request $request)
    {
        $data = $request->all();
        foreach ($data as $cle => $valeur) {
            Parametre::where('cle', $cle)->update(['valeur' => $valeur]);
        }
        return response()->json(['success' => true, 'message' => 'Paramètres mis à jour avec succès.']);
    }
}
