import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-directeur-messages',
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
            <button (click)="openNewMessageModal()" class="bg-teal-500 hover:bg-teal-600 text-white p-1.5 rounded-lg shadow-sm transition-all flex items-center justify-center group" title="Nouveau Message">
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>
          
          <!-- Search -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher..." 
                   class="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-esto-primary/50 focus:border-esto-primary sm:text-sm transition-colors">
          </div>
        </div>

        <!-- Filters -->
        <div class="px-4 pb-3 border-b border-gray-100 flex gap-2 bg-slate-50/50">
          <button (click)="setFilterTab('all')" [ngClass]="filterTab === 'all' ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1">Tous</button>
          <button (click)="setFilterTab('sent')" [ngClass]="filterTab === 'sent' ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1">Envoyés</button>
          <button (click)="setFilterTab('received')" [ngClass]="filterTab === 'received' ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1">Reçus</button>
        </div>

        <!-- Conversations List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          
          <div *ngIf="isLoadingConversations" class="flex justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-esto-primary"></div>
          </div>
          
          <div *ngIf="!isLoadingConversations && filteredConversations.length === 0" class="text-center p-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
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
            
            <!-- Avatar Indicator -->
            <div class="relative shrink-0">
              <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                   [ngClass]="selectedConversation?.id === conv.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'">
                {{ getInitials(conv.titre) }}
              </div>
              <div *ngIf="!conv.is_read && selectedConversation?.id !== conv.id" class="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="font-semibold truncate pr-2 text-sm text-slate-800">
                  {{ conv.titre }}
                </h3>
                <span class="text-[9px] shrink-0 whitespace-nowrap text-slate-400">
                  {{ conv.last_message_date | date:'dd/MM HH:mm' }}
                </span>
              </div>
              <p class="text-xs truncate text-slate-500">
                 {{ conv.last_message || 'Nouveau message...' }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Right Area: Chat Area -->
      <div class="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
        
        <!-- Empty State -->
        <div *ngIf="!selectedConversation" class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
          <div class="w-24 h-24 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-esto-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-700 mb-1">Vos Messages</h2>
          <p class="text-slate-500 text-sm max-w-sm">Sélectionnez une conversation dans la liste pour afficher les messages ou créez un nouveau message.</p>
          <button (click)="openNewMessageModal()" class="mt-6 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-sm font-medium text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Nouveau Message
          </button>
        </div>

        <ng-container *ngIf="selectedConversation">
          
          <!-- Chat Header -->
          <div class="p-3 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur-sm z-10 sticky top-0">
            <div class="flex items-center gap-3">
              <button class="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-teal-600 rounded-md" (click)="selectedConversation = null">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div class="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shadow-sm border border-teal-100">
                {{ getInitials(selectedConversation.titre) }}
              </div>
              <div>
                <h2 class="font-semibold text-slate-800 text-sm leading-tight">{{ selectedConversation.titre }}</h2>
                <span class="text-[10px] text-slate-400">ID: #{{ selectedConversation.id }}</span>
              </div>
            </div>
            <!-- Actions -->
            <div class="flex items-center gap-1 relative">
              <button (click)="confirmDeleteConversation()" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer la conversation" [class.bg-red-50]="showDeleteConfirm" [class.text-red-500]="showDeleteConfirm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
              <button (click)="loadMessages()" class="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="Rafraîchir">
                <svg class="w-4 h-4" [class.animate-spin]="isLoadingMessages" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>

              <!-- Confirmation de suppression (Dropdown Popover) -->
              <div *ngIf="showDeleteConfirm" class="absolute top-full right-0 mt-2 z-[60] bg-white rounded-xl shadow-xl border border-slate-100 p-3 w-64 text-left">
                <h4 class="font-bold text-slate-800 text-sm mb-1">Confirmer la suppression</h4>
                <p class="text-[11px] text-slate-500 mb-3 leading-tight">Cette conversation sera effacée uniquement de votre côté.</p>
                <div class="flex items-center gap-2">
                  <button (click)="showDeleteConfirm = false" class="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">Annuler</button>
                  <button (click)="executeDelete()" class="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors flex items-center justify-center gap-1" [class.opacity-70]="isDeleting">
                    <svg *ngIf="isDeleting" class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ isDeleting ? '...' : 'Supprimer' }}
                  </button>
                </div>
              </div>
            </div>
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
                     [ngClass]="msg.is_mine ? 'bg-teal-600 text-white border-teal-700 rounded-tr-sm' : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm'">
                  
                  <!-- Delete Single Message Logic (Seulement pour ses propres messages) -->
                  <div *ngIf="msg.is_mine" class="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 h-full"
                       [ngClass]="msg.is_mine ? '-left-auto right-full pr-2' : 'left-full pl-2 right-auto'">
                       
                    <button *ngIf="messageToDelete !== msg.id"
                            (click)="messageToDelete = msg.id" 
                            class="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-500 shadow-sm border border-red-100 transition-all hover:bg-red-100"
                            title="Supprimer ce message">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    
                    <div *ngIf="messageToDelete === msg.id" class="flex items-center gap-1 bg-white p-1.5 rounded-lg shadow-md border border-red-100 animate-fade-in w-max">
                      <span class="text-[10px] font-bold text-slate-500 px-1">Supprimer?</span>
                      <button (click)="executeDeleteSingle(msg.id)" class="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded transition-colors flex items-center justify-center min-w-[36px]" [disabled]="isDeletingSingle">
                         <svg *ngIf="isDeletingSingle" class="animate-spin h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24">
                           <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                           <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         <span *ngIf="!isDeletingSingle">Oui</span>
                      </button>
                      <button (click)="messageToDelete = null" [disabled]="isDeletingSingle" class="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors">Non</button>
                    </div>
                  </div>

                  <p class="text-sm leading-snug whitespace-pre-wrap relative z-0">{{ msg.contenu }}</p>
                  
                  <!-- Attachment -->
                  <div *ngIf="msg.piece_jointe" class="mt-2">
                    <!-- Image -->
                    <div *ngIf="isImage(msg.piece_jointe)" class="rounded-lg overflow-hidden border border-black/10 max-w-[200px] sm:max-w-[250px]">
                      <a [href]="getAttachmentUrl(msg.piece_jointe)" target="_blank">
                        <img [src]="getAttachmentUrl(msg.piece_jointe)" alt="Image attachée" class="w-full h-auto object-cover bg-white">
                      </a>
                    </div>
                    <!-- Document -->
                    <div *ngIf="!isImage(msg.piece_jointe)" class="p-2 rounded-lg flex items-center gap-2 transition-colors border"
                         [ngClass]="msg.is_mine ? 'bg-teal-700/50 border-teal-800 hover:bg-teal-700/70 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'">
                      <div class="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-white/20 shadow-sm border border-white/10"
                           [ngClass]="!msg.is_mine ? 'bg-white border-slate-200 text-slate-500' : ''">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-semibold truncate">{{ getFileName(msg.piece_jointe) }}</p>
                        <a [href]="getAttachmentUrl(msg.piece_jointe)" target="_blank" class="text-[10px] underline flex items-center gap-1 mt-0.5 opacity-80 hover:opacity-100">
                          Télécharger
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </a>
                      </div>
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
                  placeholder="Écrivez votre message..." 
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
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 class="text-xl font-bold text-gray-900">Nouveau Message (Directeur)</h2>
          <button (click)="closeNewMessageModal()" class="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-xl shadow-sm border border-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form (ngSubmit)="sendNewMessage()" class="flex flex-col flex-1 overflow-hidden p-6 space-y-5 overflow-y-auto">
          
          <!-- Mode d'envoi -->
          <div class="mb-5">
            <label class="block text-sm font-bold text-gray-700 mb-2">Mode d'envoi</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" (click)="setMode('lab_professeurs')"
                      [ngClass]="newMsgForm.mode === 'lab_professeurs' ? 'bg-teal-500 text-white border-teal-500 shadow-sm hover:bg-teal-500/90' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
                      class="px-4 py-2 text-sm border rounded-xl font-medium transition-all">
                Tous les Profs du Labo
              </button>
              <button type="button" (click)="setMode('lab_doctorants')"
                      [ngClass]="newMsgForm.mode === 'lab_doctorants' ? 'bg-teal-500 text-white border-teal-500 shadow-sm hover:bg-teal-500/90' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
                      class="px-4 py-2 text-sm border rounded-xl font-medium transition-all">
                Tous les Doctorants du Labo
              </button>
              <button type="button" (click)="setMode('lab_all')"
                      [ngClass]="newMsgForm.mode === 'lab_all' ? 'bg-teal-500 text-white border-teal-500 shadow-sm hover:bg-teal-500/90' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
                      class="px-4 py-2 text-sm border rounded-xl font-medium transition-all">
                Tout le Labo
              </button>
            </div>
          </div>

          <!-- Destinataire Spécifique (Recherche) -->
          <div class="mb-5 relative z-50">
            <label class="block text-sm font-bold text-gray-700 mb-2">Ou rechercher une personne spécifique</label>
            <input type="text" [(ngModel)]="searchUserQuery" name="searchUserQuery" 
                   (focus)="showUserDropdown = true; filterUsers()" 
                   (input)="showUserDropdown = true; filterUsers(); setMode('individual')"
                   (blur)="hideUserDropdown()"
                   autocomplete="off"
                   class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2.5 px-4 bg-gray-50/50"
                   placeholder="Rechercher par nom, email...">
             <!-- Dropdown -->
            <div *ngIf="showUserDropdown" class="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
              <div *ngIf="flatFilteredUsers.length === 0" class="p-4 text-center text-sm text-gray-500">Aucun utilisateur trouvé.</div>
              <button *ngFor="let u of flatFilteredUsers" type="button" (mousedown)="selectUser(u)" class="w-full text-left px-4 py-3 hover:bg-teal-500/5 border-b border-gray-50 flex items-center justify-between transition-colors">
                <div class="flex flex-col">
                  <span class="font-bold text-sm text-gray-900">{{ u.nom }} {{ u.prenom }}</span>
                  <span class="text-xs text-gray-500">{{ u.email ? u.email : "Pas d'email" }}</span>
                </div>
                <span class="text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide"
                      [ngClass]="u.role === 'professeur' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'">
                  {{ u.role === 'professeur' ? 'Professeur' : 'Doctorant' }}
                </span>
              </button>
            </div>
            
            <div *ngIf="newMsgForm.mode === 'individual' && newMsgForm.receiver_id" class="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 text-teal-500 rounded-lg text-sm font-medium border border-teal-500/20">
              <span>Sélection : <strong>{{ searchUserQuery }}</strong></span>
            </div>
          </div>

          <!-- Titre -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Sujet du Message</label>
            <input type="text" [(ngModel)]="newMsgForm.titre" name="titre" required
                   class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2.5 px-4 bg-gray-50/50"
                   placeholder="Titre de la conversation...">
          </div>

          <!-- Contenu -->
          <div class="flex-1 flex flex-col min-h-[150px]">
            <label class="block text-sm font-bold text-gray-700 mb-2">Message</label>
            <textarea [(ngModel)]="newMsgForm.contenu" name="contenu" required rows="5"
                      class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-3 px-4 bg-gray-50/50 resize-none flex-1 custom-scrollbar"
                      placeholder="Écrivez le contenu du message ici..."></textarea>
          </div>

          <!-- Pièce jointe -->
          <div class="pt-2">
             <label class="block text-sm font-bold text-gray-700 mb-2">Joindre un document (Optionnel)</label>
             <div class="flex items-center justify-center w-full">
                <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg class="w-6 h-6 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p class="mb-1 text-sm text-gray-500"><span class="font-bold">Cliquez</span> ou glissez un fichier</p>
                        <p class="text-xs text-gray-500">PDF, PNG, JPG ou DOC (Max: 5MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" class="hidden" (change)="onNewMsgFileSelected($event)" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                </label>
             </div>
             
             <!-- Selected file preview -->
             <div *ngIf="newMsgForm.file" class="mt-3 p-3 bg-teal-500/5 rounded-xl border border-teal-500/20 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span class="text-sm text-teal-500 font-bold">{{ newMsgForm.file.name }}</span>
                </div>
                <button type="button" (click)="newMsgForm.file = null" class="text-gray-400 hover:text-red-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
          </div>

          <div class="pt-4 flex justify-end gap-3 mt-auto">
            <button type="button" (click)="closeNewMessageModal()" class="px-5 py-2.5 rounded-xl text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-bold transition-colors">
              Annuler
            </button>
            <button type="submit" 
                    [disabled]="isSending"
                    class="px-6 py-2.5 rounded-xl text-white bg-teal-500 hover:bg-teal-500/90 shadow-md font-bold transition-all flex items-center gap-2"
                    [class.opacity-70]="isSending">
              <svg *ngIf="isSending" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg *ngIf="!isSending" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              {{ isSending ? 'Envoi...' : 'Envoyer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 20px;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      background: #d1d5db;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DirecteurMessagesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  conversations: any[] = [];
  filteredConversations: any[] = [];
  messages: any[] = [];
  
  selectedConversation: any = null;
  searchQuery = '';
  filterTab: 'all' | 'sent' | 'received' = 'all';
  
  isLoadingConversations = true;
  isLoadingMessages = false;
  
  // Reply form
  newMessageContent = '';
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Delete Confirmation Logic
  showDeleteConfirm: boolean = false;
  isDeleting: boolean = false;

  messageToDelete: number | null = null;
  isDeletingSingle: boolean = false;

  // New Message Modal
  showNewMessageModal = false;
  isSending = false;
  newMsgForm: {
    receiver_id: number | null;
    mode: 'lab_professeurs' | 'lab_doctorants' | 'lab_all' | 'individual';
    titre: string;
    contenu: string;
    file: File | null;
  } = {
    receiver_id: null,
    mode: 'lab_professeurs',
    titre: '',
    contenu: '',
    file: null
  };

  setMode(mode: 'lab_professeurs' | 'lab_doctorants' | 'lab_all' | 'individual') {
    this.newMsgForm.mode = mode;
    if (mode !== 'individual') {
      this.newMsgForm.receiver_id = null;
      this.searchUserQuery = '';
      this.showUserDropdown = false;
    }
  }

  users: any[] = [];
  flatFilteredUsers: any[] = [];
  searchUserQuery = '';
  showUserDropdown = false;

  ngOnInit() {
    this.loadConversations();
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any>(`${this.apiUrl}/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        const allUsers = response.data || response || [];
        const userStr = localStorage.getItem('esto_user');
        if (userStr) {
          const currentUser = JSON.parse(userStr);
          // Only keep professeurs from the same lab
          const profs = allUsers.filter((u: any) => 
            u.laboratoire_id === currentUser.laboratoire_id && 
            u.id !== currentUser.id &&
            u.role === 'professeur'
          );
          
          // Fetch doctorants from the lab
          this.http.get<any>(`${this.apiUrl}/directeur/candidats`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
          }).subscribe({
            next: (candRes) => {
              const candidats = candRes.data || [];
              const doctorants = candidats
                .filter((c: any) => c.statut_choix === 'admis')
                .map((c: any) => ({
                  id: c.candidat_id,
                  nom: c.nom,
                  prenom: c.prenom,
                  email: c.email,
                  role: 'doctorant'
                }));
                
              // Deduplicate if a doctorant is already in the profs list (edge case) or users list
              const existingIds = new Set(profs.map((p: any) => p.id));
              const uniqueDoctorants = doctorants.filter((d: any) => !existingIds.has(d.id));
              
              this.users = [...profs, ...uniqueDoctorants];
              this.filterUsers();
            }
          });
        } else {
          this.users = [];
        }
      },
      error: (err) => console.error('Erreur chargement utilisateurs:', err)
    });
  }

  filterUsers() {
    if (!this.users.length) return;

    if (!this.searchUserQuery) {
      this.flatFilteredUsers = this.users.slice(0, 50); // Just show top 50
      return;
    }

    const q = this.searchUserQuery.toLowerCase();
    this.flatFilteredUsers = this.users.filter(u => 
      (u.nom && u.nom.toLowerCase().includes(q)) ||
      (u.prenom && u.prenom.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 50);
  }

  selectUser(user: any) {
    this.newMsgForm.receiver_id = user.id;
    
    let displayName = '';
    if (user.nom || user.prenom) {
      displayName = `${user.nom || ''} ${user.prenom || ''}`.trim();
    } else {
      displayName = user.email || 'Utilisateur non spécifié';
    }
    
    this.searchUserQuery = displayName;
    this.hideUserDropdown();
  }

  hideUserDropdown() {
    // Small timeout to allow mousedown on the dropdown option to fire before it disappears
    setTimeout(() => {
      this.showUserDropdown = false;
    }, 150);
  }

  loadConversations() {
    this.isLoadingConversations = true;
    this.http.get<any>(`${this.apiUrl}/messages/conversations?role_context=directeur`, {
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

  // A simple ngModelChange equivalent check could be implemented, but simple getter works too if hooked correctly
  ngDoCheck() {
    if (this.searchQuery !== this.lastSearchQuery) {
      this.lastSearchQuery = this.searchQuery;
      this.filterConversations();
    }
  }
  private lastSearchQuery = '';

  setFilterTab(tab: 'all' | 'sent' | 'received') {
    this.filterTab = tab;
    this.filterConversations();
  }

  filterConversations() {
    let base = this.conversations;
    if (this.filterTab === 'sent') {
      base = base.filter(c => c.last_message_is_mine === true);
    } else if (this.filterTab === 'received') {
      base = base.filter(c => c.last_message_is_mine === false);
    }

    if (!this.searchQuery) {
      this.filteredConversations = base;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredConversations = base.filter(c => 
      c.titre?.toLowerCase().includes(q) || 
      c.last_message?.toLowerCase().includes(q)
    );
  }

  selectConversation(conv: any) {
    this.selectedConversation = conv;
    this.loadMessages();
    // Mark as read locally
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

  confirmDeleteConversation() {
    if (!this.selectedConversation) return;
    this.showDeleteConfirm = true;
  }

  executeDelete() {
    if (!this.selectedConversation) return;
    this.isDeleting = true;
    
    this.http.delete(`${this.apiUrl}/messages/conversations/${this.selectedConversation.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: () => {
        this.selectedConversation = null;
        this.showDeleteConfirm = false;
        this.isDeleting = false;
        this.loadConversations();
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.isDeleting = false;
        // fallback in case of error
        this.showDeleteConfirm = false;
      }
    });
  }

  // --- Reply Handling ---

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
      formData.append('contenu', 'Pièce jointe'); // fallback if only file
    }
    if (this.selectedFile) {
      formData.append('piece_jointe', this.selectedFile);
    }

    this.http.post<any>(`${this.apiUrl}/messages/send?role_context=directeur`, formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.newMessageContent = '';
        this.removeFile();
        this.loadMessages();
        this.loadConversations(); // Update last message in sidebar
      },
      error: (err) => {
        console.error('Erreur envoi message:', err);
        alert('Erreur lors de l\'envoi du message.');
      }
    });
  }

  // --- New Message / Broadcast Modal ---
  
  openNewMessageModal() {
    this.showNewMessageModal = true;
  }

  executeDeleteSingle(msgId: number) {
    if (this.isDeletingSingle) return;
    this.isDeletingSingle = true;

    this.http.delete(`${this.apiUrl}/messages/single/${msgId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== msgId);
        this.isDeletingSingle = false;
        this.messageToDelete = null;
        this.loadConversations(); // Update side list (last message might have changed)
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du message', err);
        alert('Erreur: ' + (err.error?.message || 'Vous ne pouvez supprimer que vos propres messages.'));
        this.isDeletingSingle = false;
        this.messageToDelete = null;
      }
    });
  }

  closeNewMessageModal() {
    this.showNewMessageModal = false;
    this.newMsgForm = { mode: 'lab_professeurs', titre: '', contenu: '', receiver_id: null, file: null };
  }

  onNewMsgFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.newMsgForm.file = event.target.files[0];
    }
  }

  sendNewMessage() {
    if (!this.newMsgForm.titre.trim() || !this.newMsgForm.contenu.trim()) {
      alert("Veuillez remplir le titre et le contenu.");
      return;
    }

    if (this.newMsgForm.mode === 'individual' && !this.newMsgForm.receiver_id) {
      alert("Veuillez spécifier l'ID du destinataire.");
      return;
    }

    this.isSending = true;
    const formData = new FormData();
    formData.append('titre', this.newMsgForm.titre);
    formData.append('contenu', this.newMsgForm.contenu);
    
    if (this.newMsgForm.file) {
      formData.append('piece_jointe', this.newMsgForm.file);
    }

    // Individual vs Broadcast
    if (this.newMsgForm.mode === 'individual') {
      formData.append('receiver_id', this.newMsgForm.receiver_id!.toString());
      
      this.http.post<any>(`${this.apiUrl}/messages/send?role_context=directeur`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
      }).subscribe({
        next: (res) => {
          this.isSending = false;
          this.closeNewMessageModal();
          this.loadConversations();
        },
        error: (err) => {
          this.isSending = false;
          console.error(err);
          alert('Erreur: ' + (err.error?.message || 'Erreur inconnue'));
        }
      });

    } else {
      formData.append('cible', this.newMsgForm.mode);
      
      this.http.post<any>(`${this.apiUrl}/messages/broadcast?role_context=directeur`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
      }).subscribe({
        next: (res) => {
          this.isSending = false;
          alert(res.message || 'Messages envoyés avec succès.');
          this.closeNewMessageModal();
          this.loadConversations();
        },
        error: (err) => {
          this.isSending = false;
          console.error(err);
          alert('Erreur: ' + (err.error?.message || 'Erreur inconnue'));
        }
      });
    }
  }

  // --- Utilities ---
  
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

  isImage(path: string): boolean {
    if (!path) return false;
    const ext = path.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  getFileName(path: string): string {
    if (!path) return 'Document';
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Document';
  }
}
