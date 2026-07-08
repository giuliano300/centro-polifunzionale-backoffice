import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Payment } from '../../interfaces/payments';
import { PaymentService } from '../../services/Payment.service';
import { Bookings } from '../../interfaces/bookings';

@Component({
  selector: 'app-payments',
  imports: [MatCardModule, MatPaginatorModule, MatTableModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent {
  displayedColumns: string[] = ['booking', 'user', 'space', 'date', 'amount', 'status', 'method', 'transactionId'];
  dataSource = new MatTableDataSource<Payment>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.getPayments();
  }

  getPayments(): void {
    this.paymentService.getPayments().subscribe((data: Payment[]) => {
      this.dataSource = new MatTableDataSource<Payment>(data);
      this.dataSource.paginator = this.paginator;
    });
  }

  getBooking(payment: Payment): Bookings | null {
    return typeof payment.bookingId === 'string' ? null : payment.bookingId;
  }

  getBookingDate(payment: Payment): string {
    const date = this.getBooking(payment)?.date;
    if (!date) return '-';

    return new Date(date).toLocaleDateString('it-IT');
  }
}
