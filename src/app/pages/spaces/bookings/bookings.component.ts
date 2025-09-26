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
import { NgFor } from '@angular/common';

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
    NgFor
],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent {
 bookingWithPayments: BookingWithPayments[] = [];

 displayedColumns: string[] = ['name', 'date', 'startTime', 'endTime', 'status','amount', 'paymentStatus', 'delete'];

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
      private utilService: UtilsService
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
    this.year = new Date().getFullYear();
    this.month = new Date().getMonth() + 1;

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
      this.getSpace(this.id!);
      this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!);
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


    gotoSpaces(){
      this.router.navigate(["/spaces"]);
    }
  }
