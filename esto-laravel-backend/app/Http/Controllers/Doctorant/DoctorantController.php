<?php

namespace App\Http\Controllers\Doctorant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Encadrement;

class DoctorantController extends Controller
{
    public function monEncadrant()
    {
        $userId = Auth::id();
        $encadrement = Encadrement::with(['professeur', 'sujet'])
            ->where('doctorant_id', $userId)
            ->first();
            
        if (!$encadrement) {
            $allMyEncadrements = Encadrement::where('doctorant_id', $userId)->get();
            $allEncadrements = Encadrement::all();
            
            return response()->json([
                'success' => false, 
                'message' => 'Aucun encadrement trouvé.',
                'debug_user_id' => $userId,
                'debug_my_encadrements' => $allMyEncadrements,
                'debug_all_encadrements' => $allEncadrements
            ]);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'professeur' => $encadrement->professeur,
                'sujet' => $encadrement->sujet,
                'date_debut' => $encadrement->created_at
            ]
        ]);
    }
}
