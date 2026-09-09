<?php

namespace App\Http\Controllers\Doctorant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ActiviteDoctorat;
use App\Models\Encadrement;

class ActiviteController extends Controller
{
    public function getStats()
    {
        $userId = Auth::id();
        $encadrement = Encadrement::where('doctorant_id', $userId)->first();
        
        if (!$encadrement) {
            return response()->json(['success' => false, 'message' => 'Aucun encadrement trouvé.']);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_heures' => $encadrement->total_heures,
                'total_points' => $encadrement->total_points,
                'statut_these' => $encadrement->statut_these
            ]
        ]);
    }

    public function getActivites()
    {
        $userId = Auth::id();
        $encadrement = Encadrement::where('doctorant_id', $userId)->first();
        
        if (!$encadrement) {
            return response()->json(['success' => true, 'data' => []]);
        }
        
        $activites = ActiviteDoctorat::where('encadrement_id', $encadrement->id)
                        ->orderBy('created_at', 'desc')
                        ->get();
                        
        return response()->json(['success' => true, 'data' => $activites]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'heures' => 'nullable|numeric|min:0',
            'fichiers.*' => 'file|mimes:pdf|max:5120',
        ]);

        $userId = Auth::id();
        $encadrement = Encadrement::where('doctorant_id', $userId)->first();
        
        if (!$encadrement) {
            return response()->json(['success' => false, 'message' => 'Aucun encadrement trouvé.'], 403);
        }

        if (!\Illuminate\Support\Facades\Schema::hasColumn('activites_doctorat', 'fichiers')) {
            \Illuminate\Support\Facades\Schema::table('activites_doctorat', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->json('fichiers')->nullable()->after('pdf_path');
            });
        }

        $paths = [];
        if ($request->hasFile('fichiers')) {
            foreach ($request->file('fichiers') as $file) {
                $paths[] = $file->store('activites', 'public');
            }
        } else if ($request->hasFile('fichier')) {
            // Backward compatibility
            $paths[] = $request->file('fichier')->store('activites', 'public');
        }

        // Calcul des points basé sur le barème
        $points = 0;
        if ($request->type === 'Article Journal') $points = 1.0;
        elseif ($request->type === 'Conference Paper') $points = 0.5;
        elseif ($request->type === 'Communication Orale') $points = 0.5;
        elseif ($request->type === 'Poster') $points = 0.25;
        // else Formation -> 0 points (only hours matter)

        $activite = ActiviteDoctorat::create([
            'encadrement_id' => $encadrement->id,
            'type' => $request->type,
            'titre' => $request->titre,
            'description' => $request->description,
            'heures' => $request->heures ?: 0,
            'points' => $points,
            'pdf_path' => count($paths) > 0 ? $paths[0] : null,
            'fichiers' => json_encode($paths),
            'statut' => 'en_attente'
        ]);

        if ($encadrement->professeur_id) {
            \App\Models\Notification::create([
                'utilisateur_id' => $encadrement->professeur_id,
                'type' => 'info',
                'message' => "Nouvelle activité de suivi ajoutée par " . Auth::user()->nom . " : " . $request->titre,
                'role_cible' => 'professeur',
                'lien' => "/professeur/candidat/{$encadrement->doctorant_id}/suivi"
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Activité soumise avec succès. En attente de validation par votre encadrant.',
            'data' => $activite
        ]);
    }
}
