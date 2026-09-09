<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuiviEvaluation extends Model
{
    use HasFactory;

    protected $table = 'suivi_evaluations';
    public $timestamps = false; // The schema only defines date_evaluation without standard created_at/updated_at

    protected $fillable = [
        'encadrement_id',
        'type',
        'note',
        'taux_avancement',
        'date_evaluation',
        'cree_par',
    ];

    public function encadrement()
    {
        return $this->belongsTo(Encadrement::class, 'encadrement_id');
    }

    public function evaluateur()
    {
        return $this->belongsTo(Utilisateur::class, 'cree_par');
    }
}
