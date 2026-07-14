import { Component, ViewChild } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthUser } from '../../interfaces/auth-user';
import { Bookings } from '../../interfaces/bookings';
import { CourseBooking } from '../../interfaces/course-bookings';
import { Course } from '../../interfaces/courses';
import { CourseBookingService } from '../../services/CourseBooking.service';
import { CourseService } from '../../services/Course.service';
import { AddCourseSubscriberDialogComponent } from './add-course-subscriber-dialog/add-course-subscriber-dialog.component';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-course-bookings',
  imports: [NgClass, NgIf, MatButtonModule, MatCardModule, MatPaginatorModule, MatTableModule],
  templateUrl: './course-bookings.component.html',
  styleUrl: './course-bookings.component.scss'
})
export class CourseBookingsComponent {
  displayedColumns: string[] = ['user', 'email', 'space', 'date', 'status', 'amount', 'paymentStatus', 'createdAt', 'delete'];
  dataSource = new MatTableDataSource<CourseBooking>([]);
  courseId = '';
  selectedCourseName = '';
  courseDetails: Course | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private courseBookingService: CourseBookingService,
    private courseService: CourseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.courseId = params.get('courseId') || '';
      this.selectedCourseName = params.get('courseTitle') || '';
      this.loadCourseDetails();
      this.getCourseBookings();
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
    this.courseBookingService.getCourseBookings({ courseId: this.courseId }).subscribe((data: CourseBooking[]) => {
      this.dataSource = new MatTableDataSource<CourseBooking>(data);
      this.dataSource.paginator = this.paginator;
      if (data.length) {
        this.courseDetails = this.getCourse(data[0]) || this.courseDetails;
        this.selectedCourseName = this.courseDetails?.title || this.selectedCourseName;
      }
    });
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
      cancelled: 'Annullata'
    };

    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Da pagare',
      PAID: 'Pagato',
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
