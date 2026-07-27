import { Component, ViewChild } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthUser } from '../../interfaces/auth-user';
import { Bookings } from '../../interfaces/bookings';
import { CourseBooking } from '../../interfaces/course-bookings';
import { Course } from '../../interfaces/courses';
import { CourseBookingService } from '../../services/CourseBooking.service';
import { CourseService } from '../../services/Course.service';
import { AddCourseSubscriberDialogComponent } from './add-course-subscriber-dialog/add-course-subscriber-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

@Component({
  selector: 'app-course-bookings',
  imports: [NgClass, NgFor, NgIf, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatOptionModule, MatPaginatorModule, MatSelectModule, MatTableModule, FeathericonsModule],
  templateUrl: './course-bookings.component.html',
  styleUrl: './course-bookings.component.scss'
})
export class CourseBookingsComponent {
  displayedColumns: string[] = ['user', 'email', 'space', 'date', 'status', 'amount', 'paymentStatus', 'createdAt', 'delete'];
  dataSource = new MatTableDataSource<CourseBooking>([]);
  courseId = '';
  selectedCourseName = '';
  courseDetails: Course | null = null;
  courses: Course[] = [];
  filterForm: FormGroup;
  isPaymentsMode = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private courseBookingService: CourseBookingService,
    private courseService: CourseService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    const defaultRange = this.getCurrentMonthRange();
    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      courseId: [''],
      paymentStatus: ['']
    });
  }

  ngOnInit(): void {
    this.isPaymentsMode = this.route.snapshot.data['mode'] === 'payments';
    if (this.isPaymentsMode) {
      this.loadCourses();
    }

    this.route.queryParamMap.subscribe((params) => {
      this.courseId = params.get('courseId') || '';
      this.selectedCourseName = params.get('courseTitle') || '';
      if (this.courseId) {
        this.filterForm.patchValue({ courseId: this.courseId }, { emitEvent: false });
      }
      this.loadCourseDetails();
      this.getCourseBookings();
    });
  }

  loadCourses(): void {
    const dateRange = this.getSelectedDateRange();
    this.courseService.getCourses({
      start: dateRange.start,
      end: dateRange.end,
    }).subscribe((courses) => {
      this.courses = courses;
      const selectedCourseId = this.filterForm.value.courseId;
      if (selectedCourseId && !courses.some((course) => course._id === selectedCourseId)) {
        this.filterForm.patchValue({ courseId: '' }, { emitEvent: false });
      }
    });
  }

  loadCourseDetails(): void {
    this.courseDetails = null;
    if (!this.courseId) {
      return;
    }

    this.courseService.getCourse(this.courseId).subscribe((course) => {
      this.courseDetails = course;
      this.selectedCourseName = course.title || this.selectedCourseName;
    });
  }

  getCourseBookings(): void {
    const dateRange = this.isPaymentsMode ? this.getSelectedDateRange() : {};
    const selectedCourseId = this.isPaymentsMode ? this.filterForm.value.courseId : this.courseId;
    this.courseBookingService.getCourseBookings({
      courseId: selectedCourseId,
      paymentStatus: this.isPaymentsMode ? this.filterForm.value.paymentStatus : undefined,
      start: dateRange.start,
      end: dateRange.end,
    }).subscribe((data: CourseBooking[]) => {
      this.dataSource = new MatTableDataSource<CourseBooking>(data);
      this.dataSource.paginator = this.paginator;
      if (data.length) {
        this.courseDetails = this.getCourse(data[0]) || this.courseDetails;
        this.selectedCourseName = this.courseDetails?.title || this.selectedCourseName;
      }
    });
  }

  applyFilters(): void {
    if (this.isPaymentsMode) {
      this.loadCourses();
    }
    this.getCourseBookings();
  }

  resetFilters(): void {
    const defaultRange = this.getCurrentMonthRange();
    this.filterForm.patchValue({ startDate: defaultRange.startDate, endDate: defaultRange.endDate, courseId: '', paymentStatus: '' });
    this.getCourseBookings();
  }

  pageTitle(): string {
    if (this.isPaymentsMode) {
      return 'Pagamenti corsi';
    }

    return this.selectedCourseName ? 'Iscritti - ' + this.selectedCourseName : 'Iscritti corsi';
  }

  pageDescription(): string {
    return this.isPaymentsMode
      ? 'Verifica i pagamenti delle iscrizioni ai corsi, con importi, wallet usato e metodo di pagamento.'
      : 'Consulta gli iscritti ai corsi, i dati del partecipante, lo stato dell iscrizione e gli eventuali pagamenti.';
  }

  getUser(item: CourseBooking): AuthUser | null {
    return typeof item.user === 'string' ? null : item.user;
  }

  getCourse(item: CourseBooking): Course | null {
    return typeof item.course === 'string' ? null : item.course;
  }

  getBooking(item: CourseBooking): Bookings | null {
    const course = this.getCourse(item);
    if (!course || typeof course.booking === 'string') {
      return null;
    }

    return course.booking;
  }

  getSummaryBooking(): Bookings | null {
    if (!this.courseDetails || typeof this.courseDetails.booking === 'string') {
      return null;
    }

    return this.courseDetails.booking;
  }

  getSummaryDate(): string {
    if (!this.courseDetails?.date) {
      return '-';
    }

    return new Date(this.courseDetails.date).toLocaleDateString('it-IT');
  }

  getEnrollmentLabel(): string {
    if (!this.courseDetails) {
      return '-';
    }

    return this.courseDetails.enrollmentType === 'paid' ? 'Acquisto' : 'Prenotazione gratuita';
  }

  getCourseDate(item: CourseBooking): string {
    const course = this.getCourse(item);
    if (!course?.date) {
      return '-';
    }

    return new Date(course.date).toLocaleDateString('it-IT');
  }

  getCreatedAt(item: CourseBooking): string {
    if (!item.createdAt) {
      return '-';
    }

    return new Date(item.createdAt).toLocaleDateString('it-IT');
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

  totalAmount(item: CourseBooking): number {
    return item.totalAmount || ((item.amount || 0) + (item.walletAmount || 0));
  }

  walletAmount(item: CourseBooking): number {
    return item.walletAmount || 0;
  }

  externalAmount(item: CourseBooking): number {
    return item.externalAmount || item.amount || 0;
  }

  paymentMethodLabel(item: CourseBooking): string {
    if (this.externalAmount(item) <= 0) {
      return 'Nessun pagamento aggiuntivo';
    }

    const labels: Record<string, string> = {
      cash: 'Contanti',
      stripe: 'Stripe',
      paypal: 'PayPal',
      nexi: 'Nexi'
    };
    return labels[String(item.paymentMethod || '').toLowerCase()] || 'Pagamento da completare';
  }

  private getCurrentMonthRange(reference = new Date()): { startDate: Date; endDate: Date } {
    const startDate = new Date(reference.getFullYear(), reference.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
    endDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  private getSelectedDateRange(): { start?: string; end?: string } {
    const startDate = this.filterForm.value.startDate;
    const endDate = this.filterForm.value.endDate || startDate;
    if (!startDate && !endDate) {
      return {};
    }

    const start = startDate instanceof Date ? new Date(startDate) : new Date(`${startDate}T00:00:00`);
    start.setHours(0, 0, 0, 0);
    const end = endDate instanceof Date ? new Date(endDate) : new Date(`${endDate}T00:00:00`);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
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
        this.getCourseBookings();
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
        this.courseBookingService.deleteCourseBooking(item._id).subscribe(() => this.getCourseBookings());
      }
    });
  }
}
