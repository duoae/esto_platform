<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Get all conversations for the authenticated user.
     */
    public function getConversations(Request $request)
    {
        $user = auth()->user();
        $roleContext = $request->query('role_context');
        
        $conversations = Conversation::whereHas('participants', function($query) use ($user, $roleContext) {
            $query->where('utilisateur_id', $user->id);
            if ($roleContext) {
                $query->where('role_context', $roleContext);
            }
        })
        ->with(['participants.utilisateur', 'messages' => function($query) {
            $query->latest()->limit(1);
        }])
        ->orderBy('updated_at', 'desc')
        ->get();

        // Format for response: Anonymize names if required
        $formatted = $conversations->map(function ($conv) use ($user) {
            $otherParticipants = $conv->participants->where('utilisateur_id', '!=', $user->id);
            $names = $otherParticipants->map(function ($p) {
                if ($p->is_anonymous) {
                    return $p->anonymous_label ?? 'Utilisateur Anonyme';
                }
                return $p->utilisateur->nom . ' ' . $p->utilisateur->prenom;
            })->implode(', ');

            $lastMessage = $conv->messages->first();

            $firstOtherParticipant = $otherParticipants->first();
            $photoProfil = null;
            if ($firstOtherParticipant && !$firstOtherParticipant->is_anonymous && $firstOtherParticipant->utilisateur) {
                $photoProfil = $firstOtherParticipant->utilisateur->photo_profil;
            }

            // Force append the names if there is a title
            $finalTitre = $names;
            if (!empty($conv->titre)) {
                $finalTitre = $conv->titre . ' - ' . $names;
            }

            return [
                'id' => $conv->id,
                'titre' => $finalTitre,
                'sujet_id' => $conv->sujet_id,
                'last_message' => $lastMessage ? $lastMessage->contenu : '',
                'last_message_date' => $lastMessage ? $lastMessage->created_at : $conv->created_at,
                'is_read' => $lastMessage ? ($lastMessage->sender_id === $user->id ? true : (bool) $lastMessage->is_read) : true,
                'updated_at' => $conv->updated_at,
                'last_message_is_mine' => $lastMessage ? ($lastMessage->sender_id === $user->id) : false,
                'photo_profil' => $photoProfil
            ];
        });

        return response()->json(['success' => true, 'data' => $formatted]);
    }

    /**
     * Get unread messages count.
     */
    public function getCandidatContacts(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'candidat' && $user->role !== 'doctorant') {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        // Find the encadrement
        $encadrement = \App\Models\Encadrement::with('professeur')->where('doctorant_id', $user->id)->first();
        if (!$encadrement || !$encadrement->professeur) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $contacts = [];

        // Add Encadrant
        $contacts[] = [
            'id' => $encadrement->professeur->id,
            'nom' => $encadrement->professeur->nom,
            'prenom' => $encadrement->professeur->prenom,
            'role_label' => 'Encadrant',
            'photo_profil' => $encadrement->professeur->photo_profil
        ];

        // Add Directeur du Labo
        if ($encadrement->professeur->laboratoire_id) {
            $directeur = \App\Models\Utilisateur::where('role', 'directeur')
                ->where('laboratoire_id', $encadrement->professeur->laboratoire_id)
                ->first();
            
            if ($directeur) {
                $contacts[] = [
                    'id' => $directeur->id,
                    'nom' => $directeur->nom,
                    'prenom' => $directeur->prenom,
                    'role_label' => 'Directeur du Labo',
                    'photo_profil' => $directeur->photo_profil
                ];
            }
        }

        return response()->json(['success' => true, 'data' => $contacts]);
    }

    public function getUnreadCount(Request $request)
    {
        $user = auth()->user();
        $roleContext = $request->query('role_context');
        
        $unreadCount = Message::whereHas('conversation.participants', function($query) use ($user, $roleContext) {
            $query->where('utilisateur_id', $user->id);
            if ($roleContext) {
                $query->where('role_context', $roleContext);
            }
        })
        ->where('sender_id', '!=', $user->id)
        ->where('is_read', false)
        ->count();

        return response()->json(['success' => true, 'unread_count' => $unreadCount]);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function getMessages(Request $request, $conversation_id)
    {
        $user = auth()->user();

        // Verify participation
        $participant = ConversationParticipant::where('conversation_id', $conversation_id)
            ->where('utilisateur_id', $user->id)
            ->first();

        if (!$participant && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        $messages = Message::where('conversation_id', $conversation_id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark unread messages as read
        Message::where('conversation_id', $conversation_id)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        // Load participants to check anonymity rules
        $participants = ConversationParticipant::where('conversation_id', $conversation_id)->get()->keyBy('utilisateur_id');

        $formattedMessages = $messages->map(function ($msg) use ($user, $participants) {
            $senderParticipant = $participants->get($msg->sender_id);
            
            $senderName = 'Système';
            $senderPhoto = null;
            if ($senderParticipant) {
                if ($senderParticipant->utilisateur_id === $user->id) {
                    $senderName = 'Moi';
                    $senderPhoto = $user->photo_profil;
                } else if ($senderParticipant->is_anonymous) {
                    $senderName = $senderParticipant->anonymous_label ?? 'Utilisateur Anonyme';
                } else {
                    $senderUser = Utilisateur::find($msg->sender_id);
                    $senderName = $senderUser ? $senderUser->nom . ' ' . $senderUser->prenom : 'Utilisateur';
                    $senderPhoto = $senderUser ? $senderUser->photo_profil : null;
                }
            } else {
                // Fallback if the participant deleted the conversation from their side
                $senderUser = Utilisateur::find($msg->sender_id);
                if ($senderUser) {
                    if ($senderUser->id === $user->id) {
                        $senderName = 'Moi';
                        $senderPhoto = $user->photo_profil;
                    } else if ($senderUser->role === 'admin') {
                        $senderName = 'Administration CEDoc';
                    } else {
                        $senderName = $senderUser->nom . ' ' . $senderUser->prenom;
                    }
                }
            }

            return [
                'id' => $msg->id,
                'conversation_id' => $msg->conversation_id,
                'sender_id' => $msg->sender_id,
                'sender_name' => $senderName,
                'sender_photo_profil' => $senderPhoto,
                'is_mine' => $msg->sender_id === $user->id,
                'contenu' => $msg->contenu,
                'piece_jointe' => $msg->piece_jointe,
                'is_read' => $msg->is_read,
                'created_at' => $msg->created_at,
            ];
        });

        return response()->json(['success' => true, 'data' => $formattedMessages]);
    }

    /**
     * Send a new message or reply.
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'contenu' => 'required|string',
            'conversation_id' => 'nullable|exists:conversations,id',
            'receiver_id' => 'nullable|exists:utilisateurs,id', // Required if new conversation
            'piece_jointe' => 'nullable|file|mimes:pdf,png,jpg,jpeg,doc,docx|max:5120',
        ]);
        $user = auth()->user();
        $conversation_id = $request->conversation_id;

        // If no conversation_id, create a new conversation
        if (!$conversation_id) {
            if ($user->role === 'candidat') {
                return response()->json(['success' => false, 'message' => 'Les candidats ne peuvent pas initier de conversation.'], 403);
            }

            if (!$request->receiver_id) {
                return response()->json(['success' => false, 'message' => 'receiver_id est requis pour une nouvelle conversation.'], 400);
            }

            // Check if a conversation between these two already exists
            $existing = Conversation::whereHas('participants', function($q) use ($user) {
                $q->where('utilisateur_id', $user->id);
            })->whereHas('participants', function($q) use ($request) {
                $q->where('utilisateur_id', $request->receiver_id);
            })->withCount('participants')->having('participants_count', '=', 2)->first();

            if ($existing) {
                $conversation_id = $existing->id;
            } else {
                $conversation = Conversation::create([
                    'titre' => $request->titre ?? null,
                ]);
                $conversation_id = $conversation->id;

                // Add sender
                $isAnonymous = false;
                $anonLabel = null;
                if ($user->role === 'admin') {
                    $isAnonymous = true;
                    $anonLabel = 'Administration CEDoc';
                }

                ConversationParticipant::create([
                    'conversation_id' => $conversation_id,
                    'utilisateur_id' => $user->id,
                    'is_anonymous' => $isAnonymous,
                    'anonymous_label' => $anonLabel,
                    'role_context' => $request->query('role_context', $user->role)
                ]);

                // Determine receiver role context
                $receiverUser = Utilisateur::find($request->receiver_id);
                $receiverContext = $receiverUser ? $receiverUser->role : null;
                // If it's a doctorant sending to a supervisor, the receiver context is professeur
                if ($user->role === 'candidat' || $user->role === 'doctorant') {
                    $receiverContext = 'professeur';
                }

                ConversationParticipant::create([
                    'conversation_id' => $conversation_id,
                    'utilisateur_id' => $request->receiver_id,
                    'is_anonymous' => false,
                    'anonymous_label' => null,
                    'role_context' => $receiverContext
                ]);
            }
        } else {
            // Verify participation
            $participant = ConversationParticipant::where('conversation_id', $conversation_id)
                ->where('utilisateur_id', $user->id)
                ->first();
            if (!$participant && $user->role !== 'admin') {
                return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
            }
        }

        // Handle File Upload
        $path = null;
        if ($request->hasFile('piece_jointe')) {
            $file = $request->file('piece_jointe');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('messages_attachments', $filename, 'public');
        }

        $message = Message::create([
            'conversation_id' => $conversation_id,
            'sender_id' => $user->id,
            'contenu' => $request->contenu,
            'piece_jointe' => $path,
            'is_read' => false,
        ]);

        // Touch conversation to update updated_at
        Conversation::find($conversation_id)->touch();

        return response()->json(['success' => true, 'message' => 'Message envoyé.', 'data' => $message]);
    }

    /**
     * Broadcast a message to all candidates or specific group (Admin only).
     */
    public function broadcastMessage(Request $request)
    {
        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'directeur', 'professeur'])) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        $request->validate([
            'contenu' => 'required|string',
            'titre' => 'required|string',
            'cible' => 'required|string|in:all_candidats,all_doctorants,all_professeurs,all_directeurs,all,lab_professeurs,lab_doctorants,lab_all,prof_doctorants,lab_directeur',
            'piece_jointe' => 'nullable|file|mimes:pdf,png,jpg,jpeg,doc,docx|max:5120',
        ]);

        // Determine receivers
        $receivers = collect();
        if ($user->role === 'admin') {
            if ($request->cible === 'all_candidats') {
                $receivers = Utilisateur::where('role', 'candidat')->get();
            } else if ($request->cible === 'all_doctorants') {
                $receivers = Utilisateur::where('role', 'doctorant')->get();
            } else if ($request->cible === 'all_professeurs') {
                $receivers = Utilisateur::where('role', 'professeur')->get();
            } else if ($request->cible === 'all_directeurs') {
                $receivers = Utilisateur::where('role', 'directeur')->get();
            } else if ($request->cible === 'all') {
                $receivers = Utilisateur::where('id', '!=', $user->id)->get();
            }
        } else if ($user->role === 'directeur') {
            
            // Helper to get doctorants of the lab
            $getLabDoctorantsIds = function() use ($user) {
                return DB::table('candidature_choix')
                    ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
                    ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
                    ->where('sujets_these.laboratoire_id', $user->laboratoire_id)
                    ->where('candidature_choix.statut_choix', 'admis')
                    ->pluck('candidatures.doctorant_id');
            };

            if ($request->cible === 'lab_professeurs') {
                if (!$user->laboratoire_id) {
                    return response()->json(['success' => false, 'message' => 'Vous n\'êtes assigné à aucun laboratoire.'], 400);
                }
                $receivers = Utilisateur::where('laboratoire_id', $user->laboratoire_id)->where('role', 'professeur')->where('id', '!=', $user->id)->get();
            } else if ($request->cible === 'lab_doctorants') {
                if (!$user->laboratoire_id) {
                    return response()->json(['success' => false, 'message' => 'Vous n\'êtes assigné à aucun laboratoire.'], 400);
                }
                $ids = $getLabDoctorantsIds();
                $receivers = Utilisateur::whereIn('id', $ids)->get();
            } else if ($request->cible === 'lab_all') {
                if (!$user->laboratoire_id) {
                    return response()->json(['success' => false, 'message' => 'Vous n\'êtes assigné à aucun laboratoire.'], 400);
                }
                $profs = Utilisateur::where('laboratoire_id', $user->laboratoire_id)->where('id', '!=', $user->id)->get();
                $ids = $getLabDoctorantsIds();
                $doctorants = Utilisateur::whereIn('id', $ids)->get();
                $receivers = $profs->merge($doctorants)->unique('id');
            }
        } else if ($user->role === 'professeur') {
            
            $getProfDoctorantsIds = function() use ($user) {
                return DB::table('candidature_choix')
                    ->join('candidatures', 'candidature_choix.candidature_id', '=', 'candidatures.id')
                    ->join('sujets_these', 'candidature_choix.sujet_id', '=', 'sujets_these.id')
                    ->where('sujets_these.enseignant_id', $user->id)
                    ->where('candidature_choix.statut_choix', 'admis')
                    ->pluck('candidatures.doctorant_id');
            };

            if ($request->cible === 'prof_doctorants') {
                $ids = $getProfDoctorantsIds();
                $receivers = Utilisateur::whereIn('id', $ids)->get();
            } else if ($request->cible === 'lab_professeurs') {
                if (!$user->laboratoire_id) {
                    return response()->json(['success' => false, 'message' => 'Vous n\'êtes assigné à aucun laboratoire.'], 400);
                }
                $receivers = Utilisateur::where('laboratoire_id', $user->laboratoire_id)->where('role', 'professeur')->where('id', '!=', $user->id)->get();
            } else if ($request->cible === 'lab_directeur') {
                if (!$user->laboratoire_id) {
                    return response()->json(['success' => false, 'message' => 'Vous n\'êtes assigné à aucun laboratoire.'], 400);
                }
                $receivers = Utilisateur::where('laboratoire_id', $user->laboratoire_id)->where('role', 'directeur')->get();
                if ($receivers->isEmpty()) {
                    return response()->json(['success' => false, 'message' => 'Aucun destinataire trouvé pour cette option.'], 400);
                }
            }
        } else if ($user->role === 'candidat' || $user->role === 'doctorant') {
            // A candidat/doctorant can send to a specific person (encadrant or directeur)
            // Expecting 'cible' to be the user ID of the receiver
            $receiverId = $request->cible;
            $receiver = Utilisateur::find($receiverId);
            if ($receiver && in_array($receiver->role, ['professeur', 'directeur'])) {
                $receivers = collect([$receiver]);
            }
        }

        if ($receivers->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucun destinataire trouvé pour cette option.'], 400);
        }

        // Handle File Upload
        $path = null;
        if ($request->hasFile('piece_jointe')) {
            $file = $request->file('piece_jointe');
            $filename = time() . '_broadcast_' . $file->getClientOriginalName();
            $path = $file->storeAs('messages_attachments', $filename, 'public');
        }

        DB::beginTransaction();
        try {
            foreach ($receivers as $receiver) {
                $conversation = Conversation::create(['titre' => $request->titre]);
                
                ConversationParticipant::create([
                    'conversation_id' => $conversation->id,
                    'utilisateur_id' => $user->id,
                    'is_anonymous' => $user->role === 'admin',
                    'anonymous_label' => $user->role === 'admin' ? 'Administration CEDoc' : null,
                    'role_context' => $request->query('role_context', $user->role)
                ]);

                // Determine receiver context based on cible
                $receiverContext = $receiver->role;
                if (in_array($request->cible, ['lab_professeurs', 'all_professeurs'])) {
                    $receiverContext = 'professeur';
                } else if (in_array($request->cible, ['lab_directeur', 'all_directeurs'])) {
                    $receiverContext = 'directeur';
                }

                ConversationParticipant::create([
                    'conversation_id' => $conversation->id,
                    'utilisateur_id' => $receiver->id,
                    'is_anonymous' => false,
                    'role_context' => $receiverContext
                ]);

                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'contenu' => $request->contenu,
                    'piece_jointe' => $path,
                    'is_read' => false,
                ]);
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => count($receivers) . ' messages envoyés.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur lors de l\'envoi broadcast.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a conversation.
     */
    public function destroyConversation(Request $request, $id)
    {
        $user = auth()->user();

        $conversation = Conversation::find($id);
        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation introuvable.'], 404);
        }

        // Delete only the participant record for the current user
        // This "deletes" the conversation from their side only.
        ConversationParticipant::where('conversation_id', $id)
            ->where('utilisateur_id', $user->id)
            ->delete();

        // Check if there are any participants left. If none, we can safely delete the whole conversation.
        $remainingParticipantsCount = ConversationParticipant::where('conversation_id', $id)->count();
        if ($remainingParticipantsCount === 0) {
            Message::where('conversation_id', $id)->delete();
            $conversation->delete();
        }

        return response()->json(['success' => true, 'message' => 'Conversation supprimée de votre côté avec succès.']);
    }

    /**
     * Delete a single message.
     */
    public function destroyMessage(Request $request, $id)
    {
        $user = auth()->user();

        $message = Message::find($id);
        if (!$message) {
            return response()->json(['success' => false, 'message' => 'Message introuvable.'], 404);
        }

        // Admins can delete any message. Otherwise, only the sender can delete their own message.
        if ($user->role !== 'admin' && $message->sender_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé.'], 403);
        }

        $message->delete();

        return response()->json(['success' => true, 'message' => 'Message supprimé.']);
    }
}
