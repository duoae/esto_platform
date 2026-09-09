<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatbotLog;
use Illuminate\Http\Request;

class ChatbotLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ChatbotLog::query();
        
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('reponse', 'like', "%{$search}%");
            });
        }

        if ($request->has('period') && !empty($request->period)) {
            $period = $request->period;
            if ($period === 'jour') {
                $query->whereDate('created_at', \Carbon\Carbon::today());
            } elseif ($period === 'semaine') {
                $query->whereBetween('created_at', [\Carbon\Carbon::now()->startOfWeek(), \Carbon\Carbon::now()->endOfWeek()]);
            } elseif ($period === 'mois') {
                $query->whereMonth('created_at', \Carbon\Carbon::now()->month)
                      ->whereYear('created_at', \Carbon\Carbon::now()->year);
            }
        }

        $statsQuery = clone $query;
        
        $totalInteractions = $statsQuery->count();
        $totalSessions = $statsQuery->distinct('session_id')->count('session_id');
        
        $failedCount = (clone $statsQuery)->where(function($q) {
            $q->where('reponse', 'like', '%désolé%')
              ->orWhere('reponse', 'like', '%ne comprends pas%')
              ->orWhere('reponse', 'like', '%je n\'ai pas la réponse%')
              ->orWhere('reponse', 'like', '%contactez l\'administration%');
        })->count();
        $tauxEchec = $totalInteractions > 0 ? round(($failedCount / $totalInteractions) * 100, 1) : 0;
        
        $avgResponseTimeMs = $statsQuery->avg('response_time_ms');
        $tempsReponseMoyen = $avgResponseTimeMs ? round($avgResponseTimeMs / 1000, 2) . 's' : 'N/A';
        
        $topQuestions = (clone $statsQuery)
            ->select('question', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('question')
            ->orderBy('count', 'desc')
            ->take(5)
            ->pluck('question');

        // Top difficultés rencontrées (questions ayant mené à un échec)
        $difficultesRencontrees = (clone $statsQuery)->where(function($q) {
            $q->where('reponse', 'like', '%désolé%')
              ->orWhere('reponse', 'like', '%ne comprends pas%')
              ->orWhere('reponse', 'like', '%je n\'ai pas la réponse%')
              ->orWhere('reponse', 'like', '%contactez l\'administration%');
        })->select('question', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
          ->groupBy('question')
          ->orderBy('count', 'desc')
          ->take(5)
          ->pluck('question');

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);
        
        $response = $logs->toArray();
        $response['stats'] = [
            'total_interactions' => $totalInteractions,
            'total_sessions' => $totalSessions,
            'taux_echec' => $tauxEchec,
            'temps_reponse_moyen' => $tempsReponseMoyen,
            'top_questions' => $topQuestions,
            'difficultes_rencontrees' => $difficultesRencontrees
        ];

        return response()->json($response);
    }
}
