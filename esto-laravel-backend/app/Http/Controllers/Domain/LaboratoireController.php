<?php

namespace App\Http\Controllers\Domain;

use App\Http\Controllers\Controller;
use App\Models\Laboratoire;
use Illuminate\Http\Request;

class LaboratoireController extends Controller
{
    public function index()
    {
        $laboratoires = Laboratoire::all();
        return response()->json($laboratoires);
    }
}
