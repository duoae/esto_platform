<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Laboratoire;
use App\Models\SujetThese;
use App\Models\Utilisateur;

class ChatbotController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $user = auth('sanctum')->user();
        $sessionId = $user ? (string)$user->id : session()->getId();
        
        // 1. Gather context based on user role
        $context = $this->buildContext($user);

        // Fetch last 5 interactions for conversational memory
        $historyLogs = \App\Models\ChatbotLog::where('session_id', $sessionId)
            ->orderBy('id', 'desc')
            ->take(5)
            ->get()
            ->reverse();
            
        $history = [];
        foreach ($historyLogs as $log) {
            $history[] = ['role' => 'user', 'content' => $log->question];
            $history[] = ['role' => 'assistant', 'content' => $log->reponse];
        }

        // 2. Call the Python AI Microservice
        $startTime = microtime(true);
        try {
            // Assume the Python microservice runs on port 8001
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'x-api-key' => env('PYTHON_API_SECRET', 'esto-secret-key-2026')
            ])->post('http://localhost:8001/chat', [
                'query' => $request->input('query'),
                'context' => $context,
                'history' => $history
            ]);

            if ($response->successful()) {
                $reply = $response->json('reply');
                
                $endTime = microtime(true);
                $responseTimeMs = round(($endTime - $startTime) * 1000);

                \App\Models\ChatbotLog::create([
                    'session_id' => $user ? (string)$user->id : session()->getId(),
                    'question' => $request->input('query'),
                    'reponse' => $reply,
                    'response_time_ms' => $responseTimeMs
                ]);

                return response()->json([
                    'success' => true,
                    'reply' => $reply
                ]);
            } else {
                $errorDetail = $response->json('detail') ?? $response->body();
                \Illuminate\Support\Facades\Log::error('AI Service Error: ' . $errorDetail);
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur technique: ' . $errorDetail
                ], 500);
            }

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI Service Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Le service IA est indisponible pour le moment.'
            ], 503);
        }
    }

    private function buildContext($user)
    {
        try {
            $labosArray = Laboratoire::pluck('nom')->filter()->unique()->values();
            $labos = $labosArray->implode(', ');
            $labosCount = $labosArray->count();
            
            $sujetsArray = SujetThese::pluck('titre')->filter()->unique()->values();
            $sujetsList = $sujetsArray->implode(' | ');
            $sujetsCount = $sujetsArray->count();
            
            $usersCount = Utilisateur::count();
        } catch (\Exception $e) {
            $labos = "Informatique, Mathématiques, Sciences de l'ingénieur";
            $labosCount = 3;
            $sujetsList = "Intelligence Artificielle, Big Data, Réseaux, Sécurité, IoT";
            $sujetsCount = 5;
            $usersCount = 50;
        }

        $platformInfo = "
        - Nom : Plateforme de gestion de doctorat de l'ESTO (École Supérieure de Technologie d'Oujda).
        - Rôle : Cette plateforme permet de gérer les inscriptions au cycle doctoral, suivre l'avancement des thèses, et faciliter la communication entre doctorants, encadrants et laboratoires.
        - Statistiques en temps réel : La plateforme compte actuellement $usersCount utilisateurs inscrits, $labosCount laboratoires de recherche, et $sujetsCount sujets de thèse proposés.
        - Liste des laboratoires actuels : $labos.
        - Liste des sujets de thèse disponibles : $sujetsList.
        - Inscription : Pour s'inscrire, allez sur la page d'inscription, remplissez le formulaire avec vos informations (Nom, Prénom, Email, Mot de passe, CIN, Téléphone). Vous DEVEZ également fournir les documents suivants en format PDF ou image : CV, Diplôme du Baccalauréat, Diplôme Bac+2 (optionnel), Licence (optionnelle), et un Master ou Diplôme d'Ingénieur.
        - Utilisateurs : Visiteurs, Étudiants (Doctorants), Professeurs (Encadrants), et Directeurs de labo.
        ";

        return "L'utilisateur est un visiteur. Voici les informations de la plateforme pour l'aider : " . $platformInfo;
    }
}
