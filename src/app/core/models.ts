import { UserRole } from './user-role.enum';

export interface JwtPayload {
  sub?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
}

export interface ManagerRegistrationOtpResponse {
  requested: boolean;
  email: string;
  phone: string;
  expiresInMinutes: number;
  retryAfterSeconds: number;
  devEmailOtp?: string;
  devPhoneOtp?: string;
}

export interface ManagerRegistrationConfirmResponse {
  registered: boolean;
  user: User;
}

export interface ManagerPasswordResetLinkResponse {
  sent: boolean;
  email: string;
  expiresInMinutes: number;
  devResetUrl?: string;
}

export interface User {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxCode?: string;
  role?: UserRole;
}

export interface CourseTagOption {
  _id?: string;
  value: string;
  label: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SpaceOpeningSlot {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  maxConsecutiveTimeSlots?: number;
}

export interface Space {
  _id: string;
  name: string;
  description?: string;
  hourlyRate?: number;
  dailyRate?: number;
  rentalUnit: 'whole_room' | 'workstation';
  rentalModes: Array<'time' | 'full_day'>;
  timeSlotMinutes?: number;
  maxConsecutiveTimeSlots?: number;
  workstationCount?: number;
  sectorEnabled?: boolean;
  sectorCount?: number;
  sectorNames?: string[];
  sectorRate?: number;
  sectorDailyRate?: number;
  courseCreationAdvanceHours?: number;
  paymentMethods?: Array<'cash' | 'stripe' | 'paypal' | 'nexi'>;
  openingHours?: SpaceOpeningSlot[];
  isAvailable: boolean;
}

export interface Booking {
  _id: string;
  name: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  rentalUnit: 'whole_room' | 'workstation';
  rentalMode: 'time' | 'full_day';
  workstationQuantity?: number;
  sectorQuantity?: number;
  sectorIndexes?: number[];
  status: 'pending' | 'confirmed' | 'cancellation_requested' | 'cancelled' | 'expired';
  holdExpiresAt?: string | Date;
  user?: string | User;
  space?: string | Space;
}

export interface Payment {
  _id?: string;
  bookingId: string | Booking;
  amount: number;
  totalAmount?: number;
  walletAmount?: number;
  externalAmount?: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  method?: string;
  transactionId?: string;
  provider?: 'manual' | 'stripe' | 'paypal' | 'nexi';
  checkoutUrl?: string;
  originalAmount?: number;
  discountAmount?: number;
  discountCode?: string;
}

export interface BookingWithPayments {
  booking: Booking;
  payments: Payment[];
  cancellationRefundAmount?: number;
}

export interface PaginatedBookings {
  items: BookingWithPayments[];
  total: number;
  page: number;
  limit: number;
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
  rentalMode: 'time' | 'full_day';
  isOpen: boolean;
  maxConsecutiveTimeSlots?: number;
  closureReason?: string;
  slots: AvailabilitySlot[];
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
  imageCrop?: { x: number; y: number; scale: number };
  bannerImageUrl?: string;
  bannerImageCrop?: { x: number; y: number; scale: number };
  cardImageUrl?: string;
  cardImageCrop?: { x: number; y: number; scale: number };
  date: string | Date;
  startTime: string;
  endTime: string;
  booking: string | Booking;
  capacity: number;
  enrollmentType: 'paid' | 'free';
  price: number;
  isPublished: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface CourseBooking {
  _id: string;
  user: string | User;
  course: string | Course;
  status: string;
  holdExpiresAt?: string | Date;
  enrollmentType: 'paid' | 'free';
  amount: number;
  totalAmount?: number;
  walletAmount?: number;
  externalAmount?: number;
  originalAmount?: number;
  discountAmount?: number;
  discountCode?: string;
  paymentMethod?: 'cash' | 'stripe' | 'paypal' | 'nexi';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'FREE';
}

export interface ClientInviteResponse {
  user: User;
  completeUrl: string;
  sent: boolean;
}

export interface ClientInviteDetails {
  name: string;
  email: string;
  phone?: string;
  taxCode?: string;
  role?: UserRole;
  expiresAt?: string | Date;
}

export interface ClientInvitePhoneOtpResponse {
  requested: boolean;
  phone: string;
  expiresInMinutes: number;
  retryAfterSeconds: number;
  devPhoneOtp?: string;
}

export interface WalletMovement {
  _id: string;
  type: 'credit' | 'debit';
  reason: 'cancellation_refund' | 'course_refund' | 'booking_payment' | 'course_payment' | 'manual';
  amount: number;
  currency: 'EUR';
  booking?: string | Booking;
  courseBooking?: string;
  description?: string;
  createdAt?: string | Date;
}

export interface WalletSummary {
  currency: 'EUR';
  balance: number;
  movements: WalletMovement[];
}
