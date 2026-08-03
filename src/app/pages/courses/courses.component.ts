import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ActivatedRoute, Router } from '@angular/router';
import { Bookings } from '../../interfaces/bookings';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';
import { UsersService } from '../../services/User.service';
import { AuthUser } from '../../interfaces/auth-user';
import { UserRole } from '../../interfaces/roles/roles';

@Component({
  selector: 'app-courses',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatPaginatorModule, MatSelectModule, MatTableModule, FeathericonsModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent {
  displayedColumns: string[] = ['title', 'manager', 'space', 'date', 'time', 'capacity', 'enrollmentType', 'price', 'isPublished', 'approval', 'subscribers', 'edit', 'delete'];
  dataSource = new MatTableDataSource<Course>([]);
  courses: Course[] = [];
  managers: AuthUser[] = [];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private courseService: CourseService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private usersService: UsersService
  ) {
    const defaultRange = this.getCurrentMonthRange();
    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      search: [''],
      status: [''],
      managerId: ['']
    });
  }

  ngOnInit(): void {
    this.applyQueryDateSelection();
    this.getCourses();
    this.usersService.getUsers('', UserRole.Gestore).subscribe((users) => this.managers = users);
  }

  getCourses(): void {
    const dateRange = this.getSelectedDateRange();
    this.courseService.getCourses({
      start: dateRange.start,
      end: dateRange.end,
      status: this.filterForm.value.status,
      search: this.filterForm.value.search,
      managerId: this.filterForm.value.managerId
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
    const defaultRange = this.getCurrentMonthRange();
    this.filterForm.patchValue({ startDate: defaultRange.startDate, endDate: defaultRange.endDate, search: '', status: '', managerId: '' });
    this.applyFilters();
  }

  getBooking(course: Course): Bookings | null {
    return typeof course.booking === 'string' ? null : course.booking;
  }

  getManagerName(course: Course): string {
    const user = this.getBooking(course)?.user;
    return user?.name || user?.email || '-';
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
      width: '1180px',
      minWidth: 'min(1040px, 96vw)',
      maxWidth: '96vw',
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

  approveItem(course: Course): void {
    this.courseService.approve(course._id).subscribe(() => this.getCourses());
  }

  closeItem(course: Course): void {
    this.courseService.close(course._id).subscribe(() => this.getCourses());
  }

  rejectItem(course: Course): void {
    this.courseService.reject(course._id).subscribe(() => this.getCourses());
  }

  approvalLabel(course: Course): string {
    if (course.approvalStatus === 'pending') {
      return 'In approvazione';
    }
    if (course.approvalStatus === 'rejected') {
      return 'Respinto';
    }
    return course.isPublished ? 'Approvato' : 'Chiuso';
  }

  canApprove(course: Course): boolean {
    return course.approvalStatus !== 'approved' || !course.isPublished;
  }

  canClose(course: Course): boolean {
    return course.approvalStatus === 'approved' && course.isPublished;
  }

  canReject(course: Course): boolean {
    return course.approvalStatus !== 'rejected';
  }

  showSubscribers(course: Course): void {
    this.router.navigate(['/course-bookings'], {
      queryParams: { courseId: course._id, courseTitle: course.title }
    });
  }

  private getToday(): string {
    return this.toDateInputValue(new Date());
  }

  private getCurrentMonthRange(reference = new Date()): { startDate: Date; endDate: Date } {
    const startDate = new Date(reference.getFullYear(), reference.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
    endDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  private applyQueryDateSelection(): void {
    const params = this.route.snapshot.queryParamMap;
    const month = Number(params.get('month'));
    const year = Number(params.get('year'));

    if (Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) && year > 1900) {
      const range = this.getCurrentMonthRange(new Date(year, month - 1, 1));
      this.filterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
      return;
    }

    const start = this.parseDateParam(params.get('start'));
    const end = this.parseDateParam(params.get('end'));
    if (start || end) {
      this.filterForm.patchValue({
        startDate: start || end,
        endDate: end || start
      });
    }
  }

  private parseDateParam(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
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
