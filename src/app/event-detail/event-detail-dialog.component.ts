import { Component, Inject } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-event-detail-dialog',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, MatDialogModule, MatButtonModule],
  templateUrl: './event-detail-dialog.component.html',
  styleUrl: './event-detail-dialog.component.scss'
})
export class EventDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  get props(): any {
    return this.data?.extendedProps || {};
  }

  formatDate(value: string | Date): string {
    return value ? new Date(value).toLocaleDateString('it-IT') : '-';
  }

  paymentStatus(): string {
    const payments = this.props.payments || [];
    if (payments.some((payment: any) => payment.status === 'PAID')) {
      return 'Pagato';
    }
    if (payments.some((payment: any) => payment.status === 'PENDING')) {
      return 'Da pagare';
    }
    if (payments.some((payment: any) => payment.status === 'FAILED')) {
      return 'Fallito';
    }
    return 'N/A';
  }

  bookingStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      confirmed: 'Confermata',
      cancellation_requested: 'Richiesta annullamento',
      cancelled: 'Annullata'
    };

    return status ? labels[status] || status : '-';
  }

  paymentStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Da pagare',
      PAID: 'Pagato',
      FAILED: 'Fallito',
      FREE: 'Gratuito'
    };

    return status ? labels[status] || status : '-';
  }

  paymentTotal(payment: any): number {
    return payment?.totalAmount || ((payment?.amount || 0) + (payment?.walletAmount || 0));
  }
}
