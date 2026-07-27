import { Bookings } from "./bookings";

export type CourseEnrollmentType = 'paid' | 'free';
export type CourseApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Course {
  _id: string;
  title: string;
  description: string;
  tags?: string[];
  imageUrl?: string;
  imageCrop?: { x: number; y: number; scale: number };
  bannerImageUrl?: string;
  bannerImageCrop?: { x: number; y: number; scale: number };
  cardImageUrl?: string;
  cardImageCrop?: { x: number; y: number; scale: number };
  date: string;
  startTime: string;
  endTime: string;
  booking: string | Bookings;
  capacity: number;
  enrollmentType: CourseEnrollmentType;
  price: number;
  isPublished: boolean;
  approvalStatus?: CourseApprovalStatus;
}

export interface CreateCourse {
  title: string;
  description: string;
  tags?: string[];
  imageUrl?: string;
  imageCrop?: { x: number; y: number; scale: number };
  bannerImageUrl?: string;
  bannerImageCrop?: { x: number; y: number; scale: number };
  cardImageUrl?: string;
  cardImageCrop?: { x: number; y: number; scale: number };
  date: string;
  startTime: string;
  endTime: string;
  booking: string;
  capacity: number;
  enrollmentType: CourseEnrollmentType;
  price: number;
  isPublished: boolean;
  approvalStatus?: CourseApprovalStatus;
}
