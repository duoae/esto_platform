<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;

/**
 * @OA\Tag(
 *     name="Notifications",
 *     description="Gestion des notifications"
 * )
 */
class NotificationController extends Controller
{
    use ApiResponseTrait;

    /**
     * @OA\Get(
     *     path="/api/notifications",
     *     summary="Lister les notifications de l'utilisateur",
     *     tags={"Notifications"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Succès")
     * )
     */
    public function index()
    {
        $notifications = Notification::where('utilisateur_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($notifications, 'Notifications récupérées');
    }

    /**
     * @OA\Put(
     *     path="/api/notifications/{id}/read",
     *     summary="Marquer une notification comme lue",
     *     tags={"Notifications"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Marquée comme lue")
     * )
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('utilisateur_id', auth()->id())->findOrFail($id);
        $notification->lu = 1;
        $notification->save();

        return $this->successResponse($notification, 'Notification marquée comme lue');
    }
}
