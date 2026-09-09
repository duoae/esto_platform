import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeur-stats',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './directeur-stats.component.html'
})
export class DirecteurStatsComponent implements OnInit {
  private apiService = inject(ApiService);

  stats: any = null;
  isLoading = true;
  errorMessage = '';

  // Processed Data
  totalCandidaturesStatus = 0;
  statusPercentages: any = {};
  totalAdmis = 0;

  // Analytics
  topProfessors: any[] = [];
  professorsWithoutSubjects = 0;
  topSubjects: any[] = [];
  subjectsWithoutRequests = 0;

  // Detailed Data
  inscriptions: any[] = [];
  recentActivity: any[] = [];
  diplomes: any = {};
  doctorantsPerProf: any[] = [];
  
  Math = Math;

  // New for charts
  maxInscriptions = 1;

  ngOnInit() {
    this.loadAllData();
  }

  getMax(arr: any[], key: string = 'count'): number {
     if (!arr || arr.length === 0) return 1;
     const max = Math.max(...arr.map(item => Number(item[key]) || 0));
     return max > 0 ? max : 1;
  }

  loadAllData() {
    this.isLoading = true;
    
    this.apiService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res.data || res;
        
        if (this.stats && this.stats.role === 'directeur') {

          // Process Statuses
          const statusData = this.stats.charts?.status || {};
          this.totalAdmis = statusData['admis'] || 0;
          this.totalCandidaturesStatus = Object.values(statusData).reduce((a: any, b: any) => a + b, 0) as number;
          this.statusPercentages = {
            en_attente: this.calcPercent(statusData['en_attente'] || 0, this.totalCandidaturesStatus),
            accepte: this.calcPercent(statusData['accepte'] || 0, this.totalCandidaturesStatus),
            refuse: this.calcPercent(statusData['refuse'] || 0, this.totalCandidaturesStatus),
            admis: this.calcPercent(statusData['admis'] || 0, this.totalCandidaturesStatus),
          };

          // Extra details
          this.diplomes = this.stats.charts?.diplomes || {};
          this.recentActivity = this.stats.tables?.recent_activity || [];

          // Process Analytics
          this.topProfessors = this.stats.tables?.top_professors || [];
          this.professorsWithoutSubjects = this.stats.alertes?.professeurs_inactifs || 0;
          this.topSubjects = this.stats.charts?.sujets || [];
          this.subjectsWithoutRequests = this.stats.alertes?.sujets_sans_candidats || 0;
          this.doctorantsPerProf = this.stats.charts?.doctorants_per_prof || [];
          
          this.inscriptions = this.stats.charts?.candidatures_time || [];
          setTimeout(() => this.renderCharts(), 100);
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur stats', err);
        this.errorMessage = "Impossible de charger les statistiques.";
        this.isLoading = false;
      }
    });
  }

  calcPercent(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  renderCharts() {
    if (!(window as any).Chart) return;
    const Chart = (window as any).Chart;

    if ((window as any).directeurOverviewChartInstance) (window as any).directeurOverviewChartInstance.destroy();
    if ((window as any).directeurStatusDonutChartInstance) (window as any).directeurStatusDonutChartInstance.destroy();
    if ((window as any).directeurDoctorantsChartInstance) (window as any).directeurDoctorantsChartInstance.destroy();

    // Générer les 6 derniers mois pour avoir un axe X fixe (Format YYYY-MM)
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7); // "YYYY-MM"
      last6Months.push(monthStr);
    }

    const getDataForMonth = (arr: any[], month: string) => {
       if (!arr) return 0;
       const found = arr.find(item => item.mois === month);
       return found ? found.total : 0;
    };

    // 1. Overview Chart (Combo Bar/Line Chart)
    const ctxOverview = document.getElementById('overviewChart') as HTMLCanvasElement;
    if (ctxOverview) {
      const labels = last6Months;
      const candidaturesData = labels.map(m => getDataForMonth(this.stats.charts?.candidatures_time, m));
      const messagesData = labels.map(m => getDataForMonth(this.stats.charts?.messages_time, m));
      const sujetsData = labels.map(m => getDataForMonth(this.stats.charts?.sujets_time, m));

      (window as any).directeurOverviewChartInstance = new Chart(ctxOverview, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'line',
              label: 'Candidatures reçues',
              data: candidaturesData,
              borderColor: '#f97316', // orange-500
              backgroundColor: '#f97316',
              borderWidth: 2,
              pointBackgroundColor: '#f97316',
              pointRadius: 4,
              fill: false,
              tension: 0.3
            },
            {
              type: 'bar',
              label: 'Messages envoyés',
              data: messagesData,
              backgroundColor: '#0ea5e9', // sky-500
              maxBarThickness: 40
            },
            {
              type: 'bar',
              label: 'Sujets proposés',
              data: sujetsData,
              backgroundColor: '#10b981', // emerald-500
              maxBarThickness: 40,
              borderRadius: { topLeft: 4, topRight: 4 }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } },
          scales: { 
             x: { stacked: true, grid: { display: false } },
             y: { stacked: true, beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' } } 
          }
        }
      });
    }

    // 2. Status Donut Chart
    const ctxStatus = document.getElementById('statusDonutChart') as HTMLCanvasElement;
    if (ctxStatus && this.totalCandidaturesStatus > 0) {
      (window as any).directeurStatusDonutChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'Acceptés', 'Admis', 'Refusés'],
          datasets: [{
            data: [
              this.stats.charts?.status?.en_attente || 0, 
              this.stats.charts?.status?.accepte || 0, 
              this.stats.charts?.status?.admis || 0, 
              this.stats.charts?.status?.refuse || 0
            ],
            backgroundColor: ['#fbbf24', '#10b981', '#3b82f6', '#f43f5e'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: { 
             legend: { display: true, position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, padding: 15 } }
          }
        }
      });
    }

    // 3. Doctorants per Prof Donut Chart
    const ctxDoctorants = document.getElementById('doctorantsDonutChart') as HTMLCanvasElement;
    if (ctxDoctorants && this.doctorantsPerProf.length > 0) {
      const labels = this.doctorantsPerProf.map(d => `${d.nom} ${d.prenom}`);
      const data = this.doctorantsPerProf.map(d => d.doctorants);
      const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
      
      (window as any).directeurDoctorantsChartInstance = new Chart(ctxDoctorants, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: { 
             legend: { display: true, position: 'right', labels: { boxWidth: 10, usePointStyle: true, padding: 15 } }
          }
        }
      });
    }
  }
}
