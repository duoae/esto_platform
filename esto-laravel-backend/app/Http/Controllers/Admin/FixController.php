<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use App\Models\Encadrement;

class FixController extends Controller
{
    public function runMigrate()
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasColumn('activites_doctorat', 'fichiers')) {
                \Illuminate\Support\Facades\Schema::table('activites_doctorat', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->json('fichiers')->nullable()->after('pdf_path');
                });
                return response()->json(['output' => 'Column added.']);
            }
            return response()->json(['output' => 'Column already exists.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()]);
        }
    }

    public function fixEncadrements()
    {
        $admisChoices = DB::table('candidature_choix')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('candidature_choix.statut_choix', 'admis')
            ->select(
                'candidature_choix.id as choix_id',
                'candidatures.doctorant_id as candidat_id',
                'candidature_choix.sujet_id',
                'sujets_these.enseignant_id as professeur_id'
            )
            ->get();

        $count = 0;
        $created = [];
        foreach ($admisChoices as $choix) {
            $exists = Encadrement::where('doctorant_id', $choix->candidat_id)
                ->where('sujet_id', $choix->sujet_id)
                ->exists();

            if (!$exists && $choix->candidat_id) {
                Encadrement::create([
                    'doctorant_id' => $choix->candidat_id,
                    'professeur_id' => $choix->professeur_id,
                    'sujet_id' => $choix->sujet_id,
                    'date_debut' => date('Y-m-d'),
                    'annee_these' => 1
                ]);
                $count++;
                $created[] = $choix;
            }
        }

        $allChoices = DB::table('candidature_choix')
            ->select('id', 'statut_choix', 'candidature_id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "$count encadrements manquants ont été créés et réparés.",
            'admis' => $admisChoices,
            'all' => $allChoices,
            'created' => $created
        ]);
    }
}
