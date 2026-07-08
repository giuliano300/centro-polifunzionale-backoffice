import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatCalendar, MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BookingWithPayments } from '../../../../interfaces/BookingWithPayments';

@Component({
    selector: 'app-working-schedule',
    imports: [NgFor, NgIf, MatCardModule, MatButtonModule, MatMenuModule, MatDatepickerModule, MatNativeDateModule],
    templateUrl: './working-schedule.component.html',
    styleUrl: './working-schedule.component.scss'
})
export class WorkingScheduleComponent implements OnChanges {
    @ViewChild(MatCalendar) calendar!: MatCalendar<Date>;

    @Input() year: number | null = null;

    @Input() month: number | null = null;

    @Input() day: number | null = null;

    @Input() selectedDate: Date | null = null;

    @Input() bookings: BookingWithPayments[] = [];

    @Output() bookingSelected = new EventEmitter<BookingWithPayments>();

    selected: Date = new Date();
    selectedBookings: BookingWithPayments[] = [];

    dateClass: MatCalendarCellClassFunction<Date> = this.createDateClass();

    ngOnChanges(changes: SimpleChanges): void {
        if (this.selectedDate) {
            this.selected = new Date(this.selectedDate);
        } else if (this.year && this.month) {
            const nextDay = this.day && this.day > 0 ? this.day : 1;
            this.selected = new Date(this.year, this.month - 1, nextDay);
        }

        if (changes['bookings'] || changes['year'] || changes['month'] || changes['day'] || changes['selectedDate']) {
            this.syncSelectedBookings();
            this.dateClass = this.createDateClass();
            setTimeout(() => this.calendar?.updateTodaysDate());
        }
    }

    onSelectedChange(date: Date | null): void {
        if (!date) return;

        this.selected = date;
        this.syncSelectedBookings();
    }

    selectBooking(item: BookingWithPayments): void {
        this.bookingSelected.emit(item);
    }

    private syncSelectedBookings(): void {
        this.selectedBookings = this.bookings
            .filter((item) => this.isSameDate(new Date(item.booking.date), this.selected))
            .sort((a, b) => a.booking.startTime.localeCompare(b.booking.startTime));
    }

    private hasBookingsOnDate(date: Date): boolean {
        return this.bookings.some((item) => this.isSameDate(new Date(item.booking.date), date));
    }

    private createDateClass(): MatCalendarCellClassFunction<Date> {
        return (cellDate, view) => {
            if (view !== 'month') return '';
            return this.hasBookingsOnDate(cellDate) ? 'has-bookings' : '';
        };
    }

    private isSameDate(first: Date, second: Date): boolean {
        return first.getFullYear() === second.getFullYear()
            && first.getMonth() === second.getMonth()
            && first.getDate() === second.getDate();
    }
}
