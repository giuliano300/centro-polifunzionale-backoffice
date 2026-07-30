import { Component, Inject } from '@angular/core';
import { NgFor, NgIf, NgStyle } from '@angular/common';
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
import { CourseTagService } from '../../../../services/CourseTag.service';

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
    NgStyle,
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
  availableTags: Array<{ value: string; label: string }> = [];
  isSaving = false;
  errorMessage = '';
  imageUploadError = '';
  imageUploadMessage = '';
  isUploadingImage = false;
  private cropDragStart: { type: 'banner' | 'card'; x: number; y: number; cropX: number; cropY: number; width: number; height: number } | null = null;
  subscribers: CourseBooking[] = [];
  isLoadingSubscribers = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private courseBookingService: CourseBookingService,
    private courseTagService: CourseTagService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CourseDialogData
  ) {
    const booking = data.bookingWithPayments.booking;
    const course = data.course;

    this.form = this.fb.group({
      title: [course?.title || booking.name || '', [Validators.required, Validators.maxLength(140)]],
      description: [course?.description || '', [Validators.maxLength(600)]],
      tags: [course?.tags || []],
      bannerImageUrl: [course?.bannerImageUrl || course?.imageUrl || ''],
      bannerImageCropX: [course?.bannerImageCrop?.x ?? course?.imageCrop?.x ?? 0],
      bannerImageCropY: [course?.bannerImageCrop?.y ?? course?.imageCrop?.y ?? 0],
      bannerImageCropScale: [course?.bannerImageCrop?.scale ?? course?.imageCrop?.scale ?? 1],
      cardImageUrl: [course?.cardImageUrl || course?.imageUrl || ''],
      cardImageCropX: [course?.cardImageCrop?.x ?? course?.imageCrop?.x ?? 0],
      cardImageCropY: [course?.cardImageCrop?.y ?? course?.imageCrop?.y ?? 0],
      cardImageCropScale: [course?.cardImageCrop?.scale ?? course?.imageCrop?.scale ?? 1],
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
    return this.data.bookingWithPayments.booking.space?.name || 'Stanza';
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

    this.loadTags();
  }

  private loadTags(): void {
    this.courseTagService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = tags.map((tag) => ({ value: tag.value, label: tag.label }));
      },
      error: () => {
        this.availableTags = [];
      },
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
      tags: this.form.value.tags || [],
      bannerImageUrl: this.form.value.bannerImageUrl || '',
      bannerImageCrop: {
        x: Number(this.form.value.bannerImageCropX || 0),
        y: Number(this.form.value.bannerImageCropY || 0),
        scale: Number(this.form.value.bannerImageCropScale || 1),
      },
      cardImageUrl: this.form.value.cardImageUrl || '',
      cardImageCrop: {
        x: Number(this.form.value.cardImageCropX || 0),
        y: Number(this.form.value.cardImageCropY || 0),
        scale: Number(this.form.value.cardImageCropScale || 1),
      },
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

  onCourseImageSelected(event: Event, type: 'banner' | 'card'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.imageUploadError = '';
    this.imageUploadMessage = '';

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.imageUploadError = 'Formato immagine non valido. Usa JPG, PNG o WEBP.';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = async () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      const minWidth = type === 'card' ? 600 : 1200;
      const minHeight = 800;
      if (width < minWidth || height < minHeight) {
        this.imageUploadError = `Immagine troppo piccola. Carica una foto almeno ${minWidth}x${minHeight} px.`;
        return;
      }

      try {
        const optimized = await this.optimizeImageFile(image, file.name, type);
        this.uploadCourseImage(optimized, width, height, type);
      } catch {
        this.imageUploadError = 'Immagine non ridimensionata.';
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.imageUploadError = 'Immagine non leggibile.';
    };
    image.src = objectUrl;
  }

  courseImagePreviewUrl(type: 'banner' | 'card'): string {
    return this.courseService.mediaUrl(type === 'banner' ? this.form.value.bannerImageUrl : this.form.value.cardImageUrl);
  }

  cropImageStyle(type: 'banner' | 'card'): Record<string, string> {
    const prefix = type === 'banner' ? 'bannerImage' : 'cardImage';
    return {
      transform: `translate(${Number(this.form.value[`${prefix}CropX`] || 0)}%, ${Number(this.form.value[`${prefix}CropY`] || 0)}%) scale(${Number(this.form.value[`${prefix}CropScale`] || 1)})`,
    };
  }

  startImageCropDrag(event: PointerEvent, type: 'banner' | 'card'): void {
    if (!this.courseImagePreviewUrl(type)) {
      return;
    }

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    const prefix = type === 'banner' ? 'bannerImage' : 'cardImage';
    this.cropDragStart = {
      type,
      x: event.clientX,
      y: event.clientY,
      cropX: Number(this.form.value[`${prefix}CropX`] || 0),
      cropY: Number(this.form.value[`${prefix}CropY`] || 0),
      width: target.clientWidth || 1,
      height: target.clientHeight || 1,
    };
  }

  moveImageCrop(event: PointerEvent): void {
    if (!this.cropDragStart) {
      return;
    }

    const deltaX = ((event.clientX - this.cropDragStart.x) / this.cropDragStart.width) * 100;
    const deltaY = ((event.clientY - this.cropDragStart.y) / this.cropDragStart.height) * 100;
    const prefix = this.cropDragStart.type === 'banner' ? 'bannerImage' : 'cardImage';
    this.form.patchValue({
      [`${prefix}CropX`]: this.clampCrop(this.cropDragStart.cropX + deltaX),
      [`${prefix}CropY`]: this.clampCrop(this.cropDragStart.cropY + deltaY),
    });
  }

  endImageCropDrag(): void {
    this.cropDragStart = null;
  }

  setImageScale(event: Event, type: 'banner' | 'card'): void {
    const prefix = type === 'banner' ? 'bannerImage' : 'cardImage';
    this.form.patchValue({ [`${prefix}CropScale`]: Number((event.target as HTMLInputElement).value || 1) });
  }

  imageScaleValue(type: 'banner' | 'card'): number {
    return Number(type === 'banner' ? this.form.value.bannerImageCropScale || 1 : this.form.value.cardImageCropScale || 1);
  }

  resetImageCrop(type: 'banner' | 'card'): void {
    const url = type === 'banner' ? this.form.value.bannerImageUrl || '' : this.form.value.cardImageUrl || '';
    this.patchImageControls(type, url, 0, 0, 1);
  }

  removeCourseImage(type: 'banner' | 'card'): void {
    this.patchImageControls(type, '', 0, 0, 1);
    this.imageUploadError = '';
    this.imageUploadMessage = '';
  }

  private uploadCourseImage(file: File, width: number, height: number, type: 'banner' | 'card'): void {
    this.isUploadingImage = true;
    this.courseService.uploadCourseImage(file, type).subscribe({
      next: (result) => {
        this.patchImageControls(type, result.imageUrl, 0, 0, 1);
        this.imageUploadMessage = `${type === 'banner' ? 'Banner' : 'Box'} caricato (${width}x${height}px).`;
        this.isUploadingImage = false;
      },
      error: (error) => {
        this.imageUploadError = error?.error?.message || 'Immagine non caricata.';
        this.isUploadingImage = false;
      },
    });
  }

  private optimizeImageFile(image: HTMLImageElement, originalName: string, type: 'banner' | 'card'): Promise<File> {
    const minWidth = type === 'banner' ? 1200 : 600;
    const minHeight = 800;
    const maxWidth = type === 'banner' ? 2400 : 1200;
    const maxHeight = type === 'banner' ? 1600 : 1600;
    const maxRatio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
    const minRatio = Math.max(minWidth / image.naturalWidth, minHeight / image.naturalHeight);
    const ratio = Math.min(1, Math.max(maxRatio, minRatio));
    const width = Math.round(image.naturalWidth * ratio);
    const height = Math.round(image.naturalHeight * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      return Promise.reject();
    }

    context.drawImage(image, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject();
          return;
        }

        const name = originalName.replace(/\.[^.]+$/, '') || 'course-image';
        resolve(new File([blob], `${name}.jpg`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.86);
    });
  }

  private patchImageControls(type: 'banner' | 'card', url: string, x: number, y: number, scale: number): void {
    const prefix = type === 'banner' ? 'bannerImage' : 'cardImage';
    this.form.patchValue({
      [`${prefix}Url`]: url,
      [`${prefix}CropX`]: x,
      [`${prefix}CropY`]: y,
      [`${prefix}CropScale`]: scale,
    });
  }

  private clampCrop(value: number): number {
    return Math.max(-50, Math.min(50, Math.round(value * 10) / 10));
  }
}
