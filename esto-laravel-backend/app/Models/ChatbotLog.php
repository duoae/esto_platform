<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatbotLog extends Model
{
    use HasFactory;

    protected $table = 'chatbot_logs';

    protected $fillable = [
        'session_id',
        'question',
        'reponse',
        'response_time_ms'
    ];
}
