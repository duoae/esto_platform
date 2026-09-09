<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Services\LabService;
use App\Services\UserService;
use App\Http\Requests\StoreLabRequest;
use App\Http\Requests\UpdateLabRequest;
use App\Http\Resources\LabResource;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponseTrait;
use Exception;

class LabController extends Controller
{
    use ApiResponseTrait;

    protected $labService;
    protected $userService;

    public function __construct(LabService $labService, UserService $userService)
    {
        $this->labService = $labService;
        $this->userService = $userService;
    }

    /**
     * @OA\Get(
     *     path="/api/labs",
     *     tags={"Laboratoires"},
     *     summary="Lister tous les laboratoires",
     *     @OA\Response(response=200, description="Liste des laboratoires")
     * )
     */
    public function index()
    {
        try {
            $labs = $this->labService->getAllLabs();
            
            // Auto-fix database if directeur_id is missing
            foreach ($labs as $lab) {
                if (empty($lab->directeur_id)) {
                    $dir = $lab->membres()->whereRaw('LOWER(role) = ?', ['directeur'])->first();
                    if ($dir) {
                        $lab->directeur_id = $dir->id;
                        $lab->save();
                    }
                }
            }
            
            return $this->successResponse(LabResource::collection($labs), 'Laboratoires récupérés avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la récupération des laboratoires', 500, $e->getMessage());
        }
    }

    public function show($id)
    {
        try {
            $lab = $this->labService->getLabById($id);
            
            // Auto-fix database if directeur_id is missing but we have a director in members
            if (empty($lab->directeur_id)) {
                $dir = $lab->membres()->whereRaw('LOWER(role) = ?', ['directeur'])->first();
                if ($dir) {
                    $lab->directeur_id = $dir->id;
                    $lab->save();
                    // Reload the relation so it shows up immediately in the response
                    $lab->load('directeur');
                }
            }

            return $this->successResponse($lab, 'Laboratoire récupéré avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la récupération du laboratoire', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Post(
     *     path="/api/labs",
     *     tags={"Laboratoires"},
     *     summary="Créer un nouveau laboratoire",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nom","code"},
     *             @OA\Property(property="nom", type="string", example="Laboratoire Informatique"),
     *             @OA\Property(property="code", type="string", example="LI-01"),
     *             @OA\Property(property="description", type="string", example="Laboratoire de recherche en informatique"),
     *             @OA\Property(property="capacite_max", type="integer", example=10)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Laboratoire créé"),
     *     @OA\Response(response=422, description="Données invalides"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(StoreLabRequest $request)
    {
        try {
            $lab = $this->labService->createLab($request->validated());
            return $this->successResponse(new LabResource($lab), 'Laboratoire créé avec succès', 201);
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la création du laboratoire', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Put(
     *     path="/api/labs/{id}",
     *     tags={"Laboratoires"},
     *     summary="Modifier un laboratoire",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nom", type="string", example="Nouveau nom"),
     *             @OA\Property(property="code", type="string", example="LI-02"),
     *             @OA\Property(property="description", type="string"),
     *             @OA\Property(property="capacite_max", type="integer", example=15)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Laboratoire mis à jour"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(UpdateLabRequest $request, $id)
    {
        try {
            $lab = $this->labService->updateLab($id, $request->validated());
            return $this->successResponse(new LabResource($lab), 'Laboratoire mis à jour avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la mise à jour du laboratoire', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/labs/{id}",
     *     tags={"Laboratoires"},
     *     summary="Supprimer un laboratoire",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\Response(response=200, description="Laboratoire supprimé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($id)
    {
        try {
            $this->labService->deleteLab($id);
            return $this->successResponse(null, 'Laboratoire supprimé avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la suppression du laboratoire', 500, $e->getMessage());
        }
    }

    /**
     * @OA\Get(
     *     path="/api/labs/{id}/members",
     *     tags={"Laboratoires"},
     *     summary="Lister les membres d'un laboratoire",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), example=1),
     *     @OA\Response(response=200, description="Liste des membres du laboratoire"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function getMembers($id)
    {
        try {
            $members = $this->userService->getAllUsers(null, (string)$id);
            return $this->successResponse(UserResource::collection($members), 'Membres récupérés avec succès');
        } catch (Exception $e) {
            return $this->errorResponse('Erreur lors de la récupération des membres', 500, $e->getMessage());
        }
    }
}
