import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventContentArg } from '@fullcalendar/core';
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
import { BookingDialogComponent } from '../bookings/booking-dialog/booking-dialog.component';
import { PaymentService } from '../../../services/Payment.service';
import { BookingDetailModalComponent } from '../../../components/booking-detail-modal/booking-detail-modal.component';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
    selector: 'app-calendar',
    imports: [NgIf, NgFor, MatCardModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, FullCalendarModule, BookingDetailModalComponent],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
    @ViewChild('fullCalendar') fullCalendar?: FullCalendarComponent;
    bookingWithPayments: BookingWithPayments[] = [];
    selectedBookingDetail: BookingWithPayments | null = null;
    selectedAreaFilter = '';
    areaFilterOptions: Array<{ value: string; label: string; color: string }> = [];
    
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
        headerToolbar: false,
        height: 'auto',
        expandRows: true,
        fixedWeekCount: true,
        dayMaxEvents: 3,
        eventDisplay: 'block',
        datesSet: this.onDatesSet.bind(this),
        eventClick: this.handleEventClick.bind(this),
        eventContent: this.renderEventContent.bind(this),
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
        private paymentService: PaymentService,
        private spaceService: SpacesService,
        private dialog: MatDialog,
        private utilService: UtilsService
    ) 
    {
    }

    handleEventClick(clickInfo: any) {
        const event = clickInfo.event;
        this.selectedDate = new Date(event.startStr);
        const bookingWithPayments = event.extendedProps?.bookingWithPayments
            || this.bookingWithPayments.find(item => item.booking._id === event.extendedProps?.bookingId);
        if (bookingWithPayments) {
            this.openBookingDetail(bookingWithPayments);
        }
    }

    previousMonth(): void {
        this.fullCalendar?.getApi().prev();
    }

    nextMonth(): void {
        this.fullCalendar?.getApi().next();
    }

    calendarMonthLabel(): string {
        const reference = new Date(this.year || new Date().getFullYear(), (this.month || 1) - 1, 1);
        return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(reference);
    }

    selectCalendarMonth(date: Date, picker: MatDatepicker<Date>): void {
        this.fullCalendar?.getApi().gotoDate(new Date(date.getFullYear(), date.getMonth(), 1));
        picker.close();
    }

    renderEventContent(eventInfo: EventContentArg) {
        const item = eventInfo.event.extendedProps['bookingWithPayments'] as BookingWithPayments | undefined;
        if (!item) return { html: '' };

        const event = document.createElement('div');
        event.className = 'room-calendar-event';
        event.style.setProperty('--event-color', this.getBookingColor(item));

        const head = document.createElement('div');
        head.className = 'room-calendar-event-head';
        const time = document.createElement('span');
        time.textContent = `${item.booking.startTime} – ${item.booking.endTime}`;
        const payment = document.createElement('span');
        payment.className = `room-calendar-payment${this.isPaid(item) ? '' : ' unpaid'}`;
        payment.textContent = this.isPaid(item) ? 'Pagato' : 'Non pagato';
        head.append(time, payment);

        const client = document.createElement('strong');
        client.textContent = item.booking.user?.name || item.booking.name || 'Prenotazione';
        const name = document.createElement('small');
        name.textContent = item.booking.name || 'Prenotazione stanza';
        event.append(head, client, name);

        const areaLabel = this.getSectorLabel(item);
        if (areaLabel) {
            const area = document.createElement('em');
            area.textContent = areaLabel;
            event.append(area);
        }

        return { domNodes: [event] };
    }

    private isPaid(item: BookingWithPayments): boolean {
        return item.payments?.some((payment) => payment.status === 'PAID') || false;
    }

    private getBookingColor(item: BookingWithPayments): string {
        const space = item.booking.space;
        const indexes = item.booking.sectorIndexes || [];
        if (space?.sectorEnabled && indexes.length === 1) {
            const areaColor = this.normalizedColor(space.sectorColors?.[indexes[0]]);
            if (areaColor) return areaColor;
        }
        return this.normalizedColor(space?.calendarColor) || 'var(--color-brand)';
    }

    private getSectorLabel(item: BookingWithPayments): string {
        const space = item.booking.space;
        const indexes = item.booking.sectorIndexes || [];
        if (!space?.sectorEnabled) return '';
        if (!indexes.length || indexes.length >= Number(space.sectorCount || 1)) return 'Stanza intera';
        return indexes.map((index) => space.sectorNames?.[index] || `Area ${index + 1}`).join(', ');
    }

    private normalizedColor(value?: string): string {
        const color = String(value || '').trim();
        return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '';
    }

    openBookingDetail(item: BookingWithPayments) {
        const bookingId = item.booking._id;
        this.paymentService.getByBooking(bookingId).subscribe({
          next: (payments) => this.selectedBookingDetail = { ...item, payments },
          error: () => this.selectedBookingDetail = item
        });
    }

    closeBookingDetail(): void {
        this.selectedBookingDetail = null;
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
            if (data) 
            {
                this.space = data;
                this.spaceName = data.name;
                this.updateAreaFilterOptions(data);
            }
        });
    }

    onAreaFilterChange(value: string): void {
        this.selectedAreaFilter = value;
        this.getCalendar();
    }

    private updateAreaFilterOptions(space: Spaces): void {
        const sectorCount = space.sectorEnabled ? Number(space.sectorCount || 0) : 0;
        this.areaFilterOptions = sectorCount > 0
          ? [
              { value: 'room', label: 'Stanza intera', color: this.normalizedColor(space.calendarColor) || 'var(--color-brand)' },
              ...Array.from({ length: sectorCount }, (_, index) => ({
                value: String(index),
                label: space.sectorNames?.[index] || `Area ${index + 1}`,
                color: this.normalizedColor(space.sectorColors?.[index]) || this.normalizedColor(space.calendarColor) || 'var(--color-brand)'
              }))
            ]
          : [];
        if (!this.areaFilterOptions.some((option) => option.value === this.selectedAreaFilter)) {
            this.selectedAreaFilter = '';
        }
    }

    private matchesAreaFilter(item: BookingWithPayments): boolean {
        if (!this.selectedAreaFilter) return true;
        const space = item.booking.space;
        const indexes = item.booking.sectorIndexes || [];
        const sectorCount = Number(space?.sectorCount || 1);
        const isPartialAreaBooking = !!space?.sectorEnabled && indexes.length > 0 && indexes.length < sectorCount;
        return this.selectedAreaFilter === 'room'
          ? !space?.sectorEnabled || !indexes.length || indexes.length >= sectorCount
          : isPartialAreaBooking && indexes.includes(Number(this.selectedAreaFilter));
    }
    
    getBookings(id: string, year?: string, month?: string){
        this.bookingService.getBookings(id, year, month)
        .subscribe((data: BookingWithPayments[]) => {
            if (!data || data.length === 0) {
                this.bookingWithPayments = [];
                this.calendarOptions.events = [];
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

    CreateBooking(): void {
      if (this.dialog.getDialogById('create-booking-dialog')) {
        return;
      }

      if (this.space) {
        this.openCreateBooking(this.space);
        return;
      }

      if (!this.id) return;
      this.spaceService.getSpace(this.id).subscribe((space) => {
        this.space = space;
        this.spaceName = space.name;
        this.openCreateBooking(space);
      });
    }

    private openCreateBooking(space: Spaces): void {
      const dialogRef = this.dialog.open(BookingDialogComponent, {
        id: 'create-booking-dialog',
        width: '860px',
        minWidth: 'min(800px, 94vw)',
        maxWidth: '94vw',
        data: {
          space,
          date: new Date(this.year || new Date().getFullYear(), (this.month || 1) - 1, 1)
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.getBookings(this.id!, this.year?.toString()!, this.month?.toString()!);
        }
      });
    }

    getCalendar()
    {
        this.calendarOptions.events = this.bookingWithPayments.filter((item) => this.matchesAreaFilter(item)).map(b => ({
          title: `${b.booking.user.name}`,
          start: b.booking.date,
          allDay: true,
          classNames: ['room-booking-entry'],
          extendedProps: {
                bookingWithPayments: b,
                bookingId: b.booking._id,
                user: b.booking.user,
                space: b.booking.space,
                name: b.booking.name,
                startTime: b.booking.startTime,
                endTime: b.booking.endTime,
                status: b.booking.status,
                payments: (b.payments || []).map(payment => ({
                    _id: payment._id,
                    bookingId: payment.bookingId,
                    amount: payment.amount,
                    totalAmount: payment.totalAmount,
                    walletAmount: payment.walletAmount,
                    externalAmount: payment.externalAmount,
                    status: payment.status,
                    method: payment.method,
                    provider: payment.provider,
                    transactionId: payment.transactionId,
                })),
            }
        }));
    }
}
