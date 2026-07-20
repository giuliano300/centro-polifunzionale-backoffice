import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BookingWithPayments } from '../../../../interfaces/BookingWithPayments';
import { CourseService } from '../../../../services/Course.service';
import { Course, CreateCourse } from '../../../../interfaces/courses';
import { CourseBooking } from '../../../../interfaces/course-bookings';
import { CourseBookingService } from '../../../../services/CourseBooking.service';
import { AddCourseSubscriberDialogComponent } from '../../../course-bookings/add-course-subscriber-dialog/add-course-subscriber-dialog.component';
import { ConfirmDialogComponent } from '../../../../confirm-dialog/confirm-dialog.component';

export interface CourseDialogData {
  bookingWithPayments: BookingWithPayments;
  course?: Course;
}

@Component({
  selector: 'app-course-dialog',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule
  ],
  templateUrl: './course-dialog.component.html',
  styleUrl: './course-dialog.component.scss'
})
export class CourseDialogComponent {
  form: FormGroup;
  isSaving = false;
  errorMessage = '';
  subscribers: CourseBooking[] = [];
  isLoadingSubscribers = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private courseBookingService: CourseBookingService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CourseDialogData
  ) {
    const booking = data.bookingWithPayments.booking;
    const course = data.course;

    this.form = this.fb.group({
      title: [course?.title || booking.name || '', [Validators.required, Validators.maxLength(140)]],
      description: [course?.description || '', [Validators.maxLength(600)]],
      capacity: [course?.capacity || 10, [Validators.required, Validators.min(1)]],
      enrollmentType: [course?.enrollmentType || 'free', [Validators.required]],
      price: [course?.price || 0, [Validators.min(0)]],
      isPublished: [course?.isPublished ?? true]
    });

    this.loadSubscribers();
  }

  get isEditMode(): boolean {
    return !!this.data.course;
  }

  get bookingDate(): string {
    return new Date(this.data.bookingWithPayments.booking.date).toLocaleDateString('it-IT');
  }

  get bookingTime(): string {
    const booking = this.data.bookingWithPayments.booking;
    return `${booking.startTime} - ${booking.endTime}`;
  }

  get spaceName(): string {
    return this.data.bookingWithPayments.booking.space?.name || 'Spazio';
  }

  get isPaidCourse(): boolean {
    return this.form.value.enrollmentType === 'paid';
  }

  get courseId(): string {
    return this.data.course?._id || '';
  }

  get canManageSubscribers(): boolean {
    return !!this.courseId;
  }

  loadSubscribers(): void {
    if (!this.courseId) {
      this.subscribers = [];
      return;
    }

    this.isLoadingSubscribers = true;
    this.courseBookingService.getCourseBookings({ courseId: this.courseId }).subscribe({
      next: (items) => {
        this.subscribers = items;
        this.isLoadingSubscribers = false;
      },
      error: () => {
        this.errorMessage = 'Caricamento iscritti non riuscito.';
        this.isLoadingSubscribers = false;
      }
    });
  }

  addSubscriber(): void {
    if (!this.courseId) {
      return;
    }

    const dialogRef = this.dialog.open(AddCourseSubscriberDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw',
      data: { courseId: this.courseId }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSubscribers();
      }
    });
  }

  deleteSubscriber(item: CourseBooking): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.courseBookingService.deleteCourseBooking(item._id).subscribe(() => this.loadSubscribers());
      }
    });
  }

  getSubscriberName(item: CourseBooking): string {
    return typeof item.user === 'string' ? '-' : item.user.name || '-';
  }

  getSubscriberEmail(item: CourseBooking): string {
    return typeof item.user === 'string' ? '-' : item.user.email || '-';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      confirmed: 'Confermata',
      cancellation_requested: 'Richiesta annullamento',
      cancelled: 'Annullata'
    };

    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Da pagare',
      PAID: 'Pagato',
      FAILED: 'Fallito',
      FREE: 'Gratuito'
    };

    return labels[status] || status;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  }

  totalSubscriberAmount(item: CourseBooking): number {
    return item.totalAmount || ((item.amount || 0) + (item.walletAmount || 0));
  }

  submit(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    const enrollmentType = this.form.value.enrollmentType;
    const price = enrollmentType === 'free' ? 0 : Number(this.form.value.price);

    if (enrollmentType === 'paid' && price <= 0) {
      this.errorMessage = 'Per un corso a pagamento inserisci un prezzo maggiore di zero.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload: CreateCourse = {
      title: this.form.value.title,
      description: this.form.value.description || '',
      date: this.data.bookingWithPayments.booking.date,
      startTime: this.data.bookingWithPayments.booking.startTime,
      endTime: this.data.bookingWithPayments.booking.endTime,
      booking: this.data.bookingWithPayments.booking._id,
      capacity: Number(this.form.value.capacity),
      enrollmentType,
      price,
      isPublished: this.form.value.isPublished
    };

    const request = this.data.course
      ? this.courseService.update(this.data.course._id, payload)
      : this.courseService.create(payload);

    request.subscribe({
      next: (course) => this.dialogRef.close(course),
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Salvataggio corso non riuscito.';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
