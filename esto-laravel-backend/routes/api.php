<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\StatsController;
use App\Http\Controllers\Admin\AdminCandidatController;
use App\Http\Controllers\Domain\LabController;
use App\Http\Controllers\Domain\SubjectController;
use App\Http\Controllers\Domain\EncadrementController;
use App\Http\Controllers\Professeur\CandidatureController as ProfCandidatureController;
use App\Http\Controllers\CandidatController;
use App\Http\Controllers\Domain\NotificationController;
use App\Http\Controllers\Domain\ProfileController;

use App\Http\Controllers\Auth\CandidatRegisterController;

// Public routes


Route::get('/laboratoires/{id}/sujets', function ($id) {
    return \App\Models\SujetThese::where('laboratoire_id', $id)
                                 ->where('statut', 'ouvert')
                                 ->get(['id', 'titre']);
});



Route::post('/register', [AuthController::class, 'register']);
Route::post('/register-candidat', [CandidatRegisterController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/labs', [LabController::class, 'index']);
Route::get('/labs/{lab}', [LabController::class, 'show']);
Route::get('/subjects', [SubjectController::class, 'index']);

// Chatbot (AI) - Accessible publiquement
Route::post('/chatbot/ask', [\App\Http\Controllers\ChatbotController::class, 'ask']);

// Public Stats for Home Page
Route::get('/public-stats', function () {
    $laboratoires = \App\Models\Laboratoire::count();
    $equipes = \App\Models\EquipeRecherche::count();
    $doctorants = \App\Models\Utilisateur::where('role', 'doctorant')->count();
    $professeurs = \App\Models\Utilisateur::where('role', 'professeur')->count();
    
    return response()->json([
        'laboratoires' => $laboratoires > 0 ? $laboratoires : 4,
        'equipes' => $equipes > 0 ? $equipes : 13,
        'doctorants' => $doctorants > 0 ? $doctorants : 180,
        'professeurs' => $professeurs > 0 ? $professeurs : 40
    ]);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // User management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::get('/stats', [UserController::class, 'getStats']);

    // Admin Candidates
    Route::get('/admin/candidats', [AdminCandidatController::class, 'index']);
    Route::put('/admin/candidats/choix/{choix_id}', [AdminCandidatController::class, 'updateStatus']);
    Route::get('/admin/doctorants', [\App\Http\Controllers\Admin\AdminDoctorantController::class, 'index']);

    // Admin Settings & Logs
    Route::get('/admin/parametres', [\App\Http\Controllers\Admin\ParametreController::class, 'index']);
    Route::put('/admin/parametres', [\App\Http\Controllers\Admin\ParametreController::class, 'update']);
    Route::get('/admin/chatbot-logs', [\App\Http\Controllers\Admin\ChatbotLogController::class, 'index']);
    // Directeur Candidates
    Route::get('/directeur/candidats', [\App\Http\Controllers\Directeur\DirecteurCandidatController::class, 'index']);

    // Lab extra CRUD
    Route::post('/labs', [LabController::class, 'store']);
    Route::put('/labs/{lab}', [LabController::class, 'update']);
    Route::delete('/labs/{lab}', [LabController::class, 'destroy']);
    Route::get('/labs/{lab}/members', [LabController::class, 'getMembers']);

    // Subject extra CRUD
    Route::post('/subjects', [SubjectController::class, 'store']);
    Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
    Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);

    // Doctorant Routes (Candidat admis)
    Route::get('/doctorant/suivi/stats', [\App\Http\Controllers\Doctorant\ActiviteController::class, 'getStats']);
    Route::get('/doctorant/suivi/activites', [\App\Http\Controllers\Doctorant\ActiviteController::class, 'getActivites']);
    Route::post('/doctorant/suivi/activites', [\App\Http\Controllers\Doctorant\ActiviteController::class, 'store']);
    Route::get('/doctorant/mon-encadrant', [\App\Http\Controllers\Doctorant\DoctorantController::class, 'monEncadrant']);

    // Candidat Routes
    Route::post('/candidat/postuler', [CandidatController::class, 'postuler']);
    Route::get('/candidat/mes-choix', [CandidatController::class, 'mesChoix']);
    Route::get('/candidat/profile', [CandidatController::class, 'profile']);
    Route::get('/candidat/notifications', [CandidatController::class, 'notifications']);

    // Professeur Routes
    Route::get('/professeur/candidatures', [ProfCandidatureController::class, 'index']);
    Route::put('/professeur/candidatures/choix/{choix_id}/status', [ProfCandidatureController::class, 'updateStatus']);
    Route::post('/professeur/candidatures/{candidat_id}/notify', [ProfCandidatureController::class, 'notify']);
    
    // Suivi de thèse (Professeur)
    Route::get('/professeur/doctorants/{doctorant_id}/activites', [\App\Http\Controllers\Professeur\ActiviteController::class, 'getActivites']);
    Route::put('/professeur/activites/{id}/valider', [\App\Http\Controllers\Professeur\ActiviteController::class, 'valider']);
    Route::put('/professeur/activites/{id}/refuser', [\App\Http\Controllers\Professeur\ActiviteController::class, 'refuser']);
    
    // Suivi de Thèse endpoints
    Route::get('/professeur/candidatures/{candidat_id}/suivi', [ProfCandidatureController::class, 'getSuivi']);
    Route::post('/professeur/candidatures/{candidat_id}/suivi', [ProfCandidatureController::class, 'addSuivi']);
});

use App\Http\Controllers\Domain\CandidatureController;



Route::middleware('auth:sanctum')->group(function () {
    // Profile routes (Any authenticated user)
    Route::get('/profil', [ProfileController::class, 'show']);
    Route::put('/profil', [ProfileController::class, 'update']);
    Route::put('/profil/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profil/photo', [ProfileController::class, 'uploadPhoto']);

    // Candidatures
    Route::get('/candidatures', [CandidatureController::class, 'index']);
    Route::post('/candidatures', [CandidatureController::class, 'store']);
    Route::get('/candidatures/{candidature}', [CandidatureController::class, 'show']);
    Route::patch('/candidatures/{candidature}/statut', [CandidatureController::class, 'updateStatut']);
    Route::post('/candidatures/{id}/documents', [CandidatureController::class, 'uploadDocument']);

    // Encadrements & Suivi
    Route::get('/encadrements', [EncadrementController::class, 'index']);
    Route::post('/encadrements', [EncadrementController::class, 'store']);
    Route::get('/doctorant/suivi', [EncadrementController::class, 'monSuivi']);

    // Suivi et Evaluation
    Route::post('/suivi-evaluations', [SuiviEvaluationController::class, 'store']);
    Route::get('/my-suivi', [SuiviEvaluationController::class, 'mySuivi']);
    
    // Messagerie
    Route::get('/messages/unread', [\App\Http\Controllers\MessageController::class, 'getUnreadCount']);
    Route::get('/messages/conversations', [\App\Http\Controllers\MessageController::class, 'getConversations']);
    Route::get('/messages/conversations/{id}', [\App\Http\Controllers\MessageController::class, 'getMessages']);
    Route::get('/messages/candidat-contacts', [\App\Http\Controllers\MessageController::class, 'getCandidatContacts']);
    Route::delete('/messages/conversations/{id}', [\App\Http\Controllers\MessageController::class, 'destroyConversation']);
    Route::delete('/messages/single/{id}', [\App\Http\Controllers\MessageController::class, 'destroyMessage']);
    Route::post('/messages/send', [\App\Http\Controllers\MessageController::class, 'sendMessage']);
    Route::post('/messages/broadcast', [\App\Http\Controllers\MessageController::class, 'broadcastMessage']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Statistiques / Dashboard (Admin & Directeur)
    Route::get('/dashboard-stats', [StatsController::class, 'index']);


});


