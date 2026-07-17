import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BookingWithPayments } from '../../interfaces/BookingWithPayments';
import { BookingService } from '../../services/Booking.service';
import { CustomDateFormatPipe } from '../../services/custom-date-format.pipe';

@Component({
  selector: 'app-cancellation-requests',
  imports: [NgIf, MatButtonModule, MatCardModule, MatTableModule, CustomDateFormatPipe],
  templateUrl: './cancellation-requests.component.html',
  styleUrl: './cancellation-requests.component.scss'
})
export class CancellationRequestsComponent {
  displayedColumns = ['booking', 'manager', 'space', 'date', 'paid', 'wallet', 'actions'];
  requests: BookingWithPayments[] = [];
  isLoading = true;
  message = '';
  page = 1;
  limit = 10;
  total = 0;
  processingId = '';
  refundAmounts: Record<string, number> = {};

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.message = '';
    this.bookingService.getBookingsPage({
      status: 'cancellation_requested',
      page: String(this.page),
      limit: String(this.limit)
    }).subscribe({
      next: (result) => {
        this.requests = result.items;
        this.requests.forEach((item) => {
          if (this.refundAmounts[item.booking._id] === undefined) {
            this.refundAmounts[item.booking._id] = this.paidAmount(item);
          }
        });
        this.total = result.total;
        this.page = result.page;
        this.limit = result.limit;
        this.isLoading = false;
      },
      error: () => {
        this.message = 'Richieste non disponibili.';
        this.isLoading = false;
      }
    });
  }

  approve(item: BookingWithPayments): void {
    if (this.processingId) return;
    const paid = this.paidAmount(item);
    const creditAmount = Math.min(Math.max(this.walletAmount(item), 0), paid);
    this.refundAmounts[item.booking._id] = creditAmount;
    this.processingId = item.booking._id;
    this.bookingService.approveCancellation(item.booking._id, creditAmount).subscribe({
      next: () => {
        this.message = 'Richiesta approvata. Credito accreditato nel portafogli.';
        this.processingId = '';
        this.load();
      },
      error: () => {
        this.message = 'Operazione non completata.';
        this.processingId = '';
      }
    });
  }

  reject(item: BookingWithPayments): void {
    this.changeStatus(item, 'confirmed', 'Richiesta respinta. Prenotazione confermata.');
  }

  paidAmount(item: BookingWithPayments): number {
    return item.payments?.find((payment) => payment.status === 'PAID')?.amount
      || item.payments?.[0]?.amount
      || 0;
  }

  walletAmount(item: BookingWithPayments): number {
    return this.refundAmounts[item.booking._id] ?? this.paidAmount(item);
  }

  updateRefundAmount(item: BookingWithPayments, value: string): void {
    const paid = this.paidAmount(item);
    const amount = Number(value);
    const normalized = Number.isFinite(amount) ? amount : 0;
    this.refundAmounts[item.booking._id] = Math.min(Math.max(normalized, 0), paid);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  totalPages(): number {
    return Math.max(Math.ceil(this.total / this.limit), 1);
  }

  previousPage(): void {
    if (this.page <= 1) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if (this.page >= this.totalPages()) return;
    this.page += 1;
    this.load();
  }

  private changeStatus(item: BookingWithPayments, status: string, successMessage: string): void {
    if (this.processingId) return;
    const paid = this.paidAmount(item);
    this.refundAmounts[item.booking._id] = Math.min(Math.max(this.walletAmount(item), 0), paid);
    this.processingId = item.booking._id;
    this.bookingService.updateStatus(item.booking._id, status).subscribe({
      next: () => {
        this.message = successMessage;
        this.processingId = '';
        this.load();
      },
      error: () => {
        this.message = 'Operazione non completata.';
        this.processingId = '';
      }
    });
  }
}
