import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-professeur-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './professeur-stats.component.html',
  styleUrls: []
})
export class ProfesseurStatsComponent implements OnInit, AfterViewInit {
  isLoading = true;
  stats: any = null;

  totalAdmis = 0;
  totalCandidaturesStatus = 0;

  // Detailed Data
  recentActivity: any[] = [];
  topSubjects: any[] = [];
  
  Math = Math;

  mesDoctorants: any[] = [];
  candidaturesEnAttente: number = 0;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // wait for data to load
  }

  loadAllData() {
    this.isLoading = true;
    this.api.getDashboardStats('global', 'professeur').subscribe({
      next: (data: any) => {
        if (data.success || data.status === 'success') {
          this.stats = data.data || data;

          this.totalAdmis = (this.stats.charts?.status?.accepte || 0) + (this.stats.charts?.status?.admis || 0);
          this.totalCandidaturesStatus = 
            (this.stats.charts?.status?.en_attente || 0) + 
            (this.stats.charts?.status?.accepte || 0) + 
            (this.stats.charts?.status?.admis || 0) + 
            (this.stats.charts?.status?.refuse || 0);

          this.topSubjects = this.stats.tables?.top_sujets || [];
          this.recentActivity = this.stats.tables?.recent_activity || [];
          this.mesDoctorants = this.stats.tables?.mes_doctorants || [];
          this.candidaturesEnAttente = this.stats.kpis?.candidatures_en_attente || 0;
          
          setTimeout(() => this.renderCharts(), 100);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading professeur stats', err);
        this.isLoading = false;
      }
    });
  }

  renderCharts() {
    if (!this.stats || !this.stats.charts) return;
    if (!(window as any).Chart) return;
    const Chart = (window as any).Chart;

    if ((window as any).profOverviewChartInstance) (window as any).profOverviewChartInstance.destroy();
    if ((window as any).profStatusDonutChartInstance) (window as any).profStatusDonutChartInstance.destroy();

    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }

    const candidaturesTimeRaw = this.stats.charts?.candidatures_time || [];
    const sujetsMap = new Map<string, Map<string, number>>();
    
    candidaturesTimeRaw.forEach((item: any) => {
      if (!sujetsMap.has(item.sujet)) {
        sujetsMap.set(item.sujet, new Map<string, number>());
      }
      sujetsMap.get(item.sujet)!.set(item.mois, item.total);
    });

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
    const datasets: any[] = [];
    
    let colorIndex = 0;
    sujetsMap.forEach((monthMap, sujet) => {
      const data = last6Months.map(mois => monthMap.get(mois) || 0);
      const color = colors[colorIndex % colors.length];
      
      datasets.push({
        label: sujet.length > 25 ? sujet.substring(0, 25) + '...' : sujet,
        data: data,
        borderColor: color,
        backgroundColor: color + '20', // transparent
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: color,
        pointRadius: 4
      });
      colorIndex++;
    });

    if (datasets.length === 0) {
      datasets.push({
        label: 'Aucune candidature',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#f59e0b',
        borderWidth: 2
      });
    }

    // 1. Overview Chart (Evolution)
    const ctxOverview = document.getElementById('overviewChart') as HTMLCanvasElement;
    if (ctxOverview) {
      (window as any).profOverviewChartInstance = new Chart(ctxOverview, {
        type: 'line',
        data: {
          labels: last6Months,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } },
          scales: { 
             x: { grid: { display: false } },
             y: { beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' }, ticks: { stepSize: 1 } } 
          }
        }
      });
    }

    // 1.b Subjects Bar Chart
    const subjectLabels = this.topSubjects.map(s => s.titre.length > 25 ? s.titre.substring(0, 25) + '...' : s.titre);
    const subjectData = this.topSubjects.map(s => s.total);

    const ctxSubjects = document.getElementById('subjectsChart') as HTMLCanvasElement;
    if (ctxSubjects) {
      if ((window as any).profSubjectsChartInstance) (window as any).profSubjectsChartInstance.destroy();
      (window as any).profSubjectsChartInstance = new Chart(ctxSubjects, {
        type: 'bar',
        data: {
          labels: subjectLabels.length > 0 ? subjectLabels : ['Aucun sujet'],
          datasets: [
            {
              label: 'Candidatures',
              data: subjectData.length > 0 ? subjectData : [0],
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              barThickness: 30
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { 
             x: { grid: { display: false }, ticks: { font: { size: 10 } } },
             y: { beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' }, ticks: { stepSize: 1 } } 
          }
        }
      });
    }

    // 2. Status Donut Chart
    const ctxStatus = document.getElementById('statusDonutChart') as HTMLCanvasElement;
    if (ctxStatus && this.totalCandidaturesStatus > 0) {
      (window as any).profStatusDonutChartInstance = new Chart(ctxStatus, {
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
  }
}
