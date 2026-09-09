<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Traits\ApiResponseTrait;
use App\Models\User;

/**
 * @OA\Tag(
 *     name="Profil",
 *     description="Gestion du profil utilisateur"
 * )
 */
class ProfileController extends Controller
{
    use ApiResponseTrait;

    /**
     * @OA\Get(
     *     path="/api/profil",
     *     summary="Afficher les informations du profil",
     *     tags={"Profil"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Informations du profil")
     * )
     */
    public function show(Request $request)
    {
        return $this->successResponse($request->user(), 'Informations du profil');
    }

    /**
     * @OA\Put(
     *     path="/api/profil",
     *     summary="Mettre à jour les informations du profil",
     *     tags={"Profil"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Nouveau Nom"),
     *             @OA\Property(property="email", type="string", format="email", example="email@test.com")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Profil mis à jour avec succès")
     * )
     */
    public function update(Request $request)
    {
        $user = clone $request->user();
        
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'sometimes|email|unique:utilisateurs,email,' . $user->id,
            'telephone' => 'sometimes|nullable|string|max:50',
            'specialite' => 'sometimes|nullable|string|max:255',
        ]);

        $request->user()->update($validated);

        \App\Models\Notification::create([
            'utilisateur_id' => $request->user()->id,
            'message' => 'Vos informations de profil ont été mises à jour avec succès.',
            'type' => 'info'
        ]);

        return $this->successResponse($request->user(), 'Profil mis à jour avec succès');
    }

    /**
     * @OA\Put(
     *     path="/api/profil/password",
     *     summary="Modifier le mot de passe",
     *     tags={"Profil"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"current_password", "new_password", "new_password_confirmation"},
     *             @OA\Property(property="current_password", type="string", format="password"),
     *             @OA\Property(property="new_password", type="string", format="password"),
     *             @OA\Property(property="new_password_confirmation", type="string", format="password")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Mot de passe modifié avec succès"),
     *     @OA\Response(response=422, description="Validation failed")
     * )
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('Le mot de passe actuel est incorrect.', 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        \App\Models\Notification::create([
            'utilisateur_id' => $user->id,
            'message' => 'Votre mot de passe a été modifié avec succès.',
            'type' => 'info'
        ]);

        return $this->successResponse(null, 'Mot de passe modifié avec succès');
    }

    /**
     * @OA\Post(
     *     path="/api/profil/photo",
     *     summary="Uploader une photo de profil",
     *     tags={"Profil"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="photo", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Photo de profil mise à jour")
     * )
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Delete old photo if it exists
            if ($user->photo_profil && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->photo_profil)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->photo_profil);
            }
            
            $path = $file->storeAs('profiles', $filename, 'public');
            
            $user->update([
                'photo_profil' => $path
            ]);

            \App\Models\Notification::create([
                'utilisateur_id' => $user->id,
                'message' => 'Votre photo de profil a été mise à jour avec succès.',
                'type' => 'info'
            ]);

            return $this->successResponse(['photo_profil' => $path], 'Photo de profil mise à jour avec succès');
        }

        return $this->errorResponse('Aucun fichier fourni', 400);
    }

    /**
     * @OA\Delete(
     *     path="/api/profil/photo",
     *     summary="Supprimer la photo de profil",
     *     tags={"Profil"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Photo de profil supprimée")
     * )
     */
    public function deletePhoto(Request $request)
    {
        $user = $request->user();

        if ($user->photo_profil) {
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($user->photo_profil)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->photo_profil);
            }
            
            $user->update([
                'photo_profil' => null
            ]);

            return $this->successResponse(null, 'Photo de profil supprimée avec succès');
        }

        return $this->errorResponse('Aucune photo de profil à supprimer', 404);
    }
}
