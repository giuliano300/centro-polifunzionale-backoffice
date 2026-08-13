import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Booking,
  BookingAvailability,
  BookingWithPayments,
  Course,
  CourseBooking,
  ClientInviteResponse,
  PaginatedBookings,
  Payment,
  Space,
  User,
  WalletSummary,
  CourseTagOption,
} from './models';
import { AuthService } from './auth.service';
import { UserRole } from './user-role.enum';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(idempotent = false): { headers: HttpHeaders } {
    const values: Record<string, string> = { Authorization: `Bearer ${this.auth.token()}` };
    if (idempotent) values['Idempotency-Key'] = crypto.randomUUID();
    return {
      headers: new HttpHeaders(values),
    };
  }

  spaces() {
    return this.http.get<Space[]>(`${this.apiUrl}spaces`, this.headers());
  }

  bookings(filters: Record<string, string> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<BookingWithPayments[]>(`${this.apiUrl}bookings`, { ...this.headers(), params });
  }

  bookingsPage(filters: Record<string, string> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<PaginatedBookings>(`${this.apiUrl}bookings`, { ...this.headers(), params });
  }

  availability(spaceId: string, date: string, rentalMode: string, workstationQuantity = 1, sectorQuantity = 0, sectorIndexes: number[] = []) {
    const params = new HttpParams()
      .set('spaceId', spaceId)
      .set('date', date)
      .set('rentalMode', rentalMode)
      .set('workstationQuantity', workstationQuantity)
      .set('sectorQuantity', sectorQuantity)
      .set('sectorIndexes', sectorIndexes.join(','));
    return this.http.get<BookingAvailability>(`${this.apiUrl}bookings/availability`, { ...this.headers(), params });
  }

  createBooking(payload: Record<string, unknown>) {
    return this.http.post<Booking>(`${this.apiUrl}bookings`, payload, this.headers(true));
  }

  requestBookingCancellation(bookingId: string) {
    return this.http.post<Booking>(`${this.apiUrl}bookings/${bookingId}/cancellation-request`, {}, this.headers());
  }

  payments(filters: Record<string, string> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<Payment[]>(`${this.apiUrl}payments`, { ...this.headers(), params });
  }

  bookingPayments(bookingId: string) {
    return this.http.get<Payment[]>(`${this.apiUrl}payments/by-booking/${bookingId}`, this.headers());
  }

  markBookingPaid(bookingId: string, amount?: number, method = 'manual') {
    const payload: { amount?: number; method: string; transactionId: string } = {
      method,
      transactionId: `${method.toUpperCase()}-${Date.now()}`,
    };

    if (amount && amount > 0) {
      payload.amount = amount;
    }

    return this.http.post<Payment>(`${this.apiUrl}payments/booking/${bookingId}/confirm`, payload, this.headers());
  }

  createCheckout(bookingId: string, provider: 'stripe' | 'paypal' | 'nexi') {
    const origin = window.location.origin;
    return this.http.post<{ provider: string; paymentId: string; checkoutUrl: string; transactionId?: string }>(
      `${this.apiUrl}payments/booking/${bookingId}/checkout`,
      {
        provider,
        successUrl: `${origin}/bookings?payment=success`,
        cancelUrl: `${origin}/bookings?payment=cancel`,
      },
      this.headers(),
    );
  }

  courses(filters: Record<string, string> = {}) {
    let params = new HttpParams();
    params = params.set('scope', 'manager');
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<Course[]>(`${this.apiUrl}courses`, { ...this.headers(), params });
  }

  course(id: string) { return this.http.get<Course>(`${this.apiUrl}courses/${id}`, this.headers()); }

  courseTags() {
    return this.http.get<CourseTagOption[]>(`${this.apiUrl}course-tags`);
  }

  createCourse(payload: Partial<Course>) {
    return this.http.post<Course>(`${this.apiUrl}courses`, payload, this.headers());
  }

  courseChat(courseId: string) { return this.http.get<any[]>(`${this.apiUrl}course-chat/${courseId}`, this.headers()); }
  sendCourseChat(courseId: string, text: string) { return this.http.post<any>(`${this.apiUrl}course-chat/${courseId}`, { text }, this.headers()); }
  courseChatRooms(courseId: string) { return this.http.get<any[]>(`${this.apiUrl}course-chat/${courseId}/rooms`, this.headers()); }
  createCourseChatRoom(courseId: string, title: string, memberIds: string[], isGroup = false) { return this.http.post<any>(`${this.apiUrl}course-chat/${courseId}/rooms`, { title, memberIds, isGroup }, this.headers()); }
  courseChatMessages(courseId: string, roomId: string) { return this.http.get<any[]>(`${this.apiUrl}course-chat/${courseId}/rooms/${roomId}/messages`, this.headers()); }
  sendCourseChatMessage(courseId: string, roomId: string, text: string, moderationConfirmed = false) { return this.http.post<any>(`${this.apiUrl}course-chat/${courseId}/rooms/${roomId}/messages`, { text, moderationConfirmed }, this.headers()); }
  markCourseChatRead(courseId: string, roomId: string) { return this.http.patch(`${this.apiUrl}course-chat/${courseId}/rooms/${roomId}/read`, {}, this.headers()); }

  uploadCourseImage(file: File, type: 'banner' | 'card' = 'banner') {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ imageUrl: string; width: number; height: number; size: number; mimeType: string }>(
      `${this.apiUrl}courses/upload-image?type=${type}`,
      formData,
      this.headers(),
    );
  }

  mediaUrl(path?: string): string {
    if (!path) {
      return '';
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return `${this.apiUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }

  updateCourse(id: string, payload: Partial<Course>) {
    return this.http.patch<Course>(`${this.apiUrl}courses/${id}`, payload, this.headers());
  }

  deleteCourse(id: string) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}courses/${id}`, this.headers());
  }

  courseBookings(courseId?: string) {
    const params = courseId ? new HttpParams().set('courseId', courseId) : undefined;
    return this.http.get<CourseBooking[]>(`${this.apiUrl}course-bookings`, { ...this.headers(), params });
  }

  createCourseBooking(courseId: string, userId: string, discountCode?: string) {
    return this.http.post<CourseBooking>(`${this.apiUrl}course-bookings`, { courseId, userId, discountCode }, this.headers(true));
  }

  removeCourseBooking(id: string) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}course-bookings/${id}`, this.headers());
  }

  searchClients(search: string) {
    const params = new HttpParams()
      .set('role', UserRole.Cliente)
      .set('excludeRole', UserRole.Admin)
      .set('limit', '20')
      .set('search', search);
    return this.http.get<User[]>(`${this.apiUrl}users`, { ...this.headers(), params });
  }

  createClient(payload: Partial<User> & { password: string }) {
    return this.http.post<User>(`${this.apiUrl}users`, { ...payload, role: UserRole.Cliente }, this.headers());
  }

  inviteClient(payload: Partial<User>) {
    return this.http.post<ClientInviteResponse>(`${this.apiUrl}users/invite-client`, payload, this.headers());
  }

  wallet() {
    return this.http.get<WalletSummary>(`${this.apiUrl}wallet`, this.headers());
  }

  profile() {
    return this.http.get<User>(`${this.apiUrl}users/me`, this.headers());
  }

  updateProfile(payload: Partial<User> & { password?: string; phoneOtp?: string }) {
    return this.http.put<User>(`${this.apiUrl}users/me`, payload, this.headers());
  }

  requestProfilePhoneOtp(phone: string) {
    return this.http.post<{ requested: boolean; phone: string; expiresInMinutes: number; devPhoneOtp?: string }>(
      `${this.apiUrl}users/me/request-phone-otp`,
      { phone },
      this.headers(),
    );
  }
}
