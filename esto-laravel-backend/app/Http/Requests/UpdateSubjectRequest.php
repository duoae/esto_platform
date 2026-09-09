<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'titre' => 'string|max:255',
            'laboratoire_id' => 'nullable|integer',
            'equipe_id' => 'nullable|integer',
            'pole_thematique' => 'nullable|string',
            'axe_recherche' => 'nullable|string',
            'objectif' => 'nullable|string',
            'retombees' => 'nullable|string',
            'conditions_accueil' => 'nullable|string',
            'financement' => 'nullable|string',
            'production_scientifique' => 'nullable|string',
            'statut' => 'nullable|string'
        ];
    }
}
