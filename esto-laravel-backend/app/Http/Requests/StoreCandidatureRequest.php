<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCandidatureRequest extends FormRequest
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

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'diplome_obtenu' => 'required|string|max:255',
            'laboratoire_id' => 'required|exists:laboratoires,id',
            'sujets' => 'required|array|min:1|max:3',
            'sujets.*' => 'exists:sujets_these,id',
            'cv' => 'required|file|mimes:pdf|max:10240',
            'diplome_bac' => 'required|file|mimes:pdf|max:10240',
            'diplome_licence' => 'nullable|file|mimes:pdf|max:10240',
            'diplome_master' => 'required|file|mimes:pdf|max:10240',
        ];
    }
}
