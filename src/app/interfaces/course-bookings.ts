import { AuthUser } from "./auth-user";
import { Course } from "./courses";

export type CourseBookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type CourseBookingPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'FREE';

export interface CourseBooking {
  _id: string;
  user: string | AuthUser;
  course: string | Course;
  status: CourseBookingStatus;
  enrollmentType: 'paid' | 'free';
  amount: number;
  totalAmount?: number;
  walletAmount?: number;
  externalAmount?: number;
  paymentStatus: CourseBookingPaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}
