<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Utilisateur;
use App\Models\Candidature;
use App\Models\Encadrement;
use App\Models\Laboratoire;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\ChatbotLog;
use App\Models\SuiviEvaluation;
use App\Traits\ApiResponseTrait;

/**
 * @OA\Tag(
 *     name="Statistiques",
 *     description="Tableaux de bord (Admin et Directeur)"
 * )
 */
class StatsController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $user = auth()->user();

        // Debug override
        if ($request->has('debug_user_id')) {
            $role = $request->input('debug_role');
            if ($role === 'professeur') {
                return $this->getProfesseurStats($request->input('debug_user_id'));
            }
        }

        if (!$user) {
            return $this->errorResponse('Non authentifié', 401);
        }

        $role = strtolower($user->role);
        
        // If a directeur is viewing the Espace Professeur, force the role to professeur
        if ($request->query('context') === 'professeur' && in_array($role, ['directeur', 'professeur'])) {
            $role = 'professeur';
        }

        if ($role === 'admin') {
            return $this->getAdminStats();
        } elseif ($role === 'directeur') {
            return $this->getDirecteurStats($user->laboratoire_id, $request->query('timeframe', 'global'));
        } elseif ($role === 'professeur') {
            return $this->getProfesseurStats($user->id);
        }

        return $this->errorResponse('Non autorisé', 403);
    }

    private function getAdminStats()
    {
        // 1. Global KPIs
        $totalUsers = Utilisateur::count();
        $totalLabs = Laboratoire::count();
        $totalEquipes = \App\Models\EquipeRecherche::count();
        $totalThematiques = \App\Models\ThematiqueLabo::count();
        $totalSujets = \App\Models\SujetThese::count();
        $totalCandidatures = \Illuminate\Support\Facades\DB::table('candidature_choix')->count();
        $totalDocuments = \App\Models\DocumentCandidature::count();
        
        // New KPIs
        $totalMessages = Message::count();
        $totalConversations = Conversation::count();
        $totalChatbotLogs = ChatbotLog::count();
        $totalNotifications = \App\Models\Notification::count();

        // 2. Répartition des rôles
        $roles = Utilisateur::select('role', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role')->toArray();

        // 3. État des candidatures (Pour Doughnut Chart)
        $candidatureStatus = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->select('statut_choix', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('statut_choix')
            ->pluck('total', 'statut_choix')->toArray();
            
        // Breakdown des Diplômes
        $diplomes = \App\Models\Candidature::select('diplome_obtenu', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->whereNotNull('diplome_obtenu')
            ->groupBy('diplome_obtenu')
            ->pluck('total', 'diplome_obtenu')->toArray();

        // 4. Time-series data (Les Courbes - "Blwe9t")
        // a. Inscriptions (Utilisateurs)
        $inscriptions = Utilisateur::select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"), \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('mois')
            ->orderBy('mois', 'asc')
            ->limit(12)
            ->get();

        // b. Candidatures soumises
        $candidaturesTime = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"), \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('mois')
            ->orderBy('mois', 'asc')
            ->limit(12)
            ->get();

        // c. Messages envoyés (Groupés par mois et par rôle de l'expéditeur)
        $messagesRaw = \Illuminate\Support\Facades\DB::table('messages')
            ->join('utilisateurs', 'messages.sender_id', '=', 'utilisateurs.id')
            ->select(
                \Illuminate\Support\Facades\DB::raw("DATE_FORMAT(messages.created_at, '%Y-%m') as mois"),
                'utilisateurs.role',
                \Illuminate\Support\Facades\DB::raw('count(*) as total')
            )
            ->groupBy('mois', 'utilisateurs.role')
            ->orderBy('mois', 'asc')
            ->get();

        // Transformation pour le frontend: on veut un tableau par mois avec les totaux par rôle
        $messagesTimeMap = [];
        foreach ($messagesRaw as $row) {
            if (!isset($messagesTimeMap[$row->mois])) {
                $messagesTimeMap[$row->mois] = [
                    'mois' => $row->mois,
                    'total' => 0,
                    'roles' => ['candidat' => 0, 'doctorant' => 0, 'professeur' => 0, 'directeur' => 0, 'admin' => 0]
                ];
            }
            $messagesTimeMap[$row->mois]['roles'][$row->role] = $row->total;
            $messagesTimeMap[$row->mois]['total'] += $row->total;
        }
        $messagesTime = array_values($messagesTimeMap);
        
        // S'il n'y a que très peu de données, on garde les données brutes telles quelles, le frontend s'occupera du mock.

        // d. Utilisation Chatbot
        $chatbotTime = ChatbotLog::select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"), \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('mois')
            ->orderBy('mois', 'asc')
            ->limit(12)
            ->get();

        // 5. Analyse des Laboratoires (Pour Tableau Détaillé)
        $labStats = Laboratoire::select('laboratoires.id', 'laboratoires.nom', 'laboratoires.acronyme')
            ->withCount(['membres as professeurs_count' => function ($query) {
                $query->where('role', 'professeur');
            }])
            ->withCount('sujets')
            ->get()
            ->map(function ($lab) {
                $lab->candidatures_count = \App\Models\Candidature::where('laboratoire_id', $lab->id)->count();
                return $lab;
            });

        // 6. Analyse des Sujets et Encadrement
        $topProfessors = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->join('utilisateurs', 'sujets_these.enseignant_id', '=', 'utilisateurs.id')
            ->select('utilisateurs.nom', 'utilisateurs.prenom', \Illuminate\Support\Facades\DB::raw('count(candidature_choix.id) as requests'))
            ->groupBy('utilisateurs.id', 'utilisateurs.nom', 'utilisateurs.prenom')
            ->orderByDesc('requests')
            ->limit(5)
            ->get();
            
        // 7. Recent Activity (Dernières Candidatures)
        $recentActivity = \App\Models\Candidature::with(['doctorant:id,nom,prenom', 'laboratoire:id,acronyme'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($cand) {
                return [
                    'candidat' => $cand->doctorant ? $cand->doctorant->nom . ' ' . $cand->doctorant->prenom : 'Inconnu',
                    'labo' => $cand->laboratoire ? $cand->laboratoire->acronyme : 'Inconnu',
                    'date' => $cand->created_at->format('Y-m-d H:i'),
                    'status' => $cand->statut
                ];
            });

        return $this->successResponse([
            'role' => 'admin',
            'kpis' => [
                'utilisateurs' => $totalUsers,
                'laboratoires' => $totalLabs,
                'equipes' => $totalEquipes,
                'thematiques' => $totalThematiques,
                'sujets' => $totalSujets,
                'candidatures' => $totalCandidatures,
                'messages' => $totalMessages,
                'conversations' => $totalConversations,
                'chatbot_requests' => $totalChatbotLogs,
                'notifications' => $totalNotifications
            ],
            'charts' => [
                'roles' => $roles,
                'status' => $candidatureStatus,
                'diplomes' => $diplomes,
                'inscriptions_time' => $inscriptions,
                'candidatures_time' => $candidaturesTime,
                'messages_time' => $messagesTime,
                'chatbot_time' => $chatbotTime
            ],
            'tables' => [
                'laboratoires' => $labStats,
                'top_professors' => $topProfessors,
                'recent_activity' => $recentActivity
            ]
        ], 'Statistiques Admin Intégrales avec Séries Temporelles');
    }

    private function getDirecteurStats($laboratoireId, $timeframe = 'global')
    {
        // On laisse le directeur tel quel pour l'instant
        if (!$laboratoireId) {
            return $this->errorResponse('Laboratoire non assigné', 400);
        }

        $candidatures = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)->count();
            
        $professeurs = Utilisateur::where('laboratoire_id', $laboratoireId)->where('role', 'professeur')->count();
        $doctorants = Utilisateur::where('laboratoire_id', $laboratoireId)->where('role', 'candidat')->count();
        $sujetsCount = \App\Models\SujetThese::where('laboratoire_id', $laboratoireId)->count();
        
        $candidaturesStatus = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->select('candidature_choix.statut_choix', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('statut_choix')
            ->pluck('total', 'statut_choix')->toArray();

        // Candidatures au fil du temps (Derniers 6 mois pour affichage Chart)
        $candidaturesTime = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(candidature_choix.created_at, '%Y-%m') as mois"), \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('mois')
            ->orderBy('mois', 'asc')
            ->limit(6)
            ->get();

        // Messages au fil du temps (Messages envoyés par les membres du labo ou le directeur)
        $messagesTime = \Illuminate\Support\Facades\DB::table('messages')
            ->join('utilisateurs', 'messages.sender_id', '=', 'utilisateurs.id')
            ->where('utilisateurs.laboratoire_id', $laboratoireId)
            ->select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(messages.created_at, '%Y-%m') as mois"), \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('mois')
            ->orderBy('mois', 'asc')
            ->limit(6)
            ->get();

        // Sujets proposés au fil du temps
        $sujetsTime = \Illuminate\Support\Facades\DB::table('sujets_these')
            ->where('laboratoire_id', $laboratoireId)
            ->select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"), \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('mois')
            ->orderBy('mois', 'asc')
            ->limit(6)
            ->get();

        // Top Professeurs du labo
        $topProfessors = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->join('utilisateurs', 'sujets_these.enseignant_id', '=', 'utilisateurs.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->select('utilisateurs.nom', 'utilisateurs.prenom', \Illuminate\Support\Facades\DB::raw('count(candidature_choix.id) as requests'))
            ->groupBy('utilisateurs.id', 'utilisateurs.nom', 'utilisateurs.prenom')
            ->orderByDesc('requests')
            ->limit(5)
            ->get();

        // Doctorants par prof (Candidats acceptés ou admis)
        $doctorantsPerProf = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->join('utilisateurs', 'sujets_these.enseignant_id', '=', 'utilisateurs.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->whereIn('candidature_choix.statut_choix', ['accepte', 'admis'])
            ->select('utilisateurs.nom', 'utilisateurs.prenom', \Illuminate\Support\Facades\DB::raw('count(candidature_choix.id) as doctorants'))
            ->groupBy('utilisateurs.id', 'utilisateurs.nom', 'utilisateurs.prenom')
            ->orderByDesc('doctorants')
            ->get();

        // Top Sujets du labo
        $topSujets = \Illuminate\Support\Facades\DB::table('sujets_these')
            ->leftJoin('candidature_choix', 'sujets_these.id', '=', 'candidature_choix.sujet_id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->select(
                'sujets_these.titre', 
                \Illuminate\Support\Facades\DB::raw('count(candidature_choix.id) as total'),
                \Illuminate\Support\Facades\DB::raw("sum(case when candidature_choix.statut_choix = 'accepte' then 1 else 0 end) as total_accepte")
            )
            ->groupBy('sujets_these.id', 'sujets_these.titre')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Diplômes
        $diplomes = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->whereNotNull('candidatures.diplome_obtenu')
            ->select('candidatures.diplome_obtenu', \Illuminate\Support\Facades\DB::raw('count(DISTINCT candidatures.id) as total'))
            ->groupBy('candidatures.diplome_obtenu')
            ->pluck('total', 'diplome_obtenu')->toArray();

        // Activité récente
        $recentActivity = \App\Models\Candidature::join('candidature_choix', 'candidatures.id', '=', 'candidature_choix.candidature_id')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->join('utilisateurs', 'candidatures.doctorant_id', '=', 'utilisateurs.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->select('utilisateurs.nom', 'utilisateurs.prenom', 'candidatures.created_at', 'candidatures.statut')
            ->orderByDesc('candidatures.created_at')
            ->limit(5)
            ->get()
            ->map(function ($cand) {
                return [
                    'candidat' => $cand->nom . ' ' . $cand->prenom,
                    'date' => \Carbon\Carbon::parse($cand->created_at)->format('Y-m-d H:i'),
                    'status' => $cand->statut
                ];
            });

        // Calculer les alertes
        $candidaturesEnAttente = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.laboratoire_id', $laboratoireId)
            ->where('candidature_choix.statut_choix', 'en_attente')
            ->count();
            
        $sujetsSansCandidats = \Illuminate\Support\Facades\DB::table('sujets_these')
            ->where('laboratoire_id', $laboratoireId)
            ->whereNotIn('id', function($query) {
                $query->select('sujet_id')->from('candidature_choix');
            })
            ->count();

        return $this->successResponse([
            'role' => 'directeur',
            'laboratoire_id' => $laboratoireId,
            'kpis' => [
                'candidatures_recues' => $candidatures,
                'professeurs' => $professeurs,
                'doctorants' => $doctorants,
                'sujets' => $sujetsCount,
                'avancement_moyen' => '0%' // Placeholder for now
            ],
            'alertes' => [
                'candidatures_en_attente' => $candidaturesEnAttente,
                'sujets_sans_candidats' => $sujetsSansCandidats
            ],
            'charts' => [
                'status' => $candidaturesStatus,
                'candidatures_time' => $candidaturesTime,
                'messages_time' => $messagesTime,
                'sujets_time' => $sujetsTime,
                'diplomes' => $diplomes,
                'sujets' => $topSujets,
                'doctorants_per_prof' => $doctorantsPerProf
            ],
            'tables' => [
                'top_professors' => $topProfessors,
                'recent_activity' => $recentActivity
            ]
        ], 'Statistiques Directeur');
    }

    private function getProfesseurStats($profId)
    {
        // 1. KPIs
        $sujetsCount = \App\Models\SujetThese::where('enseignant_id', $profId)->count();
        
        $candidatures = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.enseignant_id', $profId)
            ->count();
            
        $doctorants = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.enseignant_id', $profId)
            ->whereIn('candidature_choix.statut_choix', ['accepte', 'admis'])
            ->count();
            
        $messages = \Illuminate\Support\Facades\DB::table('messages')
            ->where('sender_id', $profId)
            ->count();

        // 2. Status Chart
        $candidaturesStatus = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.enseignant_id', $profId)
            ->select('candidature_choix.statut_choix', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('candidature_choix.statut_choix')
            ->pluck('total', 'statut_choix')->toArray();

        // 3. Time Series
        $sixMonthsAgo = \Carbon\Carbon::now()->subMonths(6);
        $candidaturesTime = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.enseignant_id', $profId)
            ->where('candidature_choix.created_at', '>=', $sixMonthsAgo)
            ->select(
                'sujets_these.titre as sujet',
                \Illuminate\Support\Facades\DB::raw("DATE_FORMAT(candidature_choix.created_at, '%Y-%m') as mois"),
                \Illuminate\Support\Facades\DB::raw('count(*) as total')
            )
            ->groupBy('sujets_these.titre', 'mois')
            ->orderBy('mois', 'asc')
            ->get();

        // 4. Tables / Recent Activity
        $topSujets = \Illuminate\Support\Facades\DB::table('sujets_these')
            ->leftJoin('candidature_choix', 'sujets_these.id', '=', 'candidature_choix.sujet_id')
            ->where('sujets_these.enseignant_id', $profId)
            ->select(
                'sujets_these.id', 
                'sujets_these.titre', 
                \Illuminate\Support\Facades\DB::raw('count(candidature_choix.id) as total'),
                \Illuminate\Support\Facades\DB::raw("SUM(CASE WHEN candidature_choix.statut_choix IN ('accepte', 'admis') THEN 1 ELSE 0 END) as total_accepte")
            )
            ->groupBy('sujets_these.id', 'sujets_these.titre')
            ->orderByDesc('total')
            ->get();
            
        $recentActivity = \Illuminate\Support\Facades\DB::table('candidature_choix')
            ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
            ->join('utilisateurs', 'candidatures.doctorant_id', '=', 'utilisateurs.id')
            ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
            ->where('sujets_these.enseignant_id', $profId)
            ->select(
                'utilisateurs.nom', 
                'utilisateurs.prenom', 
                'candidature_choix.statut_choix as statut', 
                'candidature_choix.created_at'
            )
            ->orderBy('candidature_choix.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($cand) {
                return [
                    'candidat' => $cand->nom . ' ' . $cand->prenom,
                    'date' => \Carbon\Carbon::parse($cand->created_at)->format('Y-m-d H:i'),
                    'status' => $cand->statut
                ];
            });

        return $this->successResponse([
            'role' => 'professeur',
            'kpis' => [
                'sujets' => $sujetsCount,
                'candidatures_recues' => $candidatures,
                'doctorants' => $doctorants,
                'messages' => $messages,
                'candidatures_en_attente' => \Illuminate\Support\Facades\DB::table('candidature_choix')
                    ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
                    ->where('sujets_these.enseignant_id', $profId)
                    ->where('candidature_choix.statut_choix', 'en_attente')
                    ->count()
            ],
            'charts' => [
                'status' => $candidaturesStatus,
                'candidatures_time' => $candidaturesTime
            ],
            'tables' => [
                'top_sujets' => $topSujets,
                'recent_activity' => $recentActivity,
                'mes_doctorants' => \Illuminate\Support\Facades\DB::table('candidature_choix')
                    ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
                    ->join('utilisateurs', 'candidatures.doctorant_id', '=', 'utilisateurs.id')
                    ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
                    ->where('sujets_these.enseignant_id', $profId)
                    ->whereIn('candidature_choix.statut_choix', ['accepte', 'admis'])
                    ->select('utilisateurs.nom', 'utilisateurs.prenom', 'sujets_these.titre as sujet', 'candidature_choix.updated_at')
                    ->orderByDesc('candidature_choix.updated_at')
                    ->take(5)
                    ->get()
                    ->map(function($doc) {
                        return [
                            'nom' => $doc->nom . ' ' . $doc->prenom,
                            'sujet' => $doc->sujet,
                            'date' => \Carbon\Carbon::parse($doc->updated_at)->format('Y-m-d')
                        ];
                    })
            ]
        ], 'Statistiques Professeur');
    }
}
