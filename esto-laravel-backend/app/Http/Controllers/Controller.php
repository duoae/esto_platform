<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="ESTO Plateforme Doctorale API",
 *     description="API REST complète de la Plateforme de Gestion Doctorale — École Supérieure de Technologie d'Oujda (UMP)",
 *     @OA\Contact(email="admin@ump.ac.ma")
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="Serveur de développement local"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 *
 * @OA\Tag(name="Auth", description="Authentification et gestion de session")
 * @OA\Tag(name="Laboratoires", description="Gestion des laboratoires de recherche")
 * @OA\Tag(name="Sujets", description="Gestion des sujets de thèse")
 * @OA\Tag(name="Utilisateurs", description="Gestion des utilisateurs")
 */
abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
