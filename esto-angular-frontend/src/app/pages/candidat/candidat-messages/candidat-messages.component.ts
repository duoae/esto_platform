import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidat-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      <!-- Left Sidebar: Conversations List -->
      <div class="w-full md:w-1/3 lg:w-1/4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="p-4 border-b border-gray-100 bg-slate-50/50">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-slate-800 tracking-tight">Messagerie</h2>
            <button (click)="openNewMessageModal()" class="text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 p-1.5 rounded-lg transition-colors flex items-center justify-center" title="Nouveau message">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
          
          <!-- Search -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher..." 
                   class="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-esto-primary/50 focus:border-esto-primary sm:text-sm transition-colors">
          </div>
        </div>

        <!-- Conversations List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          
          <div *ngIf="isLoadingConversations" class="flex justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-esto-primary"></div>
          </div>
          
          <div *ngIf="!isLoadingConversations && filteredConversations.length === 0" class="text-center p-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p class="text-sm">Aucune conversation trouvée.</p>
          </div>

          <button *ngFor="let conv of filteredConversations" 
                  (click)="selectConversation(conv)"
                  [class.bg-teal-50]="selectedConversation?.id === conv.id"
                  [class.border-teal-100]="selectedConversation?.id === conv.id"
                  [class.bg-white]="selectedConversation?.id !== conv.id"
                  [class.border-transparent]="selectedConversation?.id !== conv.id"
                  [class.hover:bg-slate-50]="selectedConversation?.id !== conv.id"
                  class="w-full text-left p-2.5 rounded-lg transition-all border shadow-sm flex items-start gap-2.5 group relative overflow-hidden"
                  [ngClass]="selectedConversation?.id !== conv.id ? 'hover:border-slate-200' : ''">
            
            <div class="relative shrink-0">
              <div *ngIf="!conv.photo_profil" class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                   [ngClass]="selectedConversation?.id === conv.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'">
                {{ getInitials(conv.titre) }}
              </div>
              <img *ngIf="conv.photo_profil" [src]="getAttachmentUrl(conv.photo_profil)" class="w-9 h-9 rounded-full object-cover border"
                   [ngClass]="selectedConversation?.id === conv.id ? 'border-teal-500 shadow-md' : 'border-slate-200'">
              <div *ngIf="!conv.is_read && selectedConversation?.id !== conv.id" class="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="font-semibold truncate pr-2 text-sm text-slate-800">{{ conv.titre }}</h3>
                <span class="text-[9px] shrink-0 whitespace-nowrap text-slate-400">{{ conv.last_message_date | date:'dd/MM HH:mm' }}</span>
              </div>
              <p class="text-xs truncate text-slate-500">{{ conv.last_message || 'Nouveau message...' }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Right Area: Chat Area -->
      <div class="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
        
        <div *ngIf="!selectedConversation" class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
          <div class="w-24 h-24 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-esto-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
          </div>
          <h2 class="text-xl font-bold text-slate-700 mb-1">Vos Messages</h2>
          <p class="text-slate-500 text-sm max-w-sm">Sélectionnez une conversation dans la liste pour afficher les messages.</p>
        </div>

        <ng-container *ngIf="selectedConversation">
          <!-- Chat Header -->
          <div class="p-3 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur-sm z-10 sticky top-0">
            <div class="flex items-center gap-3">
              <button class="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-teal-600 rounded-md" (click)="selectedConversation = null">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div *ngIf="!selectedConversation.photo_profil" class="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shadow-sm border border-teal-100">
                {{ getInitials(selectedConversation.titre) }}
              </div>
              <img *ngIf="selectedConversation.photo_profil" [src]="getAttachmentUrl(selectedConversation.photo_profil)" class="w-9 h-9 rounded-full object-cover shadow-sm border border-teal-100">
              <div>
                <h2 class="font-semibold text-slate-800 text-sm leading-tight">{{ selectedConversation.titre }}</h2>
                <span class="text-[10px] text-slate-400">ID: #{{ selectedConversation.id }}</span>
              </div>
            </div>
            <button (click)="loadMessages()" class="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="Rafraîchir">
              <svg class="w-4 h-4" [class.animate-spin]="isLoadingMessages" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>

          <!-- Chat History -->
          <div class="flex-1 overflow-y-auto p-4 bg-slate-50/50 flex flex-col space-y-4 custom-scrollbar" #chatContainer>
            
            <div *ngIf="isLoadingMessages" class="flex justify-center p-4">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
            </div>

            <div *ngFor="let msg of messages" class="flex w-full" [ngClass]="msg.is_mine ? 'justify-end' : 'justify-start'">
              <div class="flex flex-col max-w-[85%] md:max-w-[75%]">
                <span class="text-[10px] mb-0.5 font-medium mx-1" [ngClass]="msg.is_mine ? 'text-right text-slate-400' : 'text-left text-slate-400'">
                  {{ msg.sender_name }} • {{ msg.created_at | date:'dd/MM HH:mm' }}
                </span>
                <div class="px-3.5 py-2.5 rounded-2xl shadow-sm relative group border"
                     [ngClass]="msg.is_mine ? 'bg-teal-50 text-teal-900 border-teal-100 rounded-tr-sm' : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm'">
                  
                  <p class="text-sm leading-snug whitespace-pre-wrap">{{ msg.contenu }}</p>
                  
                  <div *ngIf="msg.piece_jointe" class="mt-2 p-2 rounded-lg flex items-center gap-2 transition-colors border"
                       [ngClass]="msg.is_mine ? 'bg-teal-100/50 border-teal-200 hover:bg-teal-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'">
                    <div class="w-8 h-8 rounded flex items-center justify-center shrink-0"
                         [ngClass]="msg.is_mine ? 'bg-white text-teal-600 shadow-sm' : 'bg-white text-slate-500 shadow-sm border border-slate-200'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[11px] font-semibold truncate">Pièce jointe</p>
                      <a [href]="getAttachmentUrl(msg.piece_jointe)" target="_blank" class="text-[10px] underline flex items-center gap-1 mt-0.5"
                         [ngClass]="msg.is_mine ? 'text-teal-700 hover:text-teal-900' : 'text-slate-500 hover:text-slate-700'">
                        Télécharger
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="p-3 bg-white border-t border-slate-100">
            <div *ngIf="selectedFile" class="mb-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-2 overflow-hidden">
                <div class="w-6 h-6 rounded bg-white shadow-sm border border-slate-100 flex items-center justify-center text-teal-600 shrink-0">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <span class="text-xs text-slate-700 font-medium truncate">{{ selectedFile.name }}</span>
              </div>
              <button (click)="removeFile()" class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form (ngSubmit)="sendReply()" class="flex items-end gap-2">
              <div class="flex-1 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 focus-within:bg-white transition-all flex items-center overflow-hidden">
                <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx">
                <button type="button" (click)="fileInput.click()" class="p-2.5 text-slate-400 hover:text-teal-600 transition-colors h-full" title="Joindre un fichier">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </button>
                <textarea 
                  [(ngModel)]="newMessageContent" 
                  name="content"
                  rows="1"
                  placeholder="Écrivez votre réponse..." 
                  class="flex-1 bg-transparent py-2.5 pr-3 border-none focus:ring-0 text-sm resize-none custom-scrollbar max-h-24"
                  (keydown.enter)="$event.preventDefault(); sendReply()"></textarea>
              </div>
              <button type="submit" 
                      [disabled]="!newMessageContent.trim() && !selectedFile"
                      [class.opacity-50]="!newMessageContent.trim() && !selectedFile"
                      class="h-10 w-10 bg-teal-500 text-white rounded-xl flex items-center justify-center shadow-sm hover:bg-teal-600 transition-all shrink-0 group">
                <svg class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </form>
          </div>
        </ng-container>
      </div>
    </div>

    <!-- Modal Nouveau Message -->
    <div *ngIf="showNewMessageModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">Nouveau Message</h2>
          <button (click)="closeNewMessageModal()" class="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form (ngSubmit)="sendNewMessage()" class="flex flex-col flex-1 overflow-hidden p-8 space-y-6 overflow-y-auto">
          
          <!-- Destinataire -->
          <div class="mb-5 relative z-50">
            <label class="block text-sm font-bold text-gray-700 mb-2">Destinataire</label>
            <div *ngIf="isLoadingContacts" class="text-sm text-gray-500 mb-2">Chargement des contacts...</div>
            
            <div *ngIf="!isLoadingContacts && contacts.length === 0" class="text-sm text-gray-500">
              Aucun destinataire disponible.
            </div>

            <div *ngIf="!isLoadingContacts && contacts.length > 0" class="flex w-full gap-2">
              <button *ngFor="let contact of contacts" type="button" 
                      (click)="selectContact(contact)"
                      [ngClass]="(newMsgForm.cible == contact.id && selectedRoleLabel === contact.role_label) ? 'bg-teal-500 text-white border-teal-500 shadow-sm hover:bg-teal-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
                      class="flex-1 px-1 py-2 text-[10px] sm:text-xs border rounded-xl font-medium transition-all text-center break-words leading-tight flex flex-col items-center justify-center gap-1">
                <span class="font-bold">{{ contact.nom }} {{ contact.prenom }}</span>
                <span class="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                      [ngClass]="(newMsgForm.cible == contact.id && selectedRoleLabel === contact.role_label) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'">
                  {{ contact.role_label }}
                </span>
              </button>
            </div>
          </div>

          <!-- Titre -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Sujet du Message</label>
            <input type="text" [(ngModel)]="newMsgForm.titre" name="titre" required
                   class="block w-full rounded-xl border-none bg-gray-50 shadow-inner focus:ring-2 focus:ring-teal-500 sm:text-sm py-3 px-5 transition-all outline-none"
                   placeholder="Sujet...">
          </div>

          <!-- Contenu -->
          <div class="flex-1 flex flex-col min-h-[200px]">
            <label class="block text-sm font-bold text-gray-700 mb-2">Message</label>
            <textarea [(ngModel)]="newMsgForm.contenu" name="contenu" required rows="6"
                      class="block w-full rounded-xl border-none bg-gray-50 shadow-inner focus:ring-2 focus:ring-teal-500 sm:text-sm py-4 px-5 resize-none flex-1 custom-scrollbar transition-all outline-none"
                      placeholder="Écrivez votre message ici..."></textarea>
          </div>

          <!-- Pièce jointe -->
          <div class="pt-2">
             <label class="block text-sm font-bold text-gray-700 mb-2">Joindre un document (Optionnel)</label>
             <div class="flex items-center justify-center w-full">
                <label for="dropzone-file-new" class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-300 transition-all">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <p class="mb-1 text-sm text-gray-600"><span class="font-bold text-teal-600">Cliquez</span> ou glissez un fichier</p>
                        <p class="text-xs text-gray-400">PDF, PNG, JPG ou DOC (Max: 5MB)</p>
                    </div>
                    <input id="dropzone-file-new" type="file" class="hidden" (change)="onNewMsgFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                </label>
             </div>
             <p *ngIf="newMsgForm.file" class="text-xs text-teal-600 font-bold mt-2 text-center">{{ newMsgForm.file.name }}</p>
          </div>

          <div class="pt-6 flex justify-end gap-4 mt-auto border-t border-gray-50">
            <button type="button" (click)="closeNewMessageModal()" class="px-6 py-3 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-bold transition-colors">
              Annuler
            </button>
            <button type="submit" 
                    [disabled]="isSendingNew"
                    class="px-8 py-3 rounded-xl text-white bg-teal-500 hover:bg-teal-600 shadow-md font-bold transition-all flex items-center gap-2"
                    [class.opacity-70]="isSendingNew">
              <svg *ngIf="isSendingNew" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg *ngIf="!isSendingNew" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              {{ isSendingNew ? 'Envoi...' : 'Envoyer le message' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 20px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
  `]
})
export class CandidatMessagesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  conversations: any[] = [];
  filteredConversations: any[] = [];
  messages: any[] = [];
  
  selectedConversation: any = null;
  searchQuery = '';
  
  isLoadingConversations = true;
  isLoadingMessages = false;
  
  newMessageContent = '';
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Contacts and New Message state
  contacts: any[] = [];
  isLoadingContacts = false;
  showNewMessageModal = false;
  isSendingNew = false;
  newMsgForm = {
    cible: '',
    titre: '',
    contenu: '',
    file: null as File | null
  };

  currentUser: any = null;

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {}
    }
    
    this.loadConversations();
    this.loadContacts();
  }
  
  ngOnDestroy() {}

  loadConversations() {
    this.isLoadingConversations = true;
    this.http.get<any>(`${this.apiUrl}/messages/conversations`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.conversations = response.data || [];
        this.filterConversations();
        this.isLoadingConversations = false;
      },
      error: (err) => {
        console.error('Erreur chargement conversations:', err);
        this.isLoadingConversations = false;
      }
    });
  }

  ngDoCheck() {
    if (this.searchQuery !== this.lastSearchQuery) {
      this.lastSearchQuery = this.searchQuery;
      this.filterConversations();
    }
  }
  private lastSearchQuery = '';

  filterConversations() {
    if (!this.searchQuery) {
      this.filteredConversations = this.conversations;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredConversations = this.conversations.filter(c => 
      c.titre?.toLowerCase().includes(q) || 
      c.last_message?.toLowerCase().includes(q)
    );
  }

  selectConversation(conv: any) {
    this.selectedConversation = conv;
    this.loadMessages();
    conv.is_read = true;
  }

  loadMessages() {
    if (!this.selectedConversation) return;
    this.isLoadingMessages = true;
    
    this.http.get<any>(`${this.apiUrl}/messages/conversations/${this.selectedConversation.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.messages = response.data || [];
        this.isLoadingMessages = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Erreur chargement messages:', err);
        this.isLoadingMessages = false;
      }
    });
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  removeFile() {
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  sendReply() {
    if (!this.newMessageContent.trim() && !this.selectedFile) return;
    if (!this.selectedConversation) return;

    const formData = new FormData();
    formData.append('conversation_id', this.selectedConversation.id);
    if (this.newMessageContent.trim()) {
      formData.append('contenu', this.newMessageContent.trim());
    } else {
      formData.append('contenu', 'Pièce jointe');
    }
    if (this.selectedFile) {
      formData.append('piece_jointe', this.selectedFile);
    }

    this.http.post<any>(`${this.apiUrl}/messages/send`, formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.newMessageContent = '';
        this.removeFile();
        this.loadMessages();
        this.loadConversations();
      },
      error: (err) => {
        console.error('Erreur envoi message:', err);
        alert('Erreur lors de l\'envoi du message.');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAttachmentUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }

  // --- New Message Methods ---
  searchContactQuery = '';
  showContactDropdown = false;
  selectedRoleLabel = '';

  selectContact(contact: any) {
    this.newMsgForm.cible = contact.id;
    this.selectedRoleLabel = contact.role_label;
    this.searchContactQuery = `${contact.nom} ${contact.prenom} (${contact.role_label})`;
    this.hideContactDropdown();
  }

  hideContactDropdown() {
    setTimeout(() => {
      this.showContactDropdown = false;
    }, 150);
  }

  loadContacts() {
    this.isLoadingContacts = true;
    this.http.get<any>(`${this.apiUrl}/messages/candidat-contacts`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.contacts = res.data || [];
        this.isLoadingContacts = false;
      },
      error: (err) => {
        console.error('Erreur chargement contacts:', err);
        this.isLoadingContacts = false;
      }
    });
  }

  openNewMessageModal() {
    this.showNewMessageModal = true;
    this.newMsgForm = { cible: '', titre: '', contenu: '', file: null };
    this.searchContactQuery = '';
    this.selectedRoleLabel = '';
  }

  closeNewMessageModal() {
    this.showNewMessageModal = false;
  }

  onNewMsgFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.newMsgForm.file = event.target.files[0];
    }
  }

  sendNewMessage() {
    if (!this.newMsgForm.cible || !this.newMsgForm.titre || !this.newMsgForm.contenu) {
      return;
    }
    
    this.isSendingNew = true;
    const formData = new FormData();
    formData.append('receiver_id', this.newMsgForm.cible);
    formData.append('titre', this.newMsgForm.titre);
    formData.append('contenu', this.newMsgForm.contenu);
    if (this.newMsgForm.file) {
      formData.append('piece_jointe', this.newMsgForm.file);
    }

    this.http.post<any>(`${this.apiUrl}/messages/send`, formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.isSendingNew = false;
        this.closeNewMessageModal();
        this.loadConversations();
      },
      error: (err) => {
        console.error('Erreur envoi nouveau message:', err);
        this.isSendingNew = false;
        alert("Erreur lors de l'envoi du message.");
      }
    });
  }
}
