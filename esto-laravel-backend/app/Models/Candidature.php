<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidature extends Model
{
    protected $table = 'candidatures';

    protected $fillable = [
        'doctorant_id', 'laboratoire_id', 'statut', 'diplome_obtenu',
        'concours_reponse', 'date_depot', 'date_decision',
    ];

    public function doctorant() { return $this->belongsTo(Utilisateur::class, 'doctorant_id'); }
    public function laboratoire() { return $this->belongsTo(Laboratoire::class, 'laboratoire_id'); }
    public function sujets()
    {
        return $this->belongsToMany(SujetThese::class, 'candidature_sujets', 'candidature_id', 'sujet_id')
                    ->withPivot('rang');
    }
    public function documents() { return $this->hasMany(DocumentCandidature::class, 'candidature_id'); }
}
