import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './directeur-dashboard.component.html'
})
export class DirecteurDashboardComponent implements OnInit {
  stats: any = {};
  isLoading = true;
  user: any = null;
  lab: any = null;
  
  candidaturesTime: any[] = [];
  statusCounts = { en_attente: 0, accepte: 0, admis: 0, refuse: 0 };
  totalCandidaturesStatus = 0;
  topProfessors: any[] = [];
  recentActivity: any[] = [];
  maxCandidatures = 1;

  constructor(private apiService: ApiService) {}

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  getStatusName(status: string): string {
    const map: any = { 'en_attente': 'En attente', 'accepte': 'Accepté', 'refuse': 'Refusé', 'admis': 'Admis' };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'en_attente') return 'bg-yellow-100 text-yellow-800';
    if (status === 'accepte' || status === 'admis') return 'bg-green-100 text-green-800';
    if (status === 'refuse') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  getMax(arr: any[], key: string = 'total'): number {
     if (!arr || arr.length === 0) return 1;
     const max = Math.max(...arr.map(item => Number(item[key]) || 0));
     return max > 0 ? max : 1;
  }

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user.laboratoire_id) {
        this.loadLabDetails(this.user.laboratoire_id);
      }
    }
    this.loadStats();
  }

  loadLabDetails(id: number) {
    this.apiService.getLab(id).subscribe({
      next: (res: any) => {
        this.lab = res.data || res;
      },
      error: (err: any) => console.error('Error loading lab details', err)
    });
  }

  loadStats() {
    this.isLoading = true;
    this.apiService.getDashboardStats().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.stats = res.data;
          
          this.candidaturesTime = this.stats.charts?.candidatures_time || [];
          this.maxCandidatures = this.getMax(this.candidaturesTime);
          
          if (this.stats.charts?.status) {
              const st = this.stats.charts.status;
              this.statusCounts = {
                 en_attente: st.en_attente || 0,
                 accepte: st.accepte || 0,
                 admis: st.admis || 0,
                 refuse: st.refuse || 0
              };
              this.totalCandidaturesStatus = this.statusCounts.en_attente + this.statusCounts.accepte + this.statusCounts.admis + this.statusCounts.refuse;
          }
          
          this.topProfessors = this.stats.tables?.top_professors || [];
          this.recentActivity = this.stats.tables?.recent_activity || [];
          
          setTimeout(() => this.renderCharts(), 100);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading stats', err);
        this.isLoading = false;
      }
    });
  }

  renderCharts() {
    if (!(window as any).Chart) return;
    const Chart = (window as any).Chart;

    if ((window as any).dirOverviewChartInstance) (window as any).dirOverviewChartInstance.destroy();
    if ((window as any).dirStatusDonutChartInstance) (window as any).dirStatusDonutChartInstance.destroy();

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(d.toISOString().substring(0, 7));
    }
    const labels = last6Months;

    const getDataForMonth = (arr: any[], month: string) => {
       const found = arr.find(item => item.mois === month);
       return found ? (found.total || 0) : 0;
    };

    // 1. Overview Chart (Bar)
    const ctxOverview = document.getElementById('dirOverviewChart') as HTMLCanvasElement;
    if (ctxOverview) {
      const candidaturesData = labels.map(m => getDataForMonth(this.candidaturesTime, m));
      (window as any).dirOverviewChartInstance = new Chart(ctxOverview, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Candidatures Reçues',
              data: candidaturesData,
              backgroundColor: '#6366f1', // indigo-500
              maxBarThickness: 40,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
             legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, font: { size: 10 } } }
          },
          scales: {
             y: { beginAtZero: true, grid: { color: '#f3f4f6' }, border: { display: false }, ticks: { stepSize: 1, precision: 0 } },
             x: { grid: { display: false }, border: { display: false } }
          }
        }
      });
    }

    // 2. Status Donut
    const ctxDonut = document.getElementById('dirStatusDonutChart') as HTMLCanvasElement;
    if (ctxDonut) {
      (window as any).dirStatusDonutChartInstance = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'Accepté', 'Admis', 'Refusé'],
          datasets: [{
            data: [this.statusCounts.en_attente, this.statusCounts.accepte, this.statusCounts.admis, this.statusCounts.refuse],
            backgroundColor: ['#eab308', '#3b82f6', '#10b981', '#ef4444'], // yellow, blue, green, red
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: { display: true, position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } } }
          }
        }
      });
    }
  }
}
