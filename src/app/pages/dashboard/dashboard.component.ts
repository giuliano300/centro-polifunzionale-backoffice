import { Component } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';
import {
  DashboardBooking,
  DashboardCourse,
  DashboardCourseBooking,
  DashboardService,
  DashboardStats,
  DashboardUser
} from '../../services/Dashboard.service';

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
  selectedDetailTitle = '';
  selectedDetailSubtitle = '';
  selectedDetailIcon = 'ri-information-line';
  selectedDetailRows: Array<{ label: string; value: string }> = [];
  selectedDetailLink = '';
  selectedDetailQueryParams: Record<string, string> | null = null;

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
        detail: `${this.formatCurrency(this.stats.period.paidRevenue)} incassati totali, escluso wallet`,
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
        label: 'Stanze disponibili',
        value: `${this.formatNumber(this.stats.totals.availableSpaces)}/${this.formatNumber(this.stats.totals.spaces)}`,
        detail: 'sale e postazioni configurate',
        icon: 'home',
        tone: 'slate',
        link: '/spaces'
      },
      {
        label: 'Pagamenti pendenti',
        value: this.formatCurrency(this.stats.period.pendingPayments),
        detail: `${this.formatNumber(this.pendingPaymentsCount)} stanze / ${this.formatNumber(this.stats.period.pendingCoursePayments)} corsi`,
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

  getUserName(item: DashboardUser & { user?: DashboardUser }): string {
    return item?.name || item?.user?.name || '-';
  }

  getBookingUser(item: DashboardBooking): string {
    return typeof item?.user === 'string' ? '-' : item?.user?.name || '-';
  }

  getBookingSpace(item: DashboardBooking): string {
    return typeof item?.space === 'string' ? '-' : item?.space?.name || '-';
  }

  getCourseSpace(item: DashboardCourse): string {
    const booking = typeof item?.booking === 'string' ? null : item?.booking;
    return typeof booking?.space === 'string' ? '-' : booking?.space?.name || '-';
  }

  getCourseManager(item: DashboardCourse): string {
    const booking = typeof item?.booking === 'string' ? null : item?.booking;
    return typeof booking?.user === 'string' ? '-' : booking?.user?.name || '-';
  }

  getCourseBookingUser(item: DashboardCourseBooking): string {
    return typeof item?.user === 'string' ? '-' : item?.user?.name || '-';
  }

  getCourseBookingTitle(item: DashboardCourseBooking): string {
    return typeof item?.course === 'string' ? '-' : item?.course?.title || '-';
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      confirmed: 'Confermate',
      cancellation_requested: 'Richieste annullamento',
      cancelled: 'Annullate',
      PENDING: 'Da pagare',
      PAID: 'Pagati',
      FAILED: 'Falliti',
      FREE: 'Gratuiti'
    };

    return status ? labels[status] || status : '-';
  }

  getPercent(value: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  openUserDetail(user: DashboardUser): void {
    this.selectedDetailTitle = user.name || 'Utente';
    this.selectedDetailSubtitle = user.email || '-';
    this.selectedDetailIcon = 'ri-user-line';
    this.selectedDetailRows = [
      { label: 'Nome', value: user.name || '-' },
      { label: 'Email', value: user.email || '-' },
      { label: 'Telefono', value: user.phone || '-' },
      { label: 'Codice fiscale', value: user.taxCode || '-' },
      { label: 'Ruolo', value: this.getRoleLabel(user.role) },
      { label: 'Stato account', value: user.isActive === false ? 'Disattivo' : 'Attivo' },
      { label: 'Registrazione', value: this.getRegistrationStatusLabel(user.registrationStatus) },
      { label: 'Interessi', value: user.interestedTags?.length ? user.interestedTags.join(', ') : '-' },
      { label: 'Creato il', value: this.formatDateTime(user.createdAt) },
      { label: 'Aggiornato il', value: this.formatDateTime(user.updatedAt) },
    ];
    this.selectedDetailLink = '/users';
    this.selectedDetailQueryParams = { search: user.email || user.name || '' };
  }

  openBookingDetail(booking: DashboardBooking): void {
    const date = this.formatDate(booking.date);
    const spaceId = this.getObjectId(booking.space);
    const dateValue = booking.date ? new Date(booking.date) : null;
    this.selectedDetailTitle = booking.name || 'Prenotazione';
    this.selectedDetailSubtitle = `${this.getBookingSpace(booking)} - ${date}`;
    this.selectedDetailIcon = 'ri-calendar-check-line';
    this.selectedDetailRows = [
      { label: 'Nome prenotazione', value: booking.name || '-' },
      { label: 'Cliente', value: this.getBookingUser(booking) },
      { label: 'Stanza', value: this.getBookingSpace(booking) },
      { label: 'Data', value: date },
      { label: 'Orario', value: this.formatTimeRange(booking.startTime, booking.endTime) },
      { label: 'Tipo stanza', value: this.getRentalUnitLabel(booking.rentalUnit) },
      { label: 'Modalita acquisto', value: this.getRentalModeLabel(booking.rentalMode) },
      { label: 'Postazioni', value: this.formatNumber(booking.workstationQuantity || 1) },
      { label: 'Stato', value: this.getStatusLabel(booking.status) },
      { label: 'Creata il', value: this.formatDateTime(booking.createdAt) },
      { label: 'Aggiornata il', value: this.formatDateTime(booking.updatedAt) },
    ];
    this.selectedDetailLink = spaceId ? `/space/bookings/${spaceId}` : '/bookings';
    this.selectedDetailQueryParams = dateValue
      ? { month: String(dateValue.getMonth() + 1), year: String(dateValue.getFullYear()) }
      : null;
  }

  openCourseDetail(course: DashboardCourse): void {
    this.selectedDetailTitle = course.title || 'Corso';
    this.selectedDetailSubtitle = `${this.getCourseSpace(course)} - ${this.formatDate(course.date)}`;
    this.selectedDetailIcon = 'ri-graduation-cap-line';
    this.selectedDetailRows = [
      { label: 'Titolo', value: course.title || '-' },
      { label: 'Descrizione', value: course.description || '-' },
      { label: 'Gestore', value: this.getCourseManager(course) },
      { label: 'Stanza', value: this.getCourseSpace(course) },
      { label: 'Data', value: this.formatDate(course.date) },
      { label: 'Orario', value: this.formatTimeRange(course.startTime, course.endTime) },
      { label: 'Iscrizione', value: this.getEnrollmentTypeLabel(course.enrollmentType) },
      { label: 'Prezzo', value: this.formatCurrency(course.price || 0) },
      { label: 'Capienza', value: this.formatNumber(course.capacity || 0) },
      { label: 'Iscritti', value: `${this.formatNumber(course.participants?.length || 0)} / ${this.formatNumber(course.capacity || 0)}` },
      { label: 'Pubblicato', value: course.isPublished === false ? 'No' : 'Si' },
      { label: 'Approvazione', value: this.getApprovalStatusLabel(course.approvalStatus) },
      { label: 'Tag', value: course.tags?.length ? course.tags.join(', ') : '-' },
    ];
    this.selectedDetailLink = course._id ? '/course-bookings' : '/courses';
    this.selectedDetailQueryParams = course._id
      ? { courseId: course._id, courseTitle: course.title || '' }
      : null;
  }

  openCourseBookingDetail(item: DashboardCourseBooking): void {
    const course = typeof item.course === 'string' ? null : item.course;
    this.selectedDetailTitle = this.getCourseBookingTitle(item);
    this.selectedDetailSubtitle = this.getCourseBookingUser(item);
    this.selectedDetailIcon = 'ri-user-add-line';
    this.selectedDetailRows = [
      { label: 'Iscritto', value: this.getCourseBookingUser(item) },
      { label: 'Corso', value: this.getCourseBookingTitle(item) },
      { label: 'Data corso', value: this.formatDate(course?.date) },
      { label: 'Orario', value: this.formatTimeRange(course?.startTime, course?.endTime) },
      { label: 'Stato iscrizione', value: this.getStatusLabel(item.status) },
      { label: 'Tipo iscrizione', value: this.getEnrollmentTypeLabel(item.enrollmentType) },
      { label: 'Stato pagamento', value: this.getStatusLabel(item.paymentStatus) },
      { label: 'Metodo pagamento', value: this.getPaymentMethodLabel(item.paymentMethod) },
      { label: 'Totale', value: this.formatCurrency(item.totalAmount || item.amount || 0) },
      { label: 'Wallet usato', value: this.formatCurrency(item.walletAmount || 0) },
      { label: 'Residuo da pagare', value: this.formatCurrency(item.externalAmount || 0) },
      { label: 'Importo originale', value: this.formatCurrency(item.originalAmount || 0) },
      { label: 'Sconto', value: this.formatCurrency(item.discountAmount || 0) },
      { label: 'Codice sconto', value: item.discountCode || '-' },
      { label: 'Creata il', value: this.formatDateTime(item.createdAt) },
      { label: 'Aggiornata il', value: this.formatDateTime(item.updatedAt) },
    ];
    this.selectedDetailLink = course?._id ? '/course-bookings' : '/course-bookings';
    this.selectedDetailQueryParams = course?._id
      ? { courseId: course._id, courseTitle: course.title || '' }
      : null;
  }

  closeDetail(): void {
    this.selectedDetailTitle = '';
    this.selectedDetailSubtitle = '';
    this.selectedDetailRows = [];
    this.selectedDetailLink = '';
    this.selectedDetailQueryParams = null;
  }

  private getObjectId(value?: string | { _id?: string }): string {
    return typeof value === 'string' ? value : value?._id || '';
  }

  private formatTimeRange(start?: string, end?: string): string {
    if (!start && !end) {
      return '-';
    }

    return `${start || '-'} - ${end || '-'}`;
  }

  private getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      gestore: 'Gestore',
      cliente: 'Cliente'
    };
    return role ? labels[role] || role : '-';
  }

  private getRegistrationStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      complete: 'Completa',
      invited: 'Invitato'
    };
    return status ? labels[status] || status : '-';
  }

  private getRentalUnitLabel(value?: string): string {
    const labels: Record<string, string> = {
      whole_room: 'Stanza intera',
      workstation: 'Postazione'
    };
    return value ? labels[value] || value : '-';
  }

  private getRentalModeLabel(value?: string): string {
    const labels: Record<string, string> = {
      time: 'A tempo',
      full_day: 'Tutta la giornata'
    };
    return value ? labels[value] || value : '-';
  }

  private getEnrollmentTypeLabel(value?: string): string {
    const labels: Record<string, string> = {
      paid: 'A pagamento',
      free: 'Gratuita'
    };
    return value ? labels[value] || value : '-';
  }

  private getApprovalStatusLabel(value?: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      approved: 'Approvato',
      rejected: 'Non approvato',
      closed: 'Chiuso'
    };
    return value ? labels[value] || value : '-';
  }

  private getPaymentMethodLabel(value?: string): string {
    const labels: Record<string, string> = {
      wallet: 'Wallet',
      cash: 'Contanti',
      stripe: 'Stripe',
      paypal: 'PayPal',
      nexi: 'Nexi',
      manual: 'Pagamento manuale'
    };
    return value ? labels[value] || value : '-';
  }
}
