<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatistiquesLaboratoire extends Model
{
    use HasFactory;

    protected $table = 'statistiques_laboratoire';
    protected $primaryKey = 'laboratoire_id';
    public $incrementing = false;
    public $timestamps = false; // No created_at or updated_at in schema

    protected $fillable = [
        'laboratoire_id',
        'nb_equipes',
        'nb_doctorants',
        'taux_occupation',
    ];

    public function laboratoire()
    {
        return $this->belongsTo(Laboratoire::class, 'laboratoire_id');
    }
}
