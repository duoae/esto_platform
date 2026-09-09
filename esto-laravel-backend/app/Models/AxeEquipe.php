<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AxeEquipe extends Model
{
    protected $table = 'axes_equipe';
    public $timestamps = false;
    protected $fillable = ['equipe_id', 'libelle'];
}
