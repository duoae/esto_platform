import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  isLoading = true;
  totalAdmis = 0;
  
  // Time series
  inscriptions: any[] = [];
  candidaturesTime: any[] = [];
  messagesTime: any[] = [];
  chatbotTime: any[] = [];

  statusCounts = { en_attente: 0, accepte: 0, admis: 0, refuse: 0 };
  statusPercentages = { en_attente: 0, accepte: 0, admis: 0, refuse: 0 };
  totalCandidaturesStatus = 0;
  diplomes: any = {};
  laboratoires: any[] = [];
  topProfessors: any[] = [];
  recentActivity: any[] = [];
  professorsWithoutSubjects = 0;
  subjectsWithoutRequests = 0;
  objectKeys = Object.keys;

  // KPIs
  totalMessages = 0;
  totalConversations = 0;
  totalChatbot = 0;

  maxInscriptions = 1;
  maxMessages = 1;
  maxChatbot = 1;

  constructor(private apiService: ApiService) {}

  getMax(arr: any[], key: string = 'total'): number {
     if (!arr || arr.length === 0) return 1;
     const max = Math.max(...arr.map(item => Number(item[key]) || 0));
     return max > 0 ? max : 1;
  }

  ngOnInit() {
    this.apiService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res.data || res;
        this.isLoading = false;
        
        // Populate variables based on API response
        if (this.stats) {
           this.totalAdmis = this.stats.kpis?.candidats_admis || 0;
           
           // Time series
           this.inscriptions = this.stats.charts?.inscriptions_time || [];
           this.candidaturesTime = this.stats.charts?.candidatures_time || [];
           this.messagesTime = this.stats.charts?.messages_time || [];
           this.chatbotTime = this.stats.charts?.chatbot_time || [];

           // New KPIs
           this.totalMessages = this.stats.kpis?.messages || 0;
           this.totalConversations = this.stats.kpis?.conversations || 0;
           this.totalChatbot = this.stats.kpis?.chatbot_requests || 0;

           this.maxInscriptions = this.getMax(this.inscriptions);
           this.maxMessages = this.getMax(this.messagesTime);
           this.maxChatbot = this.getMax(this.chatbotTime);
           
           if (this.stats.charts?.status) {
              const st = this.stats.charts.status;
              this.statusCounts = {
                 en_attente: st.en_attente || 0,
                 accepte: st.accepte || 0,
                 admis: st.admis || 0,
                 refuse: st.refuse || 0
              };
              this.totalCandidaturesStatus = this.statusCounts.en_attente + this.statusCounts.accepte + this.statusCounts.admis + this.statusCounts.refuse;
              
              if (this.totalCandidaturesStatus > 0) {
                 this.statusPercentages = {
                    en_attente: Math.round((this.statusCounts.en_attente / this.totalCandidaturesStatus) * 100),
                    accepte: Math.round((this.statusCounts.accepte / this.totalCandidaturesStatus) * 100),
                    admis: Math.round((this.statusCounts.admis / this.totalCandidaturesStatus) * 100),
                    refuse: Math.round((this.statusCounts.refuse / this.totalCandidaturesStatus) * 100)
                 };
              } else {
                this.statusCounts = { en_attente: 0, accepte: 0, admis: 0, refuse: 0 };
                this.statusPercentages = { en_attente: 0, accepte: 0, admis: 0, refuse: 0 };
              }
           }
           
           this.diplomes = this.stats.charts?.diplomes || {};
           this.laboratoires = this.stats.tables?.laboratoires || [];
           this.topProfessors = this.stats.tables?.top_professors || [];
           this.recentActivity = this.stats.tables?.recent_activity || [];
           
           this.professorsWithoutSubjects = this.stats.kpis?.professeurs_inactifs || 0;
           this.subjectsWithoutRequests = this.stats.kpis?.sujets_morts || 0;
           
           setTimeout(() => this.renderCharts(), 100);
        }
      },
      error: (err) => {
        console.error('Error fetching stats', err);
        this.isLoading = false;
      }
    });
  }

  calcPercent(val: number, max: number) {
     if (!max) return 0;
     return (val / max) * 100;
  }
  
  renderCharts() {
    if (!(window as any).Chart) return;
    const Chart = (window as any).Chart;

    if ((window as any).overviewChartInstance) (window as any).overviewChartInstance.destroy();
    if ((window as any).statusDonutChartInstance) (window as any).statusDonutChartInstance.destroy();
    if ((window as any).chatbotAreaChartInstance) (window as any).chatbotAreaChartInstance.destroy();

    // Générer les 6 derniers mois pour avoir un axe X fixe
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7); // "YYYY-MM"
      last6Months.push(monthStr);
    }
    
    const labels = last6Months; // On force 6 mois
    
    // Fonction pour trouver la donnée d'un mois spécifique, sinon 0
    const getDataForMonth = (arr: any[], month: string, role?: string) => {
       const found = arr.find(item => item.mois === month);
       if (!found) return 0;
       if (role && found.roles) return found.roles[role] || 0;
       return found.total || 0;
    };

    // 1. Overview Chart (Combo Bar/Line)
    const ctxOverview = document.getElementById('overviewChart') as HTMLCanvasElement;
    if (ctxOverview) {
      // Preparer les datasets pour les 6 mois
      const inscriptionsData = labels.map(m => getDataForMonth(this.inscriptions, m));
      const candidatData = labels.map(m => getDataForMonth(this.messagesTime, m, 'candidat'));
      const doctorantData = labels.map(m => getDataForMonth(this.messagesTime, m, 'doctorant'));
      const profData = labels.map(m => getDataForMonth(this.messagesTime, m, 'professeur'));
      const directeurData = labels.map(m => getDataForMonth(this.messagesTime, m, 'directeur'));

      (window as any).overviewChartInstance = new Chart(ctxOverview, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'line',
              label: 'Inscrits',
              data: inscriptionsData,
              borderColor: '#f97316', // orange-500
              backgroundColor: '#f97316',
              borderWidth: 2,
              tension: 0.4,
              fill: false
            },
            {
              type: 'bar',
              label: 'Msgs: Candidats',
              data: candidatData,
              backgroundColor: '#0ea5e9', // sky-500
              maxBarThickness: 40
            },
            {
              type: 'bar',
              label: 'Msgs: Doctorants',
              data: doctorantData,
              backgroundColor: '#f59e0b', // amber-500
              maxBarThickness: 40
            },
            {
              type: 'bar',
              label: 'Msgs: Professeurs',
              data: profData,
              backgroundColor: '#10b981', // emerald-500
              maxBarThickness: 40
            },
            {
              type: 'bar',
              label: 'Msgs: Directeurs',
              data: directeurData,
              backgroundColor: '#8b5cf6', // violet-500
              borderRadius: { topLeft: 4, topRight: 4 }, // Only top rounded
              maxBarThickness: 40
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
      (window as any).statusDonutChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'Acceptés', 'Admis', 'Refusés'],
          datasets: [{
            data: [
              this.statusCounts.en_attente, 
              this.statusCounts.accepte, 
              this.statusCounts.admis, 
              this.statusCounts.refuse
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

    // 3. Chatbot Area Chart
    const ctxChatbot = document.getElementById('chatbotAreaChart') as HTMLCanvasElement;
    if (ctxChatbot) {
      const chatbotData = labels.map(m => getDataForMonth(this.chatbotTime, m));
      
      (window as any).chatbotAreaChartInstance = new Chart(ctxChatbot, {
        type: 'line',
        data: {
          labels: labels, // Utiliser les mêmes 6 mois
          datasets: [{
            label: 'Requêtes I.A',
            data: chatbotData,
            borderColor: '#f97316', // orange-500
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#f97316',
            pointRadius: 3,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { 
             x: { grid: { display: false } },
             y: { beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' } } 
          }
        }
      });
    }
  }
}
