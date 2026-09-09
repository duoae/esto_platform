<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:utilisateurs',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,directeur,professeur,doctorant',
            'lab_id' => 'nullable',
            'phone' => 'nullable|string',
            'specialite' => 'nullable|string',
            'grade' => 'nullable|string',
            'details' => 'nullable|array'
        ];
    }
}
