import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-event-detail-dialog',
  standalone: true,
  imports: [NgIf, NgFor, MatDialogModule, MatButtonModule],
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
    const total = this.amountValue(payment?.totalAmount);
    if (total > 0) {
      return total;
    }

    return this.amountValue(payment?.amount) + this.amountValue(payment?.walletAmount);
  }

  paymentWallet(payment: any): number {
    return this.amountValue(payment?.walletAmount);
  }

  paymentExternal(payment: any): number {
    if (!payment) {
      return 0;
    }
    const external = this.amountValue(payment.externalAmount);
    if (external > 0 || payment.externalAmount === 0) {
      return external;
    }
    return this.amountValue(payment.amount);
  }

  mainPayment(): any {
    const payments = this.props.payments || [];
    return payments.find((payment: any) => payment.status === 'PAID')
      || payments.find((payment: any) => payment.status === 'PENDING')
      || payments[0]
      || null;
  }

  totalPaid(): number {
    const payment = this.mainPayment();
    return payment ? this.paymentTotal(payment) : 0;
  }

  formatAmount(value: unknown): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(this.amountValue(value));
  }

  bookingStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      cancellation_requested: 'status-warning',
      cancelled: 'status-cancelled'
    };

    return status ? classes[status] || 'status-pending' : 'status-pending';
  }

  paymentStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      PENDING: 'payment-pending',
      PAID: 'payment-paid',
      FAILED: 'payment-failed',
      FREE: 'payment-free'
    };

    return status ? classes[status] || 'payment-pending' : 'payment-pending';
  }

  paymentMethodLabel(payment: any): string {
    const method = String(payment?.provider || payment?.method || '').toLowerCase();
    const labels: Record<string, string> = {
      wallet: 'Wallet',
      manual: 'Pagamento manuale',
      stripe: 'Stripe',
      paypal: 'PayPal',
      nexi: 'Nexi',
      card: 'Carta',
      cash: 'Contanti'
    };

    if (method && labels[method]) {
      return labels[method];
    }

    return payment?.status === 'PAID' ? 'Pagamento registrato' : 'Pagamento da completare';
  }

  private amountValue(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const parsed = Number(value.replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const mongoValue = record['$numberDecimal'] || record['$numberInt'] || record['$numberLong'];
      if (mongoValue !== undefined) {
        return this.amountValue(mongoValue);
      }
      const valueOf = (value as { valueOf?: () => unknown }).valueOf?.();
      if (valueOf !== value) {
        return this.amountValue(valueOf);
      }
    }
    return 0;
  }
}
