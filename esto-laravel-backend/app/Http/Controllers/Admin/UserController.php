<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Exception;

class UserController extends Controller
{
    use ApiResponseTrait;

    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * @OA\Get(
     *     path="/api/users",
     *     tags={"Utilisateurs"},
     *     summary="Lister tous les utilisateurs",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="role", in="query", required=false, description="Filtrer par rôle (admin, directeur, professeur, candidat)", @OA\Schema(type="string")),
     *     @OA\Parameter(name="lab_id", in="query", required=false, description="Filtrer par laboratoire", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Liste des utilisateurs"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function index(Request $request)
    {
        try {
            $users = $this->userService->getAllUsers($request->role, $request->lab_id);
            return $this->successResponse(UserResource::collection($users), 'Utilisateurs récupérés avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la récupération des utilisateurs', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Post(
     *     path="/api/users",
     *     tags={"Utilisateurs"},
     *     summary="Créer un nouvel utilisateur (Admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nom","prenom","email","password","role"},
     *             @OA\Property(property="nom", type="string", example="Benali"),
     *             @OA\Property(property="prenom", type="string", example="Youssef"),
     *             @OA\Property(property="email", type="string", format="email", example="y.benali@esto.ma"),
     *             @OA\Property(property="password", type="string", example="Password123!"),
     *             @OA\Property(property="role", type="string", enum={"admin","directeur","professeur","candidat"}, example="professeur"),
     *             @OA\Property(property="laboratoire_id", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Utilisateur créé"),
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(StoreUserRequest $request)
    {
        try {
            $user = $this->userService->createUser($request->validated());
            
            \App\Models\Notification::create([
                'utilisateur_id' => $user->id,
                'type' => 'success',
                'message' => 'Bienvenue sur la plateforme ESTO CEDoc ! Votre compte a été configuré avec succès.',
                'role_cible' => $user->role
            ]);

            return $this->successResponse(new UserResource($user), 'Utilisateur créé avec succès', 201);
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la création de l\'utilisateur', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Put(
     *     path="/api/users/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Modifier un utilisateur",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nom", type="string"),
     *             @OA\Property(property="prenom", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="role", type="string", enum={"admin","directeur","professeur","candidat"}),
     *             @OA\Property(property="laboratoire_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Utilisateur mis à jour"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(UpdateUserRequest $request, $id)
    {
        try {
            $user = $this->userService->updateUser($id, $request->validated());
            return $this->successResponse(new UserResource($user), 'Utilisateur mis à jour avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la mise à jour de l\'utilisateur', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/users/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Supprimer un utilisateur",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\Response(response=200, description="Utilisateur supprimé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($id)
    {
        try {
            $this->userService->deleteUser($id);
            return $this->successResponse(null, 'Utilisateur supprimé avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la suppression de l\'utilisateur', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Get(
     *     path="/api/stats",
     *     tags={"Utilisateurs"},
     *     summary="Statistiques globales du tableau de bord Admin",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Statistiques: nombre d'utilisateurs, labs, sujets, candidatures par statut"
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function getStats()
    {
        try {
            $stats = $this->userService->getUserStats();
            return $this->successResponse($stats, 'Statistiques récupérées avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la récupération des statistiques', 500, $e->getMessage());
        }
    }
}
