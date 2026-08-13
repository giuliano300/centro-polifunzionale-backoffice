import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { BookingWithPayments } from '../../interfaces/BookingWithPayments';

type DetailRow = { label: string; value: string };

@Component({
  selector: 'app-booking-detail-modal',
  imports: [NgIf, NgFor, RouterLink, MatButtonModule],
  templateUrl: './booking-detail-modal.component.html',
  styleUrl: './booking-detail-modal.component.scss'
})
export class BookingDetailModalComponent {
  @Output() closed = new EventEmitter<void>();

  item: BookingWithPayments | null = null;
  title = '';
  subtitle = '';
  status = '';
  statusClass = '';
  color = 'var(--color-brand)';
  summaryRows: DetailRow[] = [];
  clientRows: DetailRow[] = [];
  spaceRows: DetailRow[] = [];
  paymentRows: DetailRow[] = [];
  detailLink = '/bookings';
  detailQueryParams: Record<string, string> | null = null;

  @Input() set booking(value: BookingWithPayments | null) {
    this.item = value;
    if (value) this.buildDetail(value);
  }

  close(): void {
    this.closed.emit();
  }

  private buildDetail(item: BookingWithPayments): void {
    const booking = item.booking;
    const date = this.formatDate(booking.date);
    const payment = item.payments?.find((entry) => entry.status === 'PAID')
      || item.payments?.find((entry) => entry.status === 'PENDING')
      || item.payments?.[0];

    this.title = booking.name || 'Prenotazione';
    this.subtitle = `${booking.space?.name || 'Stanza'} - ${date}`;
    this.status = this.bookingStatusLabel(booking.status);
    this.statusClass = booking.status || 'pending';
    this.color = this.bookingColor(item);
    this.summaryRows = [
      { label: 'Nome prenotazione', value: booking.name || '-' },
      { label: 'Data', value: date },
      { label: 'Orario', value: `${booking.startTime || '-'} - ${booking.endTime || '-'}` },
      { label: 'Stato prenotazione', value: this.bookingStatusLabel(booking.status) },
    ];
    this.clientRows = [
      { label: 'Cliente', value: booking.user?.name || '-' },
      { label: 'Email', value: booking.user?.email || '-' },
      { label: 'Telefono', value: booking.user?.phone || '-' },
    ];
    this.spaceRows = [
      { label: 'Stanza', value: booking.space?.name || '-' },
      { label: 'Aree', value: this.sectorLabel(item) },
      { label: 'Tipo stanza', value: this.rentalUnitLabel(booking.rentalUnit) },
      { label: 'Modalità acquisto', value: this.rentalModeLabel(booking.rentalMode) },
      { label: 'Postazioni', value: String(booking.workstationQuantity || 1) },
    ];
    this.paymentRows = [
      { label: 'Totale', value: this.currency(payment?.totalAmount || ((payment?.amount || 0) + (payment?.walletAmount || 0))) },
      { label: 'Wallet usato', value: this.currency(payment?.walletAmount || 0) },
      { label: 'Da metodo pagamento', value: this.currency(payment?.externalAmount || payment?.amount || 0) },
      { label: 'Metodo', value: this.paymentMethodLabel(payment?.provider || payment?.method, payment?.status) },
      { label: 'Stato', value: this.paymentStatusLabel(payment?.status) },
    ];
    this.detailLink = booking.space?._id ? `/space/bookings/${booking.space._id}` : '/bookings';
    const rawDate = booking.date ? new Date(booking.date) : null;
    this.detailQueryParams = rawDate && !Number.isNaN(rawDate.getTime())
      ? { month: String(rawDate.getMonth() + 1), year: String(rawDate.getFullYear()) }
      : null;
  }

  private sectorLabel(item: BookingWithPayments): string {
    const space = item.booking.space;
    const indexes = item.booking.sectorIndexes || [];
    if (!space?.sectorEnabled || !indexes.length || indexes.length >= Number(space.sectorCount || 1)) return 'Stanza intera';
    return indexes.map((index) => space.sectorNames?.[index] || `Area ${index + 1}`).join(', ');
  }

  private bookingColor(item: BookingWithPayments): string {
    const space = item.booking.space;
    const indexes = item.booking.sectorIndexes || [];
    if (space?.sectorEnabled && indexes.length === 1) {
      const areaColor = this.normalizedColor(space.sectorColors?.[indexes[0]]);
      if (areaColor) return areaColor;
    }
    return this.normalizedColor(space?.calendarColor) || 'var(--color-brand)';
  }

  private bookingStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      confirmed: 'Confermata',
      cancellation_requested: 'Richiesta annullamento',
      cancelled: 'Annullata',
      expired: 'Scaduta'
    };
    return status ? labels[status] || status : '-';
  }

  private paymentStatusLabel(status?: string): string {
    const labels: Record<string, string> = { PAID: 'Pagato', PENDING: 'In attesa', FAILED: 'Fallito', FREE: 'Gratuito' };
    return status ? labels[status] || status : '-';
  }

  private paymentMethodLabel(methodValue?: string, status?: string): string {
    const method = String(methodValue || '').toLowerCase();
    const labels: Record<string, string> = {
      wallet: 'Wallet', manual: 'Pagamento manuale', stripe: 'Stripe', paypal: 'PayPal', nexi: 'Nexi', card: 'Carta', cash: 'Contanti'
    };
    if (method && labels[method]) return labels[method];
    return status === 'PAID' ? 'Pagamento registrato' : status ? 'Pagamento da completare' : '-';
  }

  private rentalUnitLabel(value?: string): string {
    return value === 'whole_room' ? 'Stanza intera' : value === 'workstation' ? 'Postazione' : value || '-';
  }

  private rentalModeLabel(value?: string): string {
    return value === 'time' ? 'A tempo' : value === 'full_day' ? 'Tutta la giornata' : value || '-';
  }

  private formatDate(value?: string | Date): string {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  private currency(value?: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  private normalizedColor(value?: string): string {
    const color = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '';
  }
}
