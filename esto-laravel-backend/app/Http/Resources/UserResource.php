<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name, // Full name
            'nom'            => $this->nom,
            'prenom'         => $this->prenom,
            'email'          => $this->email,
            'role'           => $this->role,
            'status'         => $this->statut ?? 'depose',
            'phone'          => $this->telephone,
            'photo_profil'   => $this->photo_profil,
            // Original ID for editing
            'laboratoire_id' => $this->laboratoire_id,
            // For display (acronym string)
            'lab_id'         => $this->laboratoire ? $this->laboratoire->acronyme : null,
            'details' => [
                'diplome'       => $this->diplome,
                'etablissement' => $this->etablissement_origine,
                'grade'         => $this->grade,
                'specialite'    => $this->specialite,
            ],
        ];
    }
}
