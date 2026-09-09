<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiviteDoctorat extends Model
{
    use HasFactory;

    protected $table = 'activites_doctorat';

    protected $fillable = [
        'encadrement_id',
        'type',
        'titre',
        'description',
        'heures',
        'points',
        'pdf_path',
        'statut',
        'motif_refus'
    ];

    public function encadrement()
    {
        return $this->belongsTo(Encadrement::class, 'encadrement_id');
    }
}
