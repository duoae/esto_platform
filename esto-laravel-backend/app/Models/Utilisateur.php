<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom', 'prenom', 'email', 'mot_de_passe_hash',
        'telephone', 'role', 'grade', 'specialite',
        'laboratoire_id', 'diplome', 'etablissement_origine', 'statut', 'photo_profil'
    ];

    protected $hidden = ['mot_de_passe_hash', 'remember_token'];

    // Map Laravel's password field to our custom column
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe_hash;
    }

    // Virtual `name` accessor for Angular compatibility
    public function getNameAttribute(): string
    {
        return trim($this->nom . ' ' . $this->prenom);
    }

    public function laboratoire()
    {
        return $this->belongsTo(Laboratoire::class, 'laboratoire_id');
    }

    public function candidatures()
    {
        return $this->hasMany(Candidature::class, 'doctorant_id');
    }

    public function encadrements()
    {
        return $this->hasMany(Encadrement::class, 'doctorant_id');
    }
}
