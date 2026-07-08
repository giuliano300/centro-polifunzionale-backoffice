import { Bookings } from "./bookings";

export type CourseEnrollmentType = 'paid' | 'free';

export interface Course {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  booking: string | Bookings;
  capacity: number;
  enrollmentType: CourseEnrollmentType;
  price: number;
  isPublished: boolean;
}

export interface CreateCourse {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  booking: string;
  capacity: number;
  enrollmentType: CourseEnrollmentType;
  price: number;
  isPublished: boolean;
}
