import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../../services/Booking.service';
import { SpacesService } from '../../../../services/Space.service';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../../../../services/utils.service';

@Component({
    selector: 'app-working-schedule',
    imports: [MatCardModule, MatButtonModule, MatMenuModule, MatDatepickerModule, MatNativeDateModule],
    templateUrl: './working-schedule.component.html',
    styleUrl: './working-schedule.component.scss'
})
export class WorkingScheduleComponent implements OnChanges {

    months: any[] = [];

    years: any[] = [];

    @Input() year: number | null = null;

    @Input() month: number | null = null;

    @Input() day: number | null = null;

    id: string = "";

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private bookingService: BookingService,
        private spaceService: SpacesService,
        private dialog: MatDialog,
        private utilService: UtilsService
    ) 
    {
        this.months = utilService.GetMonth();
        this.day = new Date().getDay();
    }

    selected: Date = new Date();
    currentMonth: number = this.selected.getMonth();
    currentYear: number = this.selected.getFullYear();

    onMonthSelected(date: Date) {
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();
    }

    onYearSelected(date: Date) {
        this.currentYear = date.getFullYear();
    }

    ngOnChanges(changes: SimpleChanges): void {
        let monthStr = this.month!.toString().padStart(2, '0');
        if (changes['month'])
            monthStr = (parseInt(changes['month'].currentValue!) + 1).toString().padStart(2, '0');

        let y = this.year!.toString();
        if (changes['year'])
            y = changes['year'].currentValue!;

        let d = this.day!.toString();
        if (changes['day'])
            d = changes['day'].currentValue!;

        const dateStr = `${y}-${monthStr}-${d}`;

        console.log(dateStr);
        this.selected = new Date(dateStr);        
    }

    ngOnInit(): void {

        this.route.paramMap.subscribe(params => {
            this.id = params.get('id')!;

            const monthStr = this.month!.toString().padStart(2, '0');
            const dateStr = `${this.year}-${monthStr}-${this.day}`;
            this.selected = new Date(dateStr);
        });
    }
}