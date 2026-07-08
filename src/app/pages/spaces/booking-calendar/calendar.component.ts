import { Component } from '@angular/core';
import { WorkingScheduleComponent } from './working-schedule/working-schedule.component';
import { MatCardModule } from '@angular/material/card';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Spaces } from '../../../interfaces/spaces';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../services/Booking.service';
import { SpacesService } from '../../../services/Space.service';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../../../services/utils.service';
import { BookingWithPayments } from '../../../interfaces/BookingWithPayments';
import itLocale from '@fullcalendar/core/locales/it';
import { EventDetailDialogComponent } from '../../../event-detail/event-detail-dialog.component';

@Component({
    selector: 'app-calendar',
    imports: [WorkingScheduleComponent, MatCardModule, FullCalendarModule],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
    bookingWithPayments: BookingWithPayments[] = [];
    
    spaceName = "";

    space: Spaces | null = null;

    months: any[] = [];

    years: any[] = [];

    year: number | null = null;

    month: number | null = null;

    day: number | null = null;

    selectedDate: Date = new Date();

    id: string = "";
        
    calendarOptions: CalendarOptions = {
        initialView: 'dayGridMonth',
        events: [],
        plugins: [dayGridPlugin],
        locale: 'it',
        locales: [itLocale], 
        headerToolbar: {
            left: 'title',
            center: '',
            right: 'prev,next today'
        },
        datesSet: this.onDatesSet.bind(this),
        eventClick: this.handleEventClick.bind(this),
    };

    onDatesSet(dateInfo: DatesSetArg) {
        const start = dateInfo.view.currentStart;

        this.month = start.getMonth() + 1; 
        this.year = start.getFullYear();
        this.day = 1;
        if (this.id) {
            this.getBookings(this.id, this.year.toString(), this.month.toString());
        }
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private bookingService: BookingService,
        private spaceService: SpacesService,
        private dialog: MatDialog,
        private utilService: UtilsService
    ) 
    {
    }

    handleEventClick(clickInfo: any) {
        const event = clickInfo.event;
        this.selectedDate = new Date(event.startStr);
        this.dialog.open(EventDetailDialogComponent, {
            data: 
            {
                title: event.title,
                date: event.startStr,
                extendedProps: event.extendedProps
            },
            width: '600px'
        });
    }

    openBookingDetail(item: BookingWithPayments) {
        this.dialog.open(EventDetailDialogComponent, {
            data:
            {
                title: item.booking.user.name,
                date: item.booking.date,
                extendedProps: {
                    bookingId: item.booking._id,
                    user: item.booking.user,
                    space: item.booking.space,
                    name: item.booking.name,
                    startTime: item.booking.startTime,
                    endTime: item.booking.endTime,
                    status: item.booking.status,
                    payments: item.payments
                }
            },
            width: '600px'
        });
    }

    ngOnInit(): void {

        this.route.paramMap.subscribe(params => {
            this.id = params.get('id')!;
            this.year = parseInt(params.get('year')!);
            this.month = parseInt(params.get('month')!);
            this.day = 1;
            this.selectedDate = new Date(this.year, this.month - 1, this.day);
            const monthStr = this.month.toString().padStart(2, '0');
            const dateStr = `${this.year}-${monthStr}-01`;

            // ✅ Imposta la data iniziale nel calendario
            this.calendarOptions.initialDate = dateStr;

            this.getSpace(this.id!);
            this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!);
        });
    }

    getSpace(id: string){
        this.spaceService.getSpace(id)
        .subscribe((data: Spaces) => {
            if (!data) 
            {
                console.log('Nessun dato disponibile');
            } 
            else 
            {
                this.space = data;
                this.spaceName = data.name;
            }
        });
    }
    
    getBookings(id: string, year?: string, month?: string){
        this.bookingService.getBookings(id, year, month)
        .subscribe((data: BookingWithPayments[]) => {
            if (!data || data.length === 0) {
                this.bookingWithPayments = [];
                this.calendarOptions.events = [];
                console.log('Nessun dato disponibile');
            } 
            else 
            {
                this.bookingWithPayments = data;
                const firstBookingDate = data.length ? new Date(data[0].booking.date) : null;
                if (firstBookingDate) {
                    this.selectedDate = firstBookingDate;
                    this.day = firstBookingDate.getDate();
                }
                this.getCalendar();
            }
        });
    }

    gotoSpaces(){
      this.router.navigate(["/spaces"]);
    }


    gotoBooking(){
      this.router.navigate(["/space/bookings/" + this.id], {
        queryParams: {
            month: this.month,
            year: this.year
        }
      });
    }

    getCalendar()
    {
        this.calendarOptions.events = this.bookingWithPayments.map(b => ({
          title: `${b.booking.user.name}`,
          start: b.booking.date,
          allDay: true,
          extendedProps: {
                bookingId: b.booking._id,
                user: b.booking.user,
                space: b.booking.space,
                name: b.booking.name,
                startTime: b.booking.startTime,
                endTime: b.booking.endTime,
                status: b.booking.status,
                payments: b.payments.map(payment => ({
                    _id: payment._id,
                    bookingId: payment.bookingId,
                    amount: payment.amount,
                    status: payment.status,
                    method: payment.method,
                    transactionId: payment.transactionId,
                })),
            }
        }));
    }
}
