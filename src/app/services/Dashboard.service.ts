import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../main';

export interface DashboardUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxCode?: string;
  role?: string;
  isActive?: boolean;
  registrationStatus?: string;
  interestedTags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
  endTime?: string;
  rentalUnit?: string;
  rentalMode?: string;
  workstationQuantity?: number;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user?: string | DashboardUser;
  space?: string | DashboardSpace;
}

export interface DashboardCourse {
  _id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  date?: string | Date;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  enrollmentType?: string;
  price?: number;
  isPublished?: boolean;
  approvalStatus?: string;
  participants?: string[];
  booking?: string | DashboardBooking;
}

export interface DashboardCourseBooking {
  _id?: string;
  status?: string;
  enrollmentType?: string;
  amount?: number;
  totalAmount?: number;
  walletAmount?: number;
  externalAmount?: number;
  originalAmount?: number;
  discountAmount?: number;
  discountCode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
    walletUsed: number;
    monthWalletUsed: number;
    bookingWalletUsed: number;
    monthBookingWalletUsed: number;
    courseWalletUsed: number;
    monthCourseWalletUsed: number;
    coursePaidRevenue: number;
    monthCoursePaidRevenue: number;
    monthCourseDatePaidRevenue: number;
    monthCourseDateWalletUsed: number;
    pendingCoursePayments: number;
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
