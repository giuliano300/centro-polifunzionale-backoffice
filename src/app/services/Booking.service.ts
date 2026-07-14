import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingWithPayments } from '../interfaces/BookingWithPayments';
import { Bookings } from '../interfaces/bookings';

export interface BookingFilters {
  start?: string;
  end?: string;
  status?: string;
  search?: string;
}

export interface CreateBooking {
  spaceId: string;
  userId?: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  rentalUnit?: 'whole_room' | 'workstation';
  rentalMode?: 'time' | 'full_day';
  workstationQuantity?: number;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  amount: number;
  available: boolean;
}

export interface BookingAvailability {
  spaceId: string;
  date: string;
  rentalMode: string;
  isOpen: boolean;
  slots: AvailabilitySlot[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private apiUrl = API_URL + "bookings";
  
  constructor(private http: HttpClient) {}

  getAllBookings(filters: BookingFilters = {}): Observable<BookingWithPayments[]>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = this.buildQuery(filters);
    return this.http.get<BookingWithPayments[]>(this.apiUrl + params, { headers });
  }

  getBookings(id: string, year?: string, month?: string, start?: string, end?: string): Observable<BookingWithPayments[]>{
    const token = localStorage.getItem('authToken'); 
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });      

    let url = this.apiUrl + "?spaceId=" + id;

    if (start && end) {
      url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    } else if (year && month) {
      // Crea date UTC con orario inizio e fine
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1, 0, 0, 0)); // primo giorno mese successivo

      const inizioMese = startDate.toISOString();  // es: 2025-07-01T00:00:00.000Z
      const fineMese = endDate.toISOString();      // es: 2025-08-01T00:00:00.000Z

      url += `&start=${inizioMese}&end=${fineMese}`;
    }

    return this.http.get<BookingWithPayments[]>(url, { headers });    
  }  

  getAvailability(spaceId: string, date: string, rentalMode: string, workstationQuantity = 1): Observable<BookingAvailability>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<BookingAvailability>(
      `${this.apiUrl}/availability?spaceId=${spaceId}&date=${date}&rentalMode=${rentalMode}&workstationQuantity=${workstationQuantity}`,
      { headers }
    );
  }

  create(payload: CreateBooking): Observable<Bookings>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Bookings>(this.apiUrl, payload, { headers });
  }

  delete(id: string): Observable<{ deleted: boolean }>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<{ deleted: boolean }>(this.apiUrl + "/" + id, { headers });
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
