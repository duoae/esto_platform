<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'acronyme' => $this->acronyme ?? $this->acronym,
            'nom'      => $this->nom ?? $this->name,
        ]);
    }

    public function rules()
    {
        return [
            'acronym'        => 'nullable|string|max:50|unique:laboratoires,acronyme',
            'acronyme'       => 'required|string|max:50|unique:laboratoires,acronyme',
            'name'           => 'nullable|string|max:255',
            'nom'            => 'required|string|max:255',
            'etablissement'  => 'nullable|string|max:255',
            'locaux'         => 'nullable|string|max:255',
            'thematiques'    => 'nullable|array',
            'thematiques.*'  => 'string|max:5000',
            // fields kept for compatibility if needed
            'director_name'  => 'nullable|string|max:255',
            'director_title' => 'nullable|string|max:255',
            'director_email' => 'nullable|string|email|max:255',
            'director_phone' => 'nullable|string|max:255',
            'adjoint_name'   => 'nullable|string|max:255',
            'adjoint_title'  => 'nullable|string|max:255',
            'adjoint_email'  => 'nullable|string|email|max:255',
            'adjoint_phone'  => 'nullable|string|max:255',
            'equipes'        => 'nullable|array',
            'equipes.*.nom'          => 'required_with:equipes|string|max:255',
            'equipes.*.coordinateur' => 'nullable|string|max:255',
            'equipes.*.thematique'   => 'nullable|string|max:255',
            'equipes.*.axes'         => 'nullable|array',
            'equipes.*.axes.*'       => 'string|max:5000',
        ];
    }
}