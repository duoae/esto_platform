<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class LabResource extends JsonResource
{
    public function toArray($request)
    {
        $director = $this->directeur ?? $this->membres()->whereRaw('LOWER(role) = ?', ['directeur'])->first();
        $adjoint = $this->directeurAdjoint; // Ensure the model has this relation loaded if needed
        return [
            'id' => $this->id,
            'acronym' => $this->acronyme,
            'name' => $this->nom,
            'establishment' => $this->etablissement,
            'locaux' => $this->locaux,
            'themes' => $this->thematiques ? $this->thematiques->pluck('libelle') : [],
            'director_name' => $director ? $director->name : null,
            'director_title' => $director ? ($director->specialite ?? $director->grade) : null,
            'director_email' => $director ? $director->email : null,
            'director_phone' => $director ? $director->telephone : null,
            'adjoint_name' => $adjoint ? $adjoint->name : null,
            'adjoint_title' => $adjoint ? ($adjoint->specialite ?? $adjoint->grade) : null,
            'adjoint_email' => $adjoint ? $adjoint->email : null,
            'adjoint_phone' => $adjoint ? $adjoint->telephone : null,
            'equipes' => $this->equipes ? $this->equipes->map(function ($eq) {
                return [
                    'id' => $eq->id,
                    'nom' => $eq->nom,
                    'thematique' => $eq->thematique_equipe,
                    'coordinateur' => '', // Sticking to basic for now
                    'axes' => $eq->axes ? $eq->axes->pluck('libelle') : []
                ];
            }) : []
        ];
    }
}
