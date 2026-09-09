<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
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
        $userRoute = $this->route('user');
        $userId = is_object($userRoute) ? $userRoute->id : $userRoute;
        
        return [
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:utilisateurs,email,' . $userId,
            'password' => 'nullable|string|min:6',
            'role' => 'string|in:admin,directeur,professeur,doctorant',
            'status' => 'string',
            'lab_id' => 'nullable',
            'phone' => 'nullable|string',
            'specialite' => 'nullable|string',
            'grade' => 'nullable|string',
            'details' => 'nullable|array'
        ];
    }
}
