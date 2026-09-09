import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsService {
  private apiUrl = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  getParametres(): Observable<any> {
    return this.http.get(`${this.apiUrl}/parametres`);
  }

  updateParametres(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/parametres`, data);
  }

  getChatbotLogs(page: number = 1, search: string = '', period: string = ''): Observable<any> {
    let url = `${this.apiUrl}/chatbot-logs?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (period) {
      url += `&period=${encodeURIComponent(period)}`;
    }
    return this.http.get(url);
  }
}
