<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SujetThese extends Model
{
    protected $table = 'sujets_these';

    protected $fillable = [
        'laboratoire_id', 'equipe_id', 'enseignant_id', 'titre',
        'axe_recherche', 'pole_thematique', 'objectif', 'retombees',
        'conditions_accueil', 'financement', 'production_scientifique',
        'statut', 'annee_universitaire',
    ];

    public function laboratoire()
    {
        return $this->belongsTo(Laboratoire::class, 'laboratoire_id');
    }

    public function equipe()
    {
        return $this->belongsTo(EquipeRecherche::class, 'equipe_id');
    }

    public function enseignant()
    {
        return $this->belongsTo(Utilisateur::class, 'enseignant_id');
    }
}
