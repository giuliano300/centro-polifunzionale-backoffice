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
import { CustomDateFormatPipe } from "../../../custom-date-format.pipe";

@Component({
  selector: 'app-bookings',
  imports: [MatCardModule, MatButtonModule, MatMenuModule, MatPaginatorModule, MatTableModule, MatCheckboxModule, CustomDateFormatPipe],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent {
 bookingWithPayments: BookingWithPayments[] = [];

 displayedColumns: string[] = ['date', 'startTime', 'endTime', 'status','amount', 'paymentStatus', 'delete'];

 dataSource = new MatTableDataSource<BookingWithPayments>(this.bookingWithPayments);

 @ViewChild(MatPaginator) paginator!: MatPaginator;

 spaceName = "";

 space: Spaces | null = null;

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private bookingService: BookingService,
      private spaceService: SpacesService,
      private dialog: MatDialog
  ) {}

   ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.getSpace(id!);
      this.getBookings(id!);
    });
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

   getBookings(id: string){
        this.bookingService.getBookings(id)
        .subscribe((data: BookingWithPayments[]) => {
          if (!data || data.length === 0) {
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
