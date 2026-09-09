import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = 'http://localhost:8000/api';

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        this.saveAuthData(response);
      })
    );
  }

  registerCandidat(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-candidat`, formData).pipe(
      tap((response: any) => {
        this.saveAuthData(response);
      })
    );
  }

  private saveAuthData(response: any) {
    const data = response.data || response;
    const token = data.access_token || data.token;
    if (token) {
      localStorage.setItem('esto_token', token);
      if (data.user) {
        localStorage.setItem('esto_user', JSON.stringify(data.user));
      }
    }
  }

  logout() {
    localStorage.removeItem('esto_token');
    localStorage.removeItem('esto_user');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('esto_token');
  }
}
