import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../main';
import { DiscountCode } from '../interfaces/discount-codes';

@Injectable({ providedIn: 'root' })
export class DiscountCodeService {
  private apiUrl = API_URL + 'discount-codes';

  constructor(private http: HttpClient) {}

  private headers(): { headers: HttpHeaders } {
    const token = localStorage.getItem('authToken');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  getAll(): Observable<DiscountCode[]> {
    return this.http.get<DiscountCode[]>(this.apiUrl, this.headers());
  }

  create(payload: Partial<DiscountCode>): Observable<DiscountCode> {
    return this.http.post<DiscountCode>(this.apiUrl, payload, this.headers());
  }

  update(id: string, payload: Partial<DiscountCode>): Observable<DiscountCode> {
    return this.http.patch<DiscountCode>(`${this.apiUrl}/${id}`, payload, this.headers());
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`, this.headers());
  }
}
