import { Component, Inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BookingWithPayments } from '../../../../interfaces/BookingWithPayments';
import { CourseService } from '../../../../services/Course.service';
import { Course, CreateCourse } from '../../../../interfaces/courses';

export interface CourseDialogData {
  bookingWithPayments: BookingWithPayments;
  course?: Course;
}

@Component({
  selector: 'app-course-dialog',
  standalone: true,
  imports: [
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

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
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
