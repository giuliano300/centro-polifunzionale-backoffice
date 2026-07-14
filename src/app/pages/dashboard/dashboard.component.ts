import { Component } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';
import { DashboardService, DashboardStats } from '../../services/Dashboard.service';

interface KpiCard {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'slate';
  link: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [NgIf, NgFor, NgClass, RouterLink, MatButtonModule, MatCardModule, FeathericonsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  stats: DashboardStats | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        if (error?.status === 401) {
          this.errorMessage = 'Sessione scaduta: effettua di nuovo il login.';
        } else if (error?.status === 403) {
          this.errorMessage = 'Statistiche disponibili solo per admin e gestori.';
        } else {
          this.errorMessage = 'Statistiche non disponibili: verifica che le API siano avviate.';
        }
        this.isLoading = false;
      }
    });
  }

  get kpis(): KpiCard[] {
    if (!this.stats) {
      return [];
    }

    return [
      {
        label: 'Prenotazioni oggi',
        value: this.formatNumber(this.stats.period.todayBookings),
        detail: `${this.formatNumber(this.stats.period.monthBookings)} nel mese`,
        icon: 'calendar',
        tone: 'blue',
        link: '/bookings'
      },
      {
        label: 'Incassi mese',
        value: this.formatCurrency(this.stats.period.monthRevenue),
        detail: `${this.formatCurrency(this.stats.period.paidRevenue)} incassati totali`,
        icon: 'credit-card',
        tone: 'green',
        link: '/payments'
      },
      {
        label: 'Corsi attivi',
        value: this.formatNumber(this.stats.totals.publishedCourses),
        detail: `${this.formatNumber(this.stats.period.monthCourses)} nuovi nel mese`,
        icon: 'book-open',
        tone: 'violet',
        link: '/courses'
      },
      {
        label: 'Clienti',
        value: this.formatNumber(this.stats.totals.clients),
        detail: `${this.formatNumber(this.stats.totals.activeUsers)} utenti attivi`,
        icon: 'users',
        tone: 'orange',
        link: '/users'
      },
      {
        label: 'Spazi disponibili',
        value: `${this.formatNumber(this.stats.totals.availableSpaces)}/${this.formatNumber(this.stats.totals.spaces)}`,
        detail: 'sale e postazioni configurate',
        icon: 'home',
        tone: 'slate',
        link: '/spaces'
      },
      {
        label: 'Pagamenti pendenti',
        value: this.formatCurrency(this.stats.period.pendingPayments),
        detail: `${this.formatNumber(this.pendingPaymentsCount)} movimenti da chiudere`,
        icon: 'alert-circle',
        tone: 'red',
        link: '/payments'
      }
    ];
  }

  get pendingPaymentsCount(): number {
    return this.stats?.breakdowns.paymentsByStatus.find((item) => item.status === 'PENDING')?.count || 0;
  }

  get maxSpaceUsage(): number {
    const usage = this.stats?.breakdowns.spaceUsage || [];
    return usage.reduce((max, item) => Math.max(max, item.bookings), 1);
  }

  get bookingStatusItems() {
    return this.stats?.breakdowns.bookingsByStatus || [];
  }

  get paymentStatusItems() {
    return this.stats?.breakdowns.paymentsByStatus || [];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('it-IT').format(value || 0);
  }

  formatDate(value?: string | Date): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString('it-IT');
  }

  formatDateTime(value?: string | Date): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUserName(item: any): string {
    return item?.name || item?.user?.name || '-';
  }

  getBookingUser(item: any): string {
    return item?.user?.name || '-';
  }

  getBookingSpace(item: any): string {
    return item?.space?.name || '-';
  }

  getCourseSpace(item: any): string {
    const booking = typeof item?.booking === 'string' ? null : item?.booking;
    return booking?.space?.name || '-';
  }

  getCourseManager(item: any): string {
    const booking = typeof item?.booking === 'string' ? null : item?.booking;
    return booking?.user?.name || '-';
  }

  getCourseBookingUser(item: any): string {
    return typeof item?.user === 'string' ? '-' : item?.user?.name || '-';
  }

  getCourseBookingTitle(item: any): string {
    return typeof item?.course === 'string' ? '-' : item?.course?.title || '-';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      confirmed: 'Confermate',
      cancelled: 'Annullate',
      PENDING: 'Da pagare',
      PAID: 'Pagati',
      FAILED: 'Falliti',
      FREE: 'Gratuiti'
    };

    return labels[status] || status || '-';
  }

  getPercent(value: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }
}
