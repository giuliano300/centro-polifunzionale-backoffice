import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { BookingWithPayments } from '../../interfaces/BookingWithPayments';
import { CustomDateFormatPipe } from '../../services/custom-date-format.pipe';
import { BookingService } from '../../services/Booking.service';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';
import { NgFor, NgIf } from '@angular/common';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

type BookingRow = BookingWithPayments & { action: { delete: string } };
const NEUTRAL_BOOKING_COLOR = '#f3f4f6';

type CalendarDay = {
  date: Date;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  bookings: BookingRow[];
};

@Component({
  selector: 'app-bookings-list',
  imports: [NgIf, NgFor, RouterLink, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatPaginatorModule, MatTableModule, CustomDateFormatPipe, FeathericonsModule],
  templateUrl: './bookings-list.component.html',
  styleUrl: './bookings-list.component.scss'
})
export class BookingsListComponent {
  displayedColumns: string[] = ['name', 'user', 'space', 'date', 'startTime', 'endTime', 'status', 'amount', 'course', 'delete'];
  dataSource = new MatTableDataSource<BookingRow>([]);
  bookings: BookingRow[] = [];
  calendarDays: CalendarDay[] = [];
  viewMode: 'list' | 'calendar' = 'calendar';
  weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  selectedDetailTitle = '';
  selectedDetailSubtitle = '';
  selectedDetailRows: Array<{ label: string; value: string }> = [];
  selectedDetailClientRows: Array<{ label: string; value: string }> = [];
  selectedDetailSpaceRows: Array<{ label: string; value: string }> = [];
  selectedDetailPaymentRows: Array<{ label: string; value: string }> = [];
  selectedDetailStatus = '';
  selectedDetailStatusClass = '';
  selectedDetailColor = NEUTRAL_BOOKING_COLOR;
  selectedDetailTextColor = '#111827';
  selectedDetailLink = '';
  selectedDetailQueryParams: Record<string, string> | null = null;
  courses: Course[] = [];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private bookingService: BookingService,
    private courseService: CourseService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    const defaultRange = this.getCurrentMonthRange();
    this.filterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      search: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.applyQueryDateSelection();
    this.getBookings();
    this.getCourses();
  }

  getBookings(): void {
    const dateRange = this.getSelectedDateRange();
    this.bookingService.getAllBookings({
      start: dateRange.start,
      end: dateRange.end,
      status: this.filterForm.value.status,
      excludeStatus: 'cancellation_requested',
      search: this.filterForm.value.search
    }).subscribe((data: BookingWithPayments[]) => {
      this.bookings = data.map((item) => ({
          ...item,
          action: { delete: 'ri-delete-bin-line' }
        }));
      this.dataSource = new MatTableDataSource<BookingRow>(this.bookings);
      this.dataSource.paginator = this.paginator;
      this.buildCalendarDays();
    });
  }

  applyFilters(): void {
    this.getBookings();
  }

  resetFilters(): void {
    const defaultRange = this.getCurrentMonthRange();
    this.filterForm.patchValue({ startDate: defaultRange.startDate, endDate: defaultRange.endDate, search: '', status: '' });
    this.applyFilters();
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    this.viewMode = mode;
  }

  previousMonth(): void {
    const current = this.getCalendarReferenceDate();
    const range = this.getCurrentMonthRange(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.filterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
    this.getBookings();
  }

  nextMonth(): void {
    const current = this.getCalendarReferenceDate();
    const range = this.getCurrentMonthRange(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.filterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
    this.getBookings();
  }

  calendarMonthLabel(): string {
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(this.getCalendarReferenceDate());
  }

  getCalendarLegend(): Array<{ id: string; name: string; color: string }> {
    const map = new Map<string, { id: string; name: string; color: string }>();
    this.bookings.forEach((item) => {
      const space = item.booking.space;
      if (space?._id && !map.has(space._id)) {
        map.set(space._id, {
          id: space._id,
          name: space.name,
          color: this.getSpaceColor(item),
        });
      }
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  getSpaceColor(item: BookingWithPayments): string {
    return this.normalizedColor(item.booking.space?.calendarColor) || NEUTRAL_BOOKING_COLOR;
  }

  getBookingColor(item: BookingWithPayments): string {
    const space = item.booking.space;
    const indexes = item.booking.sectorIndexes || [];
    const sectorCount = Number(space?.sectorCount || 1);
    const isPartialSectorBooking = !!space?.sectorEnabled && indexes.length > 0 && indexes.length < sectorCount;

    if (isPartialSectorBooking) {
      return this.normalizedColor(space?.sectorColors?.[indexes[0]]) || NEUTRAL_BOOKING_COLOR;
    }

    return this.normalizedColor(space?.calendarColor) || NEUTRAL_BOOKING_COLOR;
  }

  getBookingTextColor(item: BookingWithPayments): string {
    const color = this.getBookingColor(item).replace('#', '');
    if (color.length !== 6) {
      return '#111827';
    }

    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    return luminance > 0.62 ? '#111827' : '#ffffff';
  }

  getSectorLabel(item: BookingWithPayments): string {
    const space = item.booking.space;
    const indexes = item.booking.sectorIndexes || [];
    if (!space?.sectorEnabled || !indexes.length) {
      return '';
    }

    if (indexes.length >= Number(space.sectorCount || 1)) {
      return 'Stanza intera';
    }

    return indexes.map((index) => {
      const name = space.sectorNames?.[index] || `${index + 1}`;
      return name.toLowerCase().startsWith('area ') ? name : `Area ${name}`;
    }).join(', ');
  }

  openBookingDetail(item: BookingRow): void {
    const booking = item.booking;
    const date = this.formatDate(booking.date);
    const payment = item.payments?.find((payment) => payment.status === 'PAID')
      || item.payments?.find((payment) => payment.status === 'PENDING')
      || item.payments?.[0];
    this.selectedDetailTitle = booking.name || 'Prenotazione';
    this.selectedDetailSubtitle = `${booking.space?.name || 'Stanza'} - ${date}`;
    this.selectedDetailStatus = this.getBookingStatusLabel(booking.status);
    this.selectedDetailStatusClass = booking.status || 'pending';
    this.selectedDetailColor = this.getBookingColor(item);
    this.selectedDetailTextColor = this.getBookingTextColor(item);
    this.selectedDetailClientRows = [
      { label: 'Cliente', value: booking.user?.name || '-' },
      { label: 'Email', value: booking.user?.email || '-' },
      { label: 'Telefono', value: booking.user?.phone || '-' },
    ];
    this.selectedDetailSpaceRows = [
      { label: 'Stanza', value: booking.space?.name || '-' },
      { label: 'Aree', value: this.getSectorLabel(item) || 'Stanza intera' },
      { label: 'Tipo stanza', value: this.getRentalUnitLabel(booking.rentalUnit) },
      { label: 'Modalita acquisto', value: this.getRentalModeLabel(booking.rentalMode) },
      { label: 'Postazioni', value: String(booking.workstationQuantity || 1) },
    ];
    this.selectedDetailPaymentRows = [
      { label: 'Totale', value: this.formatCurrency(this.GetTotalAmount(item)) },
      { label: 'Wallet usato', value: this.formatCurrency(this.GetWalletAmount(item)) },
      { label: 'Da metodo pagamento', value: this.formatCurrency(this.GetExternalAmount(item)) },
      { label: 'Metodo', value: this.GetPaymentMethodLabel(item) },
      { label: 'Stato', value: payment ? this.getPaymentStatusLabel(payment.status) : '-' },
    ];
    this.selectedDetailRows = [
      { label: 'Nome prenotazione', value: booking.name || '-' },
      { label: 'Data', value: date },
      { label: 'Orario', value: this.formatTimeRange(booking.startTime, booking.endTime) },
      { label: 'Stato prenotazione', value: this.getBookingStatusLabel(booking.status) },
    ];
    this.selectedDetailLink = booking.space?._id ? `/space/bookings/${booking.space._id}` : '/bookings';
    const dateValue = booking.date ? new Date(booking.date) : null;
    this.selectedDetailQueryParams = dateValue && !Number.isNaN(dateValue.getTime())
      ? { month: String(dateValue.getMonth() + 1), year: String(dateValue.getFullYear()) }
      : null;
  }

  closeDetail(): void {
    this.selectedDetailTitle = '';
    this.selectedDetailSubtitle = '';
    this.selectedDetailRows = [];
    this.selectedDetailClientRows = [];
    this.selectedDetailSpaceRows = [];
    this.selectedDetailPaymentRows = [];
    this.selectedDetailStatus = '';
    this.selectedDetailStatusClass = '';
    this.selectedDetailColor = NEUTRAL_BOOKING_COLOR;
    this.selectedDetailTextColor = '#111827';
    this.selectedDetailLink = '';
    this.selectedDetailQueryParams = null;
  }

  getCourses(): void {
    this.courseService.getCourses().subscribe((data: Course[]) => {
      this.courses = data;
    });
  }

  DeleteItem(item: BookingRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.bookingService.delete(item.booking._id).subscribe(() => this.getBookings());
      }
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
    return { start: this.toDateKey(start), end: this.toDateKey(end) };
  }

  private toDateInputValue(value: string | Date): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    return this.IsPaid(item)
      && this.IsFutureOrToday(item)
      && item.booking.status !== 'cancelled'
      && item.booking.status !== 'cancellation_requested';
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
    return item.booking.status !== 'cancelled'
      && item.booking.status !== 'cancellation_requested'
      && (!!this.GetCourse(item) || this.CanCreateCourse(item));
  }

  getBookingStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      pending: 'In attesa',
      confirmed: 'Confermata',
      cancellation_requested: 'Richiesta annullamento',
      cancelled: 'Annullata'
    };

    return status ? labels[status] || status : '-';
  }

  GetTotalAmount(item: BookingWithPayments): number {
    const payment = item.payments?.[0];
    return payment?.totalAmount || ((payment?.amount || 0) + (payment?.walletAmount || 0));
  }

  GetWalletAmount(item: BookingWithPayments): number {
    return item.payments?.[0]?.walletAmount || 0;
  }

  GetExternalAmount(item: BookingWithPayments): number {
    const payment = item.payments?.[0];
    return payment?.externalAmount || payment?.amount || 0;
  }

  GetPaymentMethodLabel(item: BookingWithPayments): string {
    const payment = item.payments?.find(payment => payment.status === 'PAID')
      || item.payments?.find(payment => payment.status === 'PENDING')
      || item.payments?.[0];
    const method = String(payment?.provider || payment?.method || '').toLowerCase();
    const labels: Record<string, string> = {
      wallet: 'Wallet',
      manual: 'Pagamento manuale',
      stripe: 'Stripe',
      paypal: 'PayPal',
      nexi: 'Nexi',
      card: 'Carta',
      cash: 'Contanti'
    };

    if (method && labels[method]) {
      return labels[method];
    }

    return payment?.status === 'PAID' ? 'Pagamento registrato' : 'Pagamento da completare';
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  private formatDate(value?: string | Date): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  private formatTimeRange(start?: string, end?: string): string {
    if (!start && !end) {
      return '-';
    }

    return `${start || '-'} - ${end || '-'}`;
  }

  private getRentalUnitLabel(value?: string): string {
    const labels: Record<string, string> = {
      whole_room: 'Stanza intera',
      workstation: 'Postazione'
    };
    return value ? labels[value] || value : '-';
  }

  private getRentalModeLabel(value?: string): string {
    const labels: Record<string, string> = {
      time: 'A tempo',
      full_day: 'Tutta la giornata'
    };
    return value ? labels[value] || value : '-';
  }

  private getPaymentStatusLabel(value?: string): string {
    const labels: Record<string, string> = {
      PAID: 'Pagato',
      PENDING: 'In attesa',
      FAILED: 'Non riuscito',
      FREE: 'Gratuito'
    };
    return value ? labels[value] || value : '-';
  }

  private buildCalendarDays(): void {
    const reference = this.getCalendarReferenceDate();
    const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const start = new Date(firstOfMonth);
    const startOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - startOffset);

    const todayKey = this.toDateKey(new Date());
    this.calendarDays = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        dayNumber: date.getDate(),
        inMonth: date.getMonth() === reference.getMonth(),
        isToday: this.toDateKey(date) === todayKey,
        bookings: this.getBookingsByDate(date),
      };
    });
  }

  private getBookingsByDate(date: Date): BookingRow[] {
    const key = this.toDateKey(date);
    return this.bookings
      .filter((item) => this.toDateKey(item.booking.date) === key)
      .sort((a, b) => `${a.booking.startTime}-${a.booking.space?.name || ''}`.localeCompare(`${b.booking.startTime}-${b.booking.space?.name || ''}`));
  }

  private getCalendarReferenceDate(): Date {
    const startDate = this.filterForm.value.startDate;
    const date = startDate instanceof Date ? startDate : new Date(startDate || new Date());
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private toDateKey(value: string | Date): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizedColor(value?: string): string {
    const color = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '';
  }

  CreateCourse(item: BookingWithPayments): void {
    const course = this.GetCourse(item);
    if (!course && !this.CanCreateCourse(item)) {
      return;
    }

    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '1180px',
      minWidth: 'min(1040px, 96vw)',
      maxWidth: '96vw',
      data: {
        bookingWithPayments: item,
        course
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.getCourses();
        this.getBookings();
      }
    });
  }
}
