<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Candidature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CandidatRegisterController extends Controller
{
    public function register(Request $request)
    {
        try {
            DB::statement("ALTER TABLE candidatures MODIFY COLUMN statut VARCHAR(50) DEFAULT 'en_attente'");
            DB::statement("ALTER TABLE candidatures MODIFY COLUMN diplome_obtenu VARCHAR(100) NULL");
            DB::statement("ALTER TABLE utilisateurs MODIFY COLUMN role VARCHAR(50) DEFAULT 'candidat'");
        } catch (\Exception $e) {
        }

        try {
            Schema::table('candidatures', function (Blueprint $table) {
                if (!Schema::hasColumn('candidatures', 'path_cv')) $table->string('path_cv')->nullable();
                if (!Schema::hasColumn('candidatures', 'path_bac')) $table->string('path_bac')->nullable();
                if (!Schema::hasColumn('candidatures', 'path_bac2')) $table->string('path_bac2')->nullable();
                if (!Schema::hasColumn('candidatures', 'path_licence')) $table->string('path_licence')->nullable();
                if (!Schema::hasColumn('candidatures', 'path_master')) $table->string('path_master')->nullable();
                if (!Schema::hasColumn('candidatures', 'sujet_id')) $table->unsignedBigInteger('sujet_id')->nullable();
            });

            $validator = Validator::make($request->all(), [
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:utilisateurs,email',
                'password' => 'required|string|min:6',
                'telephone' => 'required|string',
                'cin' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $userData = [
                'nom' => $request->input('nom'),
                'prenom' => $request->input('prenom'),
                'email' => $request->input('email'),
                'telephone' => $request->input('telephone'),
                'cin' => $request->input('cin'),
                'role' => 'candidat',
            ];

            if (Schema::hasColumn('utilisateurs', 'mot_de_passe_hash')) {
                $userData['mot_de_passe_hash'] = Hash::make($request->input('password'));
            } else {
                $userData['password'] = Hash::make($request->input('password'));
            }

            $user = Utilisateur::create($userData);

            $paths = [];
            foreach (['cv', 'bac', 'bac2', 'master', 'licence'] as $fileKey) {
                if ($request->hasFile($fileKey)) {
                    $paths['path_' . $fileKey] = $request->file($fileKey)->store('candidatures/' . $user->id, 'public');
                }
            }

            $candidature = new Candidature();
            $candidature->doctorant_id = $user->id;
            $candidature->laboratoire_id = $request->input('laboratoire_id', 5);
            $candidature->diplome_obtenu = $request->input('diplome_obtenu', 'Master');
            $candidature->statut = 'en_attente';
            
            if ($request->filled('sujet_id')) {
                $candidature->sujet_id = $request->input('sujet_id');
            }

            if (isset($paths['path_cv'])) $candidature->path_cv = $paths['path_cv'];
            if (isset($paths['path_bac'])) $candidature->path_bac = $paths['path_bac'];
            if (isset($paths['path_bac2'])) $candidature->path_bac2 = $paths['path_bac2'];
            if (isset($paths['path_licence'])) $candidature->path_licence = $paths['path_licence'];
            if (isset($paths['path_master'])) $candidature->path_master = $paths['path_master'];

            $candidature->save();

            DB::commit();

            $token = $user->createToken('candidat_token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
                'message' => 'Inscription réussie.'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur Serveur',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }
}