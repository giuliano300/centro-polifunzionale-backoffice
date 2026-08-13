import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { BookingWithPayments } from '../../interfaces/BookingWithPayments';
import { CustomDateFormatPipe } from '../../services/custom-date-format.pipe';
import { BookingService } from '../../services/Booking.service';
import { Course } from '../../interfaces/courses';
import { CourseService } from '../../services/Course.service';
import { CourseDialogComponent } from '../spaces/bookings/course-dialog/course-dialog.component';
import { NgFor, NgIf } from '@angular/common';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';
import { Spaces } from '../../interfaces/spaces';
import { SpacesService } from '../../services/Space.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BookingDetailModalComponent } from '../../components/booking-detail-modal/booking-detail-modal.component';

type BookingRow = BookingWithPayments & { action: { delete: string } };
const NEUTRAL_BOOKING_COLOR = '#f3f4f6';

type CalendarDay = {
  date: Date;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  bookings: BookingRow[];
};

type CalendarAreaFilter = { id: string; name: string; color: string; sectorIndex: number };
type CalendarFilterGroup = { spaceId: string; roomFilterId: string; name: string; color: string; areas: CalendarAreaFilter[] };

@Component({
  selector: 'app-bookings-list',
  imports: [NgIf, NgFor, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatPaginatorModule, MatTableModule, CustomDateFormatPipe, FeathericonsModule, BookingDetailModalComponent],
  templateUrl: './bookings-list.component.html',
  styleUrl: './bookings-list.component.scss'
})
export class BookingsListComponent implements OnDestroy {
  displayedColumns: string[] = ['name', 'user', 'space', 'area', 'date', 'startTime', 'endTime', 'status', 'amount', 'course', 'delete'];
  dataSource = new MatTableDataSource<BookingRow>([]);
  bookings: BookingRow[] = [];
  calendarDays: CalendarDay[] = [];
  selectedCalendarFilterId = '';
  expandedCalendarSpaceId = '';
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
  selectedBookingDetail: BookingWithPayments | null = null;
  courses: Course[] = [];
  spaces: Spaces[] = [];
  listAreaOptions: Array<{ value: string; label: string }> = [];
  calendarFilterForm: FormGroup;
  listFilterForm: FormGroup;
  private readonly destroy$ = new Subject<void>();
  private bookingsRequest?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private bookingService: BookingService,
    private courseService: CourseService,
    private spacesService: SpacesService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    const defaultRange = this.getCurrentMonthRange();
    this.calendarFilterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate]
    });
    this.listFilterForm = this.fb.group({
      startDate: [defaultRange.startDate],
      endDate: [defaultRange.endDate],
      search: [''],
      status: [''],
      spaceId: [''],
      areaFilter: ['']
    });
  }

  ngOnInit(): void {
    this.applyQueryDateSelection();
    this.setupListFilterInteractions();
    this.getBookings();
    this.getCourses();
    this.spacesService.getSpaces().subscribe((spaces) => {
      this.spaces = [...spaces].sort((a, b) => a.name.localeCompare(b.name));
      this.updateListAreaOptions(this.listFilterForm.value.spaceId);
    });
  }

  getBookings(): void {
    const dateRange = this.getSelectedDateRange(this.calendarFilterForm);
    this.bookingsRequest?.unsubscribe();
    this.bookingsRequest = this.bookingService.getAllBookings({
      start: dateRange.start,
      end: dateRange.end,
      status: this.listFilterForm.value.status,
      excludeStatus: 'cancellation_requested',
      search: this.listFilterForm.value.search,
      spaceId: this.listFilterForm.value.spaceId
    }).subscribe((data: BookingWithPayments[]) => {
      const items = data.map((item) => ({
          ...item,
          action: { delete: 'ri-delete-bin-line' }
        } as BookingRow));
      this.bookings = items.filter((item) => this.matchesListAreaFilter(item));
      this.ensureCalendarFilterAvailable();
      this.dataSource = new MatTableDataSource<BookingRow>(this.bookings);
      this.dataSource.paginator = this.paginator;
      this.buildCalendarDays();
    });
  }

  applyFilters(): void {
    this.syncDateRangeFromActiveView();
    this.getBookings();
  }

  resetFilters(): void {
    const defaultRange = this.getCurrentMonthRange();
    const dates = { startDate: defaultRange.startDate, endDate: defaultRange.endDate };
    this.calendarFilterForm.patchValue(dates, { emitEvent: false });
    this.listFilterForm.patchValue({ ...dates, search: '', status: '', spaceId: '', areaFilter: '' }, { emitEvent: false });
    this.listAreaOptions = [];
    this.selectedCalendarFilterId = '';
    this.expandedCalendarSpaceId = '';
    this.getBookings();
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.getBookings();
  }

  private updateListAreaOptions(spaceId: string): void {
    const space = this.spaces.find((item) => item._id === spaceId);
    if (!space?.sectorEnabled || !Number(space.sectorCount || 0)) {
      this.listAreaOptions = [];
      return;
    }
    this.listAreaOptions = [
      { value: 'room', label: 'Stanza intera' },
      ...Array.from({ length: Number(space.sectorCount) }, (_, index) => ({ value: String(index), label: space.sectorNames?.[index] || `Area ${index + 1}` })),
    ];
  }

  private setupListFilterInteractions(): void {
    this.listFilterForm.get('spaceId')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((spaceId: string) => {
        this.listFilterForm.patchValue({ areaFilter: '' }, { emitEvent: false });
        this.updateListAreaOptions(spaceId);
        this.selectedCalendarFilterId = spaceId ? `space:${spaceId}` : '';
        this.expandedCalendarSpaceId = '';
        this.getBookings();
      });

    ['status', 'areaFilter'].forEach((controlName) => {
      this.listFilterForm.get(controlName)?.valueChanges
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe(() => {
          if (controlName === 'areaFilter') this.syncCalendarFilterFromList();
          this.getBookings();
        });
    });

    this.listFilterForm.get('search')?.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.getBookings();
      });
  }

  private syncDateRangeFromActiveView(): void {
    const source = this.viewMode === 'calendar' ? this.calendarFilterForm : this.listFilterForm;
    const target = this.viewMode === 'calendar' ? this.listFilterForm : this.calendarFilterForm;
    target.patchValue({
      startDate: source.value.startDate,
      endDate: source.value.endDate
    }, { emitEvent: false });
  }

  private syncCalendarFilterFromList(): void {
    const spaceId = this.listFilterForm.value.spaceId;
    const areaFilter = this.listFilterForm.value.areaFilter;
    if (!spaceId) {
      this.selectedCalendarFilterId = '';
    } else if (areaFilter === 'room') {
      this.selectedCalendarFilterId = `room:${spaceId}`;
    } else if (areaFilter !== '' && areaFilter !== null && areaFilter !== undefined) {
      this.selectedCalendarFilterId = `area:${spaceId}:${areaFilter}`;
    } else {
      this.selectedCalendarFilterId = `space:${spaceId}`;
    }
    this.expandedCalendarSpaceId = '';
  }

  ngOnDestroy(): void {
    this.bookingsRequest?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  previousMonth(): void {
    const current = this.getCalendarReferenceDate();
    const range = this.getCurrentMonthRange(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.calendarFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
    this.listFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate }, { emitEvent: false });
    this.getBookings();
  }

  nextMonth(): void {
    const current = this.getCalendarReferenceDate();
    const range = this.getCurrentMonthRange(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.calendarFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
    this.listFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate }, { emitEvent: false });
    this.getBookings();
  }

  selectCalendarMonth(date: Date, picker: MatDatepicker<Date>): void {
    const range = this.getCurrentMonthRange(new Date(date.getFullYear(), date.getMonth(), 1));
    this.calendarFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
    this.listFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate }, { emitEvent: false });
    picker.close();
    this.getBookings();
  }

  calendarMonthLabel(): string {
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(this.getCalendarReferenceDate());
  }

  getCalendarFilterGroups(): CalendarFilterGroup[] {
    return this.spaces.map((space) => {
      const color = this.normalizedColor(space.calendarColor) || NEUTRAL_BOOKING_COLOR;
      const sectorCount = space.sectorEnabled ? Number(space.sectorCount || 0) : 0;
      return {
        spaceId: space._id,
        roomFilterId: `room:${space._id}`,
        name: space.name,
        color,
        areas: Array.from({ length: sectorCount }, (_, sectorIndex) => ({
          id: `area:${space._id}:${sectorIndex}`,
          name: space.sectorNames?.[sectorIndex] || `Area ${sectorIndex + 1}`,
          color: this.normalizedColor(space.sectorColors?.[sectorIndex]) || color,
          sectorIndex,
        })),
      };
    })
      .map((group) => ({ ...group, areas: [...group.areas].sort((a, b) => a.sectorIndex - b.sectorIndex) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  showAllCalendarSpaces(): void {
    this.selectedCalendarFilterId = '';
    this.expandedCalendarSpaceId = '';
    this.listFilterForm.patchValue({ spaceId: '', areaFilter: '' }, { emitEvent: false });
    this.listAreaOptions = [];
    this.getBookings();
  }

  toggleCalendarFilterGroup(spaceId: string): void {
    this.expandedCalendarSpaceId = this.expandedCalendarSpaceId === spaceId ? '' : spaceId;
  }

  selectCalendarFilter(filterId: string): void {
    this.selectedCalendarFilterId = filterId;
    this.expandedCalendarSpaceId = '';
    const [type, spaceId, sectorIndex] = filterId.split(':');
    const areaFilter = type === 'area' ? sectorIndex : type === 'room' ? 'room' : '';
    this.updateListAreaOptions(spaceId);
    this.listFilterForm.patchValue({ spaceId, areaFilter }, { emitEvent: false });
    this.getBookings();
  }

  isCalendarFilterGroupActive(spaceId: string): boolean {
    return this.selectedCalendarFilterId.split(':')[1] === spaceId;
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

  getTableAreaLabel(item: BookingWithPayments): string {
    return item.booking.space?.sectorEnabled ? this.getSectorLabel(item) || 'Stanza intera' : '-';
  }

  openBookingDetail(item: BookingRow): void {
    this.selectedBookingDetail = item;
  }

  closeDetail(): void {
    this.selectedBookingDetail = null;
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
      width: '480px',
      maxWidth: '92vw',
      data: { title: 'Eliminare questa prenotazione?', message: 'La prenotazione verrà rimossa definitivamente.' }
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
      this.calendarFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate });
      this.listFilterForm.patchValue({ startDate: range.startDate, endDate: range.endDate }, { emitEvent: false });
      return;
    }

    const start = this.parseDateParam(params.get('start'));
    const end = this.parseDateParam(params.get('end'));
    if (start || end) {
      this.calendarFilterForm.patchValue({
        startDate: start || end,
        endDate: end || start
      });
      this.listFilterForm.patchValue({
        startDate: start || end,
        endDate: end || start
      }, { emitEvent: false });
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

  private getSelectedDateRange(form: FormGroup): { start?: string; end?: string } {
    const startDate = form.value.startDate;
    const endDate = form.value.endDate || startDate;
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
      .filter((item) => this.toDateKey(item.booking.date) === key
        && this.matchesCalendarFilter(item))
      .sort((a, b) => `${a.booking.startTime}-${a.booking.space?.name || ''}`.localeCompare(`${b.booking.startTime}-${b.booking.space?.name || ''}`));
  }

  private matchesCalendarFilter(item: BookingRow): boolean {
    if (!this.selectedCalendarFilterId) return true;
    const [type, spaceId, sectorIndex] = this.selectedCalendarFilterId.split(':');
    if (item.booking.space?._id !== spaceId) return false;
    const indexes = item.booking.sectorIndexes || [];
    const sectorCount = Number(item.booking.space?.sectorCount || 1);
    const isPartialAreaBooking = !!item.booking.space?.sectorEnabled
      && indexes.length > 0
      && indexes.length < sectorCount;

    if (type === 'area') {
      return isPartialAreaBooking && indexes.includes(Number(sectorIndex));
    }

    if (type === 'space') {
      return true;
    }

    return !item.booking.space?.sectorEnabled || !indexes.length || indexes.length >= sectorCount;
  }

  private matchesListAreaFilter(item: BookingRow): boolean {
    const areaFilter = this.listFilterForm.value.areaFilter;
    if (!areaFilter) return true;
    const indexes = item.booking.sectorIndexes || [];
    const sectorCount = Number(item.booking.space?.sectorCount || 1);
    const isPartialAreaBooking = !!item.booking.space?.sectorEnabled
      && indexes.length > 0
      && indexes.length < sectorCount;
    return areaFilter === 'room'
      ? !item.booking.space?.sectorEnabled || !indexes.length || indexes.length >= sectorCount
      : isPartialAreaBooking && indexes.includes(Number(areaFilter));
  }

  private ensureCalendarFilterAvailable(): void {
    if (!this.selectedCalendarFilterId) return;
    const availableIds = this.getCalendarFilterGroups().flatMap((group) => [`space:${group.spaceId}`, group.roomFilterId, ...group.areas.map((area) => area.id)]);
    if (!availableIds.includes(this.selectedCalendarFilterId)) {
      this.selectedCalendarFilterId = '';
      this.expandedCalendarSpaceId = '';
    }
  }

  private getCalendarReferenceDate(): Date {
    const startDate = this.calendarFilterForm.value.startDate;
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
