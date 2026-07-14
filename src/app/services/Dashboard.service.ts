import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../main';

export interface DashboardStats {
  generatedAt: string;
  totals: {
    users: number;
    clients: number;
    managers: number;
    activeUsers: number;
    spaces: number;
    availableSpaces: number;
    bookings: number;
    courses: number;
    publishedCourses: number;
    courseBookings: number;
  };
  period: {
    todayBookings: number;
    monthBookings: number;
    monthCourses: number;
    pendingCourseBookings: number;
    paidRevenue: number;
    monthRevenue: number;
    pendingPayments: number;
  };
  breakdowns: {
    bookingsByStatus: Array<{ status: string; count: number }>;
    paymentsByStatus: Array<{ status: string; count: number; amount: number }>;
    courseBookingsByStatus: Array<{ status: string; count: number }>;
    spaceUsage: Array<{ spaceId: string; name: string; bookings: number }>;
  };
  recent: {
    users: any[];
    bookings: any[];
    courses: any[];
    courseBookings: any[];
  };
  upcoming: {
    bookings: any[];
    courses: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = API_URL + 'dashboard/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<DashboardStats>(this.apiUrl, { headers });
  }
}
