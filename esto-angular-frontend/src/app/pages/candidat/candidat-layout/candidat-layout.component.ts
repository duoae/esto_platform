import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-candidat-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidat-layout.component.html'
})
export class CandidatLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  isSidebarCollapsed = false;
  user: any = null;
  isAdmis = false;

  unreadMessagesCount: number = 0;
  private unreadInterval: any;
  private apiUrl = 'http://localhost:8000/api';

  // Notifications Logic
  isNotificationsOpen = false;
  notifications: any[] = [];
  unreadNotificationsCount = 0;

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user.role !== 'candidat' && this.user.role !== 'doctorant') {
        if (this.user.role === 'professeur') this.router.navigate(['/professeur/dashboard']);
        else if (this.user.role === 'directeur') this.router.navigate(['/directeur/dashboard']);
        else if (this.user.role === 'admin') this.router.navigate(['/admin/dashboard']);
        else this.router.navigate(['/login']);
        return;
      }
    } else {
      this.router.navigate(['/login']);
      return;
    }
    this.checkAdmissionStatus();
    
    // Listen for profile updates
    window.addEventListener('profileUpdated', this.onProfileUpdate);

    this.checkUnreadMessages();
    this.loadNotifications();
    this.unreadInterval = setInterval(() => {
      this.checkUnreadMessages();
      this.loadNotifications();
    }, 15000);
  }

  onProfileUpdate = () => {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  };

  ngOnDestroy(): void {
    if (this.unreadInterval) {
      clearInterval(this.unreadInterval);
    }
    window.removeEventListener('profileUpdated', this.onProfileUpdate);
  }

  checkUnreadMessages(): void {
    const token = localStorage.getItem('esto_token');
    if (!token) return;
    this.http.get<any>(`${this.apiUrl}/messages/unread`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.unreadMessagesCount = res.unread_count;
        }
      },
      error: (err) => console.error('Erreur chargement messages non lus', err)
    });
  }

  loadNotifications(): void {
    const token = localStorage.getItem('esto_token');
    if (!token) return;
    this.http.get<any>(`${this.apiUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications = res.data;
          this.unreadNotificationsCount = this.notifications.filter(n => !n.lu).length;
        }
      },
      error: (err) => console.error('Erreur chargement notifications', err)
    });
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  markNotificationAsRead(id: number): void {
    const notif = this.notifications.find(n => n.id === id);
    if (!notif) return;

    const navigate = () => {
      this.isNotificationsOpen = false;
      if (notif.lien) {
        this.router.navigateByUrl(notif.lien);
      }
    };

    if (notif.lu) {
      navigate();
      return;
    }

    const token = localStorage.getItem('esto_token');
    if (!token) {
      navigate();
      return;
    }

    this.http.put<any>(`${this.apiUrl}/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          notif.lu = 1;
          this.unreadNotificationsCount = this.notifications.filter(n => !n.lu).length;
        }
        navigate();
      },
      error: (err) => {
        console.error('Erreur marquer lu', err);
        navigate();
      }
    });
  }

  checkAdmissionStatus() {
    this.http.get<any>('http://localhost:8000/api/candidat/mes-choix', {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        const choices = response.data || [];
        this.isAdmis = choices.some((c: any) => c.statut_choix === 'admis');
      },
      error: (err) => console.error('Error checking admission status', err)
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}
