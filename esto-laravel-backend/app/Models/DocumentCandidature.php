<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentCandidature extends Model
{
    protected $table = 'documents_candidature';
    public $timestamps = false;
    protected $fillable = ['candidature_id', 'nom_document', 'statut', 'date_depot', 'chemin_fichier'];

    public function candidature() { return $this->belongsTo(Candidature::class, 'candidature_id'); }
}
