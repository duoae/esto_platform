<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Laboratoire extends Model
{
    protected $table = 'laboratoires';

    protected $fillable = [
        'acronyme', 'nom', 'etablissement', 'locaux',
        'directeur_id', 'directeur_adjoint_id',
    ];

    public function directeur()
    {
        return $this->belongsTo(Utilisateur::class, 'directeur_id');
    }

    public function directeurAdjoint()
    {
        return $this->belongsTo(Utilisateur::class, 'directeur_adjoint_id');
    }

    public function thematiques()
    {
        return $this->hasMany(ThematiqueLabo::class, 'laboratoire_id');
    }

    public function equipes()
    {
        return $this->hasMany(EquipeRecherche::class, 'laboratoire_id');
    }

    public function membres()
    {
        return $this->hasMany(Utilisateur::class, 'laboratoire_id');
    }

    public function sujets()
    {
        return $this->hasMany(SujetThese::class, 'laboratoire_id');
    }

    public function candidatures()
    {
        return $this->hasMany(Candidature::class, 'laboratoire_id');
    }
}
