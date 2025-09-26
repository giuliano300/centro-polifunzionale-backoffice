import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingWithPayments } from '../interfaces/BookingWithPayments';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private apiUrl = API_URL + "bookings";
  
  constructor(private http: HttpClient) {}

  getBookings(id: string, year?: string, month?: string): Observable<BookingWithPayments[]>{
    const token = localStorage.getItem('authToken'); 
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });      

    let url = this.apiUrl + "?spaceId=" + id;

    if (year && month) {
      // Crea date UTC con orario inizio e fine
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1, 0, 0, 0)); // primo giorno mese successivo

      const inizioMese = startDate.toISOString();  // es: 2025-07-01T00:00:00.000Z
      const fineMese = endDate.toISOString();      // es: 2025-08-01T00:00:00.000Z

      url += `&start=${inizioMese}&end=${fineMese}`;
    }

    return this.http.get<BookingWithPayments[]>(url, { headers });    
  }  

}
