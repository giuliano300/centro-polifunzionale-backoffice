import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { Bookings } from '../../interfaces/bookings';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

@Component({
  selector: 'app-courses',
  imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatPaginatorModule, MatSelectModule, MatTableModule, FeathericonsModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent {
  displayedColumns: string[] = ['title', 'space', 'date', 'time', 'capacity', 'enrollmentType', 'price', 'isPublished', 'subscribers', 'edit', 'delete'];
  dataSource = new MatTableDataSource<Course>([]);
  courses: Course[] = [];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private courseService: CourseService,
    private dialog: MatDialog,
    private router: Router,
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
    this.getCourses();
  }

  getCourses(): void {
    const dateRange = this.getSelectedDateRange();
    this.courseService.getCourses({
      start: dateRange.start,
      end: dateRange.end,
      status: this.filterForm.value.status,
      search: this.filterForm.value.search
    }).subscribe((data: Course[]) => {
      this.courses = data;
      this.dataSource = new MatTableDataSource<Course>(this.courses);
      this.dataSource.paginator = this.paginator;
    });
  }

  applyFilters(): void {
    this.getCourses();
  }

  resetFilters(): void {
    this.filterForm.patchValue({ startDate: this.getTodayDate(), endDate: this.getTodayDate(), search: '', status: '' });
    this.applyFilters();
  }

  getBooking(course: Course): Bookings | null {
    return typeof course.booking === 'string' ? null : course.booking;
  }

  getDate(course: Course): string {
    return new Date(course.date).toLocaleDateString('it-IT');
  }

  updateItem(course: Course): void {
    const booking = this.getBooking(course);
    if (!booking) {
      return;
    }

    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw',
      data: {
        bookingWithPayments: { booking, payments: [] },
        course
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCourses();
      }
    });
  }

  deleteItem(course: Course): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.courseService.delete(course._id).subscribe(() => this.getCourses());
      }
    });
  }

  showSubscribers(course: Course): void {
    this.router.navigate(['/course-bookings'], {
      queryParams: { courseId: course._id, courseTitle: course.title }
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
}
