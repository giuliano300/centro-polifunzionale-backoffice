import { Component, ViewChild } from '@angular/core';
import { Spaces } from '../../../interfaces/spaces';
import { SpacesService } from '../../../services/Space.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../services/Booking.service';
import { BookingWithPayments } from '../../../interfaces/BookingWithPayments';
import { CustomDateFormatPipe } from "../../../services/custom-date-format.pipe";
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { FeathericonsModule } from "../../../icons/feathericons/feathericons.module";
import { MatSelect } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { UtilsService } from '../../../services/utils.service';
import { NgFor, NgIf } from '@angular/common';
import { ConfirmDialogComponent } from '../../../confirm-dialog/confirm-dialog.component';
import { CourseDialogComponent } from './course-dialog/course-dialog.component';
import { Course } from '../../../interfaces/courses';
import { CourseService } from '../../../services/Course.service';

@Component({
  selector: 'app-bookings',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    MatCheckboxModule,
    CustomDateFormatPipe,
    MatFormField,
    FeathericonsModule,
    MatLabel,
    MatSelect,
    MatOptionModule,
    ReactiveFormsModule,
    NgFor,
    NgIf
],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent {
 bookingWithPayments: BookingWithPayments[] = [];

 courses: Course[] = [];

 displayedColumns: string[] = ['name', 'date', 'startTime', 'endTime', 'status','amount', 'paymentStatus', 'course', 'delete'];

 dataSource = new MatTableDataSource<BookingWithPayments>(this.bookingWithPayments);

 @ViewChild(MatPaginator) paginator!: MatPaginator;

 spaceName = "";

 space: Spaces | null = null;

 form: FormGroup;

 months: any[] = [];

 years: any[] = [];

 year: number | null = null;

 month: number | null = null;

 id: string = "";

 constructor(
      private route: ActivatedRoute,
      private router: Router,
      private bookingService: BookingService,
      private spaceService: SpacesService,
      private dialog: MatDialog,
      private fb: FormBuilder,
      private utilService: UtilsService,
      private courseService: CourseService
  ) 
  {
     this.form = this.fb.group({
        month: [null],
        year: [null]
    });
  }

  onSubmit(){
      this.year = this.form.value.year;
      this.month = this.form.value.month;
      this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!);
  }

  gotoCalendar(){
      this.router.navigate(["/space/bookings-calendar/" + this.id + "/" + this.month + "/" + this.year]);
  }

  ngOnInit(): void {
    const queryMonth = Number(this.route.snapshot.queryParamMap.get('month'));
    const queryYear = Number(this.route.snapshot.queryParamMap.get('year'));

    this.year = queryYear || new Date().getFullYear();
    this.month = queryMonth || new Date().getMonth() + 1;

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
      this.getSpace(this.id!);
      this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!);
      this.getCourses();
    });


    this.years = [this.year - 1, this.year , this.year + 1];

    this.form.patchValue({ month: this.month, year: this.year });

    this.months = this.utilService.GetMonth();

  }

   getSpace(id: string){
        this.spaceService.getSpace(id)
        .subscribe((data: Spaces) => {
          if (!data) {
            console.log('Nessun dato disponibile');
          } else {
            this.space = data;
            this.spaceName = data.name;
        }
      });
   }

   getCourses(){
      this.courseService.getCourses()
        .subscribe((data: Course[]) => {
          this.courses = data;
        });
   }

   getBookings(id: string, year?: string, month?: string){
        this.bookingService.getBookings(id, year, month)
        .subscribe((data: BookingWithPayments[]) => {
          if (!data || data.length === 0) {
            this.dataSource.data = [];
            this.dataSource.paginator = this.paginator;            
            console.log('Nessun dato disponibile');
          } else {
            this.bookingWithPayments = data.map(c => ({
                ...c, 
                action: {
                    delete: 'ri-delete-bin-line'
                }
            }));;
            this.dataSource = new MatTableDataSource<BookingWithPayments>(this.bookingWithPayments);
            this.dataSource.paginator = this.paginator;
        }
    });

   }

    UpdateItem(item:Spaces){
      this.router.navigate(["/spaces/add/" + item._id]);
    }

    DeleteItem(item: BookingWithPayments){
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '500px'
      });

      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.bookingService.delete(item.booking._id)
            .subscribe(() => this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!));
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

    CreateCourse(item: BookingWithPayments){
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
          this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!);
        }
      });
    }


    gotoSpaces(){
      this.router.navigate(["/spaces"]);
    }
  }
