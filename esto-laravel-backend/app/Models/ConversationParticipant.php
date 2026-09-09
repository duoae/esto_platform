<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConversationParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'utilisateur_id',
        'is_anonymous',
        'anonymous_label',
        'role_context',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class);
    }
}
