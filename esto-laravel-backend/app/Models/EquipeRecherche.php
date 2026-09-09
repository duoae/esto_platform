<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipeRecherche extends Model
{
    protected $table = 'equipes_recherche';
    public $timestamps = false;
    protected $fillable = ['laboratoire_id', 'nom', 'coordinateur_id', 'coordinateur_name', 'thematique_equipe'];

    public function laboratoire() { return $this->belongsTo(Laboratoire::class, 'laboratoire_id'); }
    public function coordinateur() { return $this->belongsTo(Utilisateur::class, 'coordinateur_id'); }
    public function axes() { return $this->hasMany(AxeEquipe::class, 'equipe_id'); }
}
