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

    getBookings(id: string): Observable<BookingWithPayments[]>{
      const token = localStorage.getItem('authToken'); 
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });      
      return this.http.get<BookingWithPayments[]>(this.apiUrl + "?spaceId=" + id, { headers });
    }  
}
