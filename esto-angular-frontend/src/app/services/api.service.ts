import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api';

  getLabs(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/labs`);
  }

  getLab(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/labs/${id}`);
  }

  createLab(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/labs`, data);
  }

  updateLab(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/labs/${id}`, data);
  }

  deleteLab(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/labs/${id}`);
  }

  getSubjects(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/subjects`);
  }

  getPublicStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/public-stats`);
  }

  getDashboardStats(timeframe: string = 'global', context?: string): Observable<any> {
    let url = `${this.baseUrl}/dashboard-stats?timeframe=${timeframe}`;
    if (context) url += `&context=${context}`;
    return this.http.get<any>(url);
  }

  // User Management
  getUsersByRole(role: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users?role=${role}`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`);
  }

  getLabMembers(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/labs/${id}/members`);
  }

  // Notifications
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/notifications`);
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notifications/${id}/read`, {});
  }
}
