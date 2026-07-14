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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../services/Booking.service';
import { BookingWithPayments } from '../../../interfaces/BookingWithPayments';
import { CustomDateFormatPipe } from "../../../services/custom-date-format.pipe";
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { FeathericonsModule } from "../../../icons/feathericons/feathericons.module";
import { MatNativeDateModule } from "@angular/material/core";
import { NgIf } from '@angular/common';
import { ConfirmDialogComponent } from '../../../confirm-dialog/confirm-dialog.component';
import { CourseDialogComponent } from './course-dialog/course-dialog.component';
import { Course } from '../../../interfaces/courses';
import { CourseService } from '../../../services/Course.service';
import { BookingDialogComponent } from './booking-dialog/booking-dialog.component';
import { PaymentService } from '../../../services/Payment.service';

@Component({
  selector: 'app-bookings',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    CustomDateFormatPipe,
    MatFormField,
    FeathericonsModule,
    MatLabel,
    ReactiveFormsModule,
    NgIf
],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent {
 bookingWithPayments: BookingWithPayments[] = [];

 courses: Course[] = [];

 displayedColumns: string[] = ['name', 'date', 'startTime', 'endTime', 'status','amount', 'paymentStatus', 'pay', 'course', 'delete'];

 dataSource = new MatTableDataSource<BookingWithPayments>(this.bookingWithPayments);

 @ViewChild(MatPaginator) paginator!: MatPaginator;

 spaceName = "";

 space: Spaces | null = null;

 form: FormGroup;

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
      private courseService: CourseService,
      private paymentService: PaymentService
  ) 
  {
     this.form = this.fb.group({
        startDate: [this.getTodayDate()],
        endDate: [this.getTodayDate()]
    });
  }

  onSubmit(){
      const startDate = this.form.value.startDate || this.getTodayDate();
      this.year = new Date(startDate).getFullYear();
      this.month = new Date(startDate).getMonth() + 1;
      this.getBookings(this.id!);
  }

  resetFilters(): void {
      const today = this.getTodayDate();
      this.form.patchValue({
        startDate: today,
        endDate: today
      });
      this.year = today.getFullYear();
      this.month = today.getMonth() + 1;
      this.getBookings(this.id!);
  }

  gotoCalendar(){
      this.router.navigate(["/space/bookings-calendar/" + this.id + "/" + this.month + "/" + this.year]);
  }

  ngOnInit(): void {
    const queryMonth = Number(this.route.snapshot.queryParamMap.get('month'));
    const queryYear = Number(this.route.snapshot.queryParamMap.get('year'));

    const initialRange = queryMonth && queryYear
      ? this.getMonthDateRange(queryYear, queryMonth)
      : { startDate: this.getTodayDate(), endDate: this.getTodayDate() };

    this.year = queryYear || initialRange.startDate.getFullYear();
    this.month = queryMonth || initialRange.startDate.getMonth() + 1;

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
      this.getSpace(this.id!);
      this.getBookings(this.id!);
      this.getCourses();
    });

    this.form.patchValue(initialRange);
  }

   getSpace(id: string){
        this.spaceService.getSpace(id)
        .subscribe((data: Spaces) => {
          if (data) {
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

   getBookings(id: string){
        const range = this.getSelectedDateRange();
        this.bookingService.getBookings(id, undefined, undefined, range.start, range.end)
        .subscribe((data: BookingWithPayments[]) => {
          if (!data || data.length === 0) {
            this.dataSource.data = [];
            this.dataSource.paginator = this.paginator;            
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
        width: '860px',
        minWidth: 'min(800px, 94vw)',
        maxWidth: '94vw'
      });

      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.bookingService.delete(item.booking._id)
            .subscribe(() => this.getBookings(this.id!));
        }
      });
    }

    IsPaid(item: BookingWithPayments): boolean {
      return item.payments?.some(payment => payment.status === 'PAID') || false;
    }

    GetPendingAmount(item: BookingWithPayments): number {
      const paid = item.payments?.find(payment => payment.status === 'PAID');
      const pending = item.payments?.find(payment => payment.status === 'PENDING');
      return paid?.amount || pending?.amount || 0;
    }

    GetPaymentStatus(item: BookingWithPayments): string {
      if (item.payments?.some(payment => payment.status === 'PAID')) {
        return 'Pagato';
      }
      if (item.payments?.some(payment => payment.status === 'PENDING')) {
        return 'Da pagare';
      }
      if (item.payments?.some(payment => payment.status === 'FAILED')) {
        return 'Fallito';
      }
      return 'N/A';
    }

    GetBookingStatusLabel(item: BookingWithPayments): string {
      const labels: Record<string, string> = {
        pending: 'In attesa',
        confirmed: 'Confermata',
        cancelled: 'Annullata'
      };
      return labels[item.booking.status] || item.booking.status;
    }

    RegisterPayment(item: BookingWithPayments): void {
      const amount = this.GetPendingAmount(item);
      if (!amount || this.IsPaid(item)) {
        return;
      }

      this.paymentService.create({
        bookingId: item.booking._id,
        amount,
        status: 'PAID',
        method: 'manual',
        transactionId: `MANUAL-${Date.now()}`
      }).subscribe(() => this.getBookings(this.id!));
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
          this.getBookings(this.id!);
        }
      });
    }

    CreateBooking(): void {
      if (!this.space) {
        return;
      }

      const dialogRef = this.dialog.open(BookingDialogComponent, {
        width: '860px',
        minWidth: 'min(800px, 94vw)',
        maxWidth: '94vw',
        data: { space: this.space }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.getBookings(this.id!);
        }
      });
    }


    gotoSpaces(){
      this.router.navigate(["/spaces"]);
    }

    private getTodayDate(): Date {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    private getMonthDateRange(year: number, month: number): { startDate: Date; endDate: Date } {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      return { startDate, endDate };
    }

    private getSelectedDateRange(): { start?: string; end?: string } {
      const startDate = this.form.value.startDate;
      const endDate = this.form.value.endDate || startDate;
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
  }
