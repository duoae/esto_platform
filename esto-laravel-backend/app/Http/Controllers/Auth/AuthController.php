<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Exception;

/**
 * @OA\Tag(
 *     name="Auth",
 *     description="Authentification et gestion de session"
 * )
 */
class AuthController extends Controller
{
    use ApiResponseTrait;

    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * @OA\Post(
     *     path="/api/register",
     *     summary="Inscription d'un nouvel utilisateur",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password","password_confirmation"},
     *             @OA\Property(property="name", type="string", example="Mohamed El Amrani"),
     *             @OA\Property(property="email", type="string", format="email", example="candidat@esto.umxo.ma"),
     *             @OA\Property(property="password", type="string", format="password", example="password123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Compte créé avec succès"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function register(RegisterRequest $request)
    {
        try {
            $result = $this->authService->register($request->validated());

            return $this->successResponse([
                'access_token' => $result['access_token'] ?? $result['token'],
                'token_type' => 'Bearer',
                'user' => new UserResource($result['user'])
            ], 'Candidature soumise avec succès', 201);
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la création du compte', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Post(
     *     path="/api/login",
     *     summary="Connexion de l'utilisateur",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="candidat@esto.umxo.ma"),
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Connexion réussie"),
     *     @OA\Response(response=422, description="Identifiants invalides"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function login(LoginRequest $request)
    {
        try {
            $result = $this->authService->login($request->validated());

            return $this->successResponse([
                'access_token' => $result['access_token'] ?? $result['token'],
                'token_type' => 'Bearer',
                'user' => new UserResource($result['user'])
            ], 'Connexion réussie');
        } catch (ValidationException $e) {
            return $this->errorResponse('Identifiants invalides', 422, $e->errors());
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la connexion', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Get(
     *     path="/api/me",
     *     summary="Récupérer l'utilisateur connecté",
     *     tags={"Auth"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Profil récupéré avec succès"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function me(Request $request)
    {
        try {
            return $this->successResponse(new UserResource($request->user()), 'Profil récupéré');
        } catch (Exception $e) {
            return $this->errorResponse('Non authentifié', 401);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     summary="Déconnexion de l'utilisateur",
     *     tags={"Auth"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Déconnexion réussie"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->tokens()->delete();
            return $this->successResponse(null, 'Déconnexion réussie');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la déconnexion', 500, $e->getMessage());
        }
    }
}