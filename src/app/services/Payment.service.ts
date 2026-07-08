import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../interfaces/payments';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = API_URL + "payments";

  constructor(private http: HttpClient) {}

  getPayments(): Observable<Payment[]>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Payment[]>(this.apiUrl, { headers });
  }
}
