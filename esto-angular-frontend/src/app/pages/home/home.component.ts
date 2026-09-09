import { Component, OnInit, inject, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RouterLink } from '@angular/router';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatbotComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, AfterViewInit {
  private apiService = inject(ApiService);
  private el = inject(ElementRef);
  
  labs: any[] = [];
  subjects: any[] = [];
  stats: any = { laboratoires: 4, equipes: 13, doctorants: 180, professeurs: 40 }; // Default values
  isLoadingLabs = true;
  isLoadingSubjects = true;

  selectedLab: any = null;
  isLabModalOpen = false;

  selectedSubject: any = null;
  isSubjectModalOpen = false;

  ngOnInit(): void {
    this.apiService.getPublicStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Error fetching stats', err)
    });

    this.apiService.getLabs().subscribe({
      next: (res) => {
        const payload = res.data || res;
        this.labs = Array.isArray(payload) ? payload : (payload.data || []);
        this.isLoadingLabs = false;
        setTimeout(() => this.setupAnimations(), 50);
      },
      error: (err) => {
        console.error('Erreur de connexion au backend. Veuillez vérifier que Laravel est lancé.', err);
        this.isLoadingLabs = false;
      }
    });

    this.apiService.getSubjects().subscribe({
      next: (res) => {
        const payload = res.data || res;
        const allSubjects = Array.isArray(payload) ? payload : (payload.data || []);
        
        // Filtrer les sujets disponibles et trier par date de création (les plus récents d'abord)
        this.subjects = allSubjects
          .filter((s: any) => s.statut?.toLowerCase() === 'disponible' || s.status?.toLowerCase() === 'disponible')
          .sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // Décroissant
          });
          
        this.isLoadingSubjects = false;
        setTimeout(() => this.setupAnimations(), 50);
      },
      error: (err) => {
        console.error('Erreur de connexion au backend. Veuillez vérifier que Laravel est lancé.', err);
        this.isLoadingSubjects = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupAnimations();
  }

  setupAnimations(): void {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0', 'translate-x-0');
          entry.target.classList.remove(
            'opacity-0', 'translate-y-10', '-translate-y-10', 'translate-y-16', '-translate-y-16',
            '-translate-x-10', 'translate-x-10', '-translate-x-16', 'translate-x-16', 'scale-95'
          );
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const hiddenElements = this.el.nativeElement.querySelectorAll('.scroll-animate:not([data-observed])');
    hiddenElements.forEach((el: any) => {
      observer.observe(el);
      el.setAttribute('data-observed', 'true');
    });
  }

  openLabModal(lab: any): void {
    this.selectedLab = lab;
    this.isLabModalOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  closeLabModal(): void {
    this.isLabModalOpen = false;
    setTimeout(() => {
      this.selectedLab = null;
      document.body.style.overflow = '';
    }, 300); // Wait for transition
  }

  openSubjectModal(sujet: any): void {
    this.selectedSubject = sujet;
    this.isSubjectModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeSubjectModal(): void {
    this.isSubjectModalOpen = false;
    setTimeout(() => {
      this.selectedSubject = null;
      document.body.style.overflow = '';
    }, 300);
  }
}
