import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSettingsService } from '../../../services/admin-settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-admin-chatbot-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-chatbot-logs.component.html'
})
export class AdminChatbotLogsComponent implements OnInit, OnDestroy {
  logs: any[] = [];
  stats: any = null;
  isLoading = false;
  pagination: any = {};
  currentPage = 1;
  searchQuery = '';
  selectedPeriod = '';
  searchSubject = new Subject<string>();
  refreshInterval: any;

  constructor(private settingsService: AdminSettingsService) {
    this.searchSubject.pipe(debounceTime(300)).subscribe(query => {
      this.currentPage = 1;
      this.loadLogs();
    });
  }

  ngOnInit(): void {
    this.loadLogs();
    
    // Auto-actualisation toutes les 10 secondes
    this.refreshInterval = setInterval(() => {
      // Only auto-refresh if we are on page 1 and no search query
      if (this.currentPage === 1 && !this.searchQuery && !this.selectedPeriod) {
         this.loadLogsSilent();
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  onPeriodChange() {
    this.currentPage = 1;
    this.loadLogs();
  }

  loadLogs(page: number = this.currentPage) {
    this.isLoading = true;
    this.settingsService.getChatbotLogs(page, this.searchQuery, this.selectedPeriod).subscribe({
      next: (res: any) => {
        this.logs = res.data;
        this.stats = res.stats;
        this.pagination = res;
        this.currentPage = res.current_page;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
      }
    });
  }

  // Same as loadLogs but without setting isLoading to true (prevents blinking UI)
  loadLogsSilent(page: number = this.currentPage) {
    this.settingsService.getChatbotLogs(page, this.searchQuery, this.selectedPeriod).subscribe({
      next: (res: any) => {
        this.logs = res.data;
        this.stats = res.stats;
        this.pagination = res;
        this.currentPage = res.current_page;
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.currentPage = page;
      this.loadLogs(page);
    }
  }
}
