import { Component, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Payment } from '../../interfaces/payments';
import { PaymentService } from '../../services/Payment.service';
import { Bookings } from '../../interfaces/bookings';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

@Component({
  selector: 'app-payments',
  imports: [NgIf, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatPaginatorModule, MatSelectModule, MatTableModule, FeathericonsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent {
  displayedColumns: string[] = ['booking', 'user', 'space', 'date', 'amount', 'status', 'method', 'transactionId'];
  dataSource = new MatTableDataSource<Payment>([]);
  payments: Payment[] = [];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      startDate: [this.getTodayDate()],
      endDate: [this.getTodayDate()],
      search: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.getPayments();
  }

  getPayments(): void {
    const dateRange = this.getSelectedDateRange();
    this.paymentService.getPayments({
      start: dateRange.start,
      end: dateRange.end,
      status: this.filterForm.value.status,
      search: this.filterForm.value.search
    }).subscribe((data: Payment[]) => {
      this.payments = data;
      this.dataSource = new MatTableDataSource<Payment>(this.payments);
      this.dataSource.paginator = this.paginator;
    });
  }

  applyFilters(): void {
    this.getPayments();
  }

  resetFilters(): void {
    this.filterForm.patchValue({ startDate: this.getTodayDate(), endDate: this.getTodayDate(), search: '', status: '' });
    this.applyFilters();
  }

  getBooking(payment: Payment): Bookings | null {
    return typeof payment.bookingId === 'string' ? null : payment.bookingId;
  }

  getBookingDate(payment: Payment): string {
    const date = this.getBooking(payment)?.date;
    if (!date) return '-';

    return new Date(date).toLocaleDateString('it-IT');
  }

  getPaymentStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Da pagare',
      PAID: 'Pagato',
      FAILED: 'Fallito',
      FREE: 'Gratuito'
    };

    return status ? labels[status] || status : '-';
  }

  getTotalAmount(payment: Payment): number {
    return payment.totalAmount || ((payment.amount || 0) + (payment.walletAmount || 0));
  }

  getWalletAmount(payment: Payment): number {
    return payment.walletAmount || 0;
  }

  getExternalAmount(payment: Payment): number {
    return payment.externalAmount || payment.amount || 0;
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  private getToday(): string {
    return this.toDateInputValue(new Date());
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getSelectedDateRange(): { start?: string; end?: string } {
    const startDate = this.filterForm.value.startDate;
    const endDate = this.filterForm.value.endDate || startDate;
    if (!startDate && !endDate) {
      return {};
    }

    const start = startDate instanceof Date ? new Date(startDate) : new Date(`${startDate}T00:00:00`);
    start.setHours(0, 0, 0, 0);
    const end = endDate instanceof Date ? new Date(endDate) : new Date(`${endDate}T00:00:00`);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  private toDateInputValue(value: string | Date): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
