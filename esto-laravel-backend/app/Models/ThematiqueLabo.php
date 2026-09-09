<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThematiqueLabo extends Model
{
    protected $table = 'thematiques_labo';
    public $timestamps = false;
    protected $fillable = ['laboratoire_id', 'libelle'];

    public function laboratoire() { return $this->belongsTo(Laboratoire::class, 'laboratoire_id'); }
}
