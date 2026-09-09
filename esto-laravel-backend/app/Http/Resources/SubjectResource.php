<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectResource extends JsonResource
{
    public function toArray($request)
    {
        $statutMap = [
            'disponible'   => 'Disponible',
            'attribue'     => 'Attribué',
            'indisponible' => 'Indisponible',
        ];

        return [
            'id'            => $this->id,
            'laboratoire_id'=> $this->laboratoire_id,
            'lab'           => $this->laboratoire ? $this->laboratoire->acronyme : null,
            'etab'          => 'ESTO',
            'team'          => $this->equipe ? $this->equipe->nom : null,
            'proposer_name' => $this->enseignant ? $this->enseignant->name : null,
            'proposer_photo_profil' => $this->enseignant ? $this->enseignant->photo_profil : null,
            'proposer_title'=> $this->enseignant ? $this->enseignant->grade : null,
            'proposer_email'=> $this->enseignant ? $this->enseignant->email : null,
            'title'         => $this->titre,
            'axe'           => $this->axe_recherche,
            'pole'          => $this->pole_thematique,
            'objective'     => $this->objectif,
            'benefits'      => $this->retombees,
            'conditions'    => $this->conditions_accueil,
            'funding'       => $this->financement,
            'production'    => $this->production_scientifique,
            'status'        => $statutMap[$this->statut] ?? ucfirst($this->statut),
            'annee'         => $this->annee_universitaire,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
