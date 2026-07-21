import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../interfaces/payments';

export interface PaymentFilters {
  start?: string;
  end?: string;
  status?: string;
  search?: string;
}

export interface CreatePayment {
  bookingId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  method: string;
  transactionId?: string;
}

export interface PaymentLinkResponse {
  sent: boolean;
  email?: string;
  paymentId: string;
  paymentUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = API_URL + "payments";

  constructor(private http: HttpClient) {}

  getPayments(filters: PaymentFilters = {}): Observable<Payment[]>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = this.buildQuery(filters);
    return this.http.get<Payment[]>(this.apiUrl + params, { headers });
  }

  create(payment: CreatePayment): Observable<Payment>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Payment>(this.apiUrl, payment, { headers });
  }

  confirmBookingPayment(bookingId: string, amount?: number, method = 'manual'): Observable<Payment>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const payload: { amount?: number; method: string; transactionId: string } = {
      method,
      transactionId: `MANUAL-${Date.now()}`
    };

    if (amount && amount > 0) {
      payload.amount = amount;
    }

    return this.http.post<Payment>(`${this.apiUrl}/booking/${bookingId}/confirm`, payload, { headers });
  }

  sendBookingPaymentLink(bookingId: string): Observable<PaymentLinkResponse>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<PaymentLinkResponse>(`${this.apiUrl}/booking/${bookingId}/send-payment-link`, {}, { headers });
  }

  private buildQuery(filters: object): string {
    const params = new URLSearchParams();
    Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      }
    });
    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
