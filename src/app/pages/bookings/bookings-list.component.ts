import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { BookingWithPayments } from '../../interfaces/BookingWithPayments';
import { CustomDateFormatPipe } from '../../services/custom-date-format.pipe';
import { BookingService } from '../../services/Booking.service';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';
import { NgIf } from '@angular/common';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

type BookingRow = BookingWithPayments & { action: { delete: string } };

@Component({
  selector: 'app-bookings-list',
  imports: [NgIf, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatPaginatorModule, MatTableModule, CustomDateFormatPipe, FeathericonsModule],
  templateUrl: './bookings-list.component.html',
  styleUrl: './bookings-list.component.scss'
})
export class BookingsListComponent {
  displayedColumns: string[] = ['name', 'user', 'space', 'date', 'startTime', 'endTime', 'status', 'amount', 'course', 'delete'];
  dataSource = new MatTableDataSource<BookingRow>([]);
  bookings: BookingRow[] = [];
  courses: Course[] = [];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private bookingService: BookingService,
    private courseService: CourseService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      startDate: [this.getTodayDate()],
      endDate: [this.getTodayDate()],
      search: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.getBookings();
    this.getCourses();
  }

  getBookings(): void {
    const dateRange = this.getSelectedDateRange();
    this.bookingService.getAllBookings({
      start: dateRange.start,
      end: dateRange.end,
      status: this.filterForm.value.status,
      search: this.filterForm.value.search
    }).subscribe((data: BookingWithPayments[]) => {
      this.bookings = data.map((item) => ({
          ...item,
          action: { delete: 'ri-delete-bin-line' }
        }));
      this.dataSource = new MatTableDataSource<BookingRow>(this.bookings);
      this.dataSource.paginator = this.paginator;
    });
  }

  applyFilters(): void {
    this.getBookings();
  }

  resetFilters(): void {
    this.filterForm.patchValue({ startDate: this.getTodayDate(), endDate: this.getTodayDate(), search: '', status: '' });
    this.applyFilters();
  }

  getCourses(): void {
    this.courseService.getCourses().subscribe((data: Course[]) => {
      this.courses = data;
    });
  }

  DeleteItem(item: BookingRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.bookingService.delete(item.booking._id).subscribe(() => this.getBookings());
      }
    });
  }

  private getToday(): string {
    return this.toDateInputValue(new Date());
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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

  private toDateInputValue(value: string | Date): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw',
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
