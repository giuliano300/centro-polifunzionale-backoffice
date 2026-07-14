import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../main';

export interface DashboardUser {
  _id?: string;
  name?: string;
  email?: string;
}

export interface DashboardSpace {
  _id?: string;
  name?: string;
}

export interface DashboardBooking {
  _id?: string;
  name?: string;
  date?: string | Date;
  startTime?: string;
  status?: string;
  user?: string | DashboardUser;
  space?: string | DashboardSpace;
}

export interface DashboardCourse {
  _id?: string;
  title?: string;
  date?: string | Date;
  startTime?: string;
  booking?: string | DashboardBooking;
}

export interface DashboardCourseBooking {
  _id?: string;
  status?: string;
  user?: string | DashboardUser;
  course?: string | DashboardCourse;
}

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
    users: DashboardUser[];
    bookings: DashboardBooking[];
    courses: DashboardCourse[];
    courseBookings: DashboardCourseBooking[];
  };
  upcoming: {
    bookings: DashboardBooking[];
    courses: DashboardCourse[];
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
