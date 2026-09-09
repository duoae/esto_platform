<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
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
            'title' => 'required|string|max:255',
            'proposer_name' => 'nullable|string|max:255',
            'proposer_email' => 'nullable|string|email',
            'team' => 'nullable|string|max:255',
            'lab' => 'nullable|string|max:50',
            'etab' => 'nullable|string|max:255',
            'pole' => 'nullable|string|max:255',
            'axe' => 'nullable|string|max:255',
            'objective' => 'nullable|string',
            'benefits' => 'nullable|string',
            'conditions' => 'nullable|string',
            'funding' => 'nullable|string',
            'production' => 'nullable|string',
            'status' => 'nullable|string'
        ];
    }
}
