import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { Bookings } from '../../interfaces/bookings';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';

@Component({
  selector: 'app-courses',
  imports: [MatCardModule, MatButtonModule, MatPaginatorModule, MatTableModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent {
  displayedColumns: string[] = ['title', 'space', 'date', 'time', 'capacity', 'enrollmentType', 'price', 'isPublished', 'subscribers', 'edit', 'delete'];
  dataSource = new MatTableDataSource<Course>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private courseService: CourseService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCourses();
  }

  getCourses(): void {
    this.courseService.getCourses().subscribe((data: Course[]) => {
      this.dataSource = new MatTableDataSource<Course>(data);
      this.dataSource.paginator = this.paginator;
    });
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
      width: '720px',
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
      width: '500px'
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
}
