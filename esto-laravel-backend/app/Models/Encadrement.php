<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Encadrement extends Model
{
    use HasFactory;

    protected $table = 'encadrements';

    protected $fillable = [
        'doctorant_id',
        'professeur_id',
        'sujet_id',
        'date_debut',
        'annee_these',
    ];

    public function doctorant()
    {
        return $this->belongsTo(Utilisateur::class, 'doctorant_id');
    }

    public function professeur()
    {
        return $this->belongsTo(Utilisateur::class, 'professeur_id');
    }

    public function sujet()
    {
        return $this->belongsTo(SujetThese::class, 'sujet_id');
    }

    public function suiviEvaluations()
    {
        return $this->hasMany(SuiviEvaluation::class, 'encadrement_id');
    }
}
