import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-directeur-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './directeur-layout.component.html'
})
export class DirecteurLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  user: any = null;
  isSidebarCollapsed = false;
  unreadMessagesCount: number = 0;
  private unreadInterval: any;
  private apiUrl = 'http://localhost:8000/api';
  storageUrl = 'http://localhost:8000/storage';

  ngOnInit() {
    this.loadUser();

    // Listen for profile updates
    window.addEventListener('profileUpdated', () => {
      this.loadUser();
    });

    this.checkUnreadMessages();
    this.loadNotifications();
    this.unreadInterval = setInterval(() => {
      this.checkUnreadMessages();
      this.loadNotifications();
    }, 15000);
  }

  loadUser() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user.role !== 'directeur') {
        if (this.user.role === 'professeur') this.router.navigate(['/professeur/dashboard']);
        else if (this.user.role === 'admin') this.router.navigate(['/admin/dashboard']);
        else if (this.user.role === 'candidat' || this.user.role === 'doctorant') this.router.navigate(['/candidat/mes-candidatures']);
        else this.router.navigate(['/login']);
        return;
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.unreadInterval) {
      clearInterval(this.unreadInterval);
    }
    window.removeEventListener('profileUpdated', () => this.loadUser());
  }

  checkUnreadMessages(): void {
    const token = localStorage.getItem('esto_token');
    if (!token) return;
    this.http.get<any>(`${this.apiUrl}/messages/unread?role_context=directeur`, {
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

  // Notifications Logic
  isNotificationsOpen = false;
  notifications: any[] = [];
  unreadNotificationsCount = 0;

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

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }

  switchToProfesseur() {
    this.router.navigate(['/professeur/dashboard']);
  }
}
