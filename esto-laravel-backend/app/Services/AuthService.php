<?php
namespace App\Services;

use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data)
    {
        $data['mot_de_passe_hash'] = Hash::make($data['password']);
        
        // Handle name splitting if provided as a single 'name' string from frontend
        if (isset($data['name'])) {
            $parts = explode(' ', $data['name'], 2);
            $data['nom'] = $parts[0];
            $data['prenom'] = isset($parts[1]) ? $parts[1] : '';
            unset($data['name']);
        }
        
        if (isset($data['details'])) {
            $data['diplome'] = $data['details']['diplome'] ?? null;
            $data['etablissement_origine'] = $data['details']['etablissement'] ?? null;
            unset($data['details']);
        }
        
        $data['role'] = $data['role'] ?? 'doctorant';
        if (isset($data['lab_id']) && !empty($data['lab_id'])) {
            if (is_numeric($data['lab_id'])) {
                $data['laboratoire_id'] = (int)$data['lab_id'];
            } else {
                $lab = \App\Models\Laboratoire::where('acronyme', $data['lab_id'])->first();
                $data['laboratoire_id'] = $lab ? $lab->id : null;
            }
            unset($data['lab_id']);
        } else {
            unset($data['lab_id']);
        }
        if (isset($data['phone'])) {
            $data['telephone'] = $data['phone'];
            unset($data['phone']);
        }
        unset($data['password']);
        
        $user = Utilisateur::create($data);
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ];
    }

    public function login(array $data)
    {
        $user = Utilisateur::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->mot_de_passe_hash)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ];
    }

    public function logout($user)
    {
        $user->tokens()->delete();
    }
}
