import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  animations: [
    trigger('openClose', [
      state('open', style({
        transform: 'scale(1)',
        opacity: 1
      })),
      state('closed', style({
        transform: 'scale(0.95)',
        opacity: 0,
        pointerEvents: 'none'
      })),
      transition('closed => open', [
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('open => closed', [
        animate('0.15s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class ChatbotComponent {
  isOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  isTyping = false;

  constructor(private http: HttpClient) {
    // Message de bienvenue initial retiré à la demande de l'utilisateur
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage = this.newMessage;
    this.messages.push({
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    });
    
    this.newMessage = '';
    this.isTyping = true;
    this.scrollToBottom();

    // Call Laravel Backend API
    this.http.post<any>(`http://localhost:8000/api/chatbot/ask`, { query: userMessage })
      .subscribe({
        next: (response) => {
          this.isTyping = false;
          if (response.success) {
            this.messages.push({
              text: response.reply,
              sender: 'bot',
              timestamp: new Date()
            });
          }
          this.scrollToBottom();
        },
        error: (error) => {
          this.isTyping = false;
          this.messages.push({
            text: 'Désolé, je rencontre des difficultés techniques en ce moment.',
            sender: 'bot',
            timestamp: new Date()
          });
          console.error('Chatbot error:', error);
          this.scrollToBottom();
        }
      });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}
