import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { BookingWithPayments } from '../../interfaces/BookingWithPayments';
import { CustomDateFormatPipe } from '../../services/custom-date-format.pipe';
import { BookingService } from '../../services/Booking.service';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';
import { NgIf } from '@angular/common';

type BookingRow = BookingWithPayments & { action: { delete: string } };

@Component({
  selector: 'app-bookings-list',
  imports: [NgIf, MatButtonModule, MatCardModule, MatPaginatorModule, MatTableModule, CustomDateFormatPipe],
  templateUrl: './bookings-list.component.html',
  styleUrl: './bookings-list.component.scss'
})
export class BookingsListComponent {
  displayedColumns: string[] = ['name', 'user', 'space', 'date', 'startTime', 'endTime', 'status', 'amount', 'course', 'delete'];
  dataSource = new MatTableDataSource<BookingRow>([]);
  courses: Course[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private bookingService: BookingService,
    private courseService: CourseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getBookings();
    this.getCourses();
  }

  getBookings(): void {
    this.bookingService.getAllBookings().subscribe((data: BookingWithPayments[]) => {
      this.dataSource = new MatTableDataSource<BookingRow>(
        data.map((item) => ({
          ...item,
          action: { delete: 'ri-delete-bin-line' }
        }))
      );
      this.dataSource.paginator = this.paginator;
    });
  }

  getCourses(): void {
    this.courseService.getCourses().subscribe((data: Course[]) => {
      this.courses = data;
    });
  }

  DeleteItem(item: BookingRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.bookingService.delete(item.booking._id).subscribe(() => this.getBookings());
      }
    });
  }

  IsPaid(item: BookingWithPayments): boolean {
    return item.payments?.some(payment => payment.status === 'PAID') || false;
  }

  IsFutureOrToday(item: BookingWithPayments): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(item.booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    return bookingDate >= today;
  }

  CanCreateCourse(item: BookingWithPayments): boolean {
    return this.IsPaid(item) && this.IsFutureOrToday(item);
  }

  GetCourse(item: BookingWithPayments): Course | undefined {
    return this.courses.find((course) => this.GetCourseBookingId(course) === item.booking._id);
  }

  GetCourseBookingId(course: Course): string | null {
    if (!course.booking) {
      return null;
    }

    return typeof course.booking === 'string' ? course.booking : course.booking._id;
  }

  CanShowCourseAction(item: BookingWithPayments): boolean {
    return !!this.GetCourse(item) || this.CanCreateCourse(item);
  }

  CreateCourse(item: BookingWithPayments): void {
    const course = this.GetCourse(item);
    if (!course && !this.CanCreateCourse(item)) {
      return;
    }

    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '680px',
      data: {
        bookingWithPayments: item,
        course
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.getCourses();
        this.getBookings();
      }
    });
  }
}
