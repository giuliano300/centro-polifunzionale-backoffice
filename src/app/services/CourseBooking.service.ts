import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseBooking } from '../interfaces/course-bookings';

export interface CourseBookingFilters {
  courseId?: string;
  userId?: string;
  status?: string;
}

export interface CreateCourseBooking {
  courseId: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseBookingService {
  private apiUrl = API_URL + "course-bookings";

  constructor(private http: HttpClient) {}

  getCourseBookings(filters: CourseBookingFilters = {}): Observable<CourseBooking[]>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<CourseBooking[]>(this.apiUrl, { headers, params });
  }

  createCourseBooking(payload: CreateCourseBooking): Observable<CourseBooking>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<CourseBooking>(this.apiUrl, payload, { headers });
  }

  deleteCourseBooking(id: string): Observable<{ deleted: boolean }>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<{ deleted: boolean }>(this.apiUrl + "/" + id, { headers });
  }
}
