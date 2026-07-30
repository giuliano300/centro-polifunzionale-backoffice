import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { SpacesService } from '../../../services/Space.service';
import { SpaceExceptionalClosure, SpaceOpeningSlot, Spaces } from '../../../interfaces/spaces';

@Component({
  selector: 'app-space-form',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatSelectModule
  ],
  templateUrl: './space-form.component.html',
  styleUrl: './space-form.component.scss'
})
export class SpaceFormComponent {
  form: FormGroup;
  id: string | null = null;
  isSaving = false;
  isLoading = false;
  errorMessage = '';
  days = [
    { value: 1, label: 'Lunedi' },
    { value: 2, label: 'Martedi' },
    { value: 3, label: 'Mercoledi' },
    { value: 4, label: 'Giovedi' },
    { value: 5, label: 'Venerdi' },
    { value: 6, label: 'Sabato' },
    { value: 0, label: 'Domenica' },
  ];
  paymentMethods = [
    { value: 'cash', label: 'Contanti' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'nexi', label: 'Nexi' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private spacesService: SpacesService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      hourlyRate: [0, [Validators.min(0)]],
      dailyRate: [0, [Validators.min(0)]],
      rentalUnit: ['whole_room', [Validators.required]],
      rentalModes: [['time'], [Validators.required]],
      timeSlotMinutes: [60, [Validators.min(15)]],
      workstationCount: [1, [Validators.required, Validators.min(1)]],
      sectorEnabled: [false],
      sectorCount: [2, [Validators.min(1)]],
      sectorNames: this.fb.array([]),
      calendarColor: ['#f3f4f6'],
      sectorColors: this.fb.array([]),
      sectorRate: [0, [Validators.min(0)]],
      sectorDailyRate: [0, [Validators.min(0)]],
      courseCreationAdvanceHours: [2, [Validators.required, Validators.min(0)]],
      paymentMethods: [['cash', 'stripe', 'paypal', 'nexi'], [Validators.required]],
      openingHours: this.fb.array(this.days.map((day) => this.createOpeningSlot(day.value))),
      exceptionalClosures: this.fb.array([]),
      isAvailable: [true]
    });
    this.form.get('rentalModes')?.valueChanges.subscribe(() => {
      this.syncRentalModeValidators();
      this.syncSectorValidators();
    });
    this.form.get('rentalUnit')?.valueChanges.subscribe(() => {
      this.syncSectorNames();
      this.syncSectorValidators();
    });
    this.form.get('sectorEnabled')?.valueChanges.subscribe(() => {
      this.syncSectorNames();
      this.syncSectorValidators();
    });
    this.form.get('sectorCount')?.valueChanges.subscribe((count) => this.syncSectorNames([], Number(count || 1)));
    this.syncRentalModeValidators();
    this.syncSectorNames();
    this.syncSectorValidators();
  }

  get openingHours(): FormArray {
    return this.form.get('openingHours') as FormArray;
  }

  get exceptionalClosures(): FormArray {
    return this.form.get('exceptionalClosures') as FormArray;
  }

  get sectorNames(): FormArray {
    return this.form.get('sectorNames') as FormArray;
  }

  get sectorColors(): FormArray {
    return this.form.get('sectorColors') as FormArray;
  }

  sectorNameControl(index: number): FormControl {
    return this.sectorNames.at(index) as FormControl;
  }

  sectorColorControl(index: number): FormControl {
    return this.sectorColors.at(index) as FormControl;
  }

  get hasTimeRental(): boolean {
    return this.form.value.rentalModes?.includes('time');
  }

  get hasFullDayRental(): boolean {
    return this.form.value.rentalModes?.includes('full_day');
  }

  createOpeningSlot(day: number): FormGroup {
    const isWeekday = day >= 1 && day <= 5;
    return this.fb.group({
      day: [day],
      isOpen: [isWeekday],
      openTime: ['09:00', [Validators.required]],
      closeTime: ['18:00', [Validators.required]],
      maxConsecutiveTimeSlots: [1, [Validators.required, Validators.min(1)]]
    });
  }

  createExceptionalClosure(closure?: Partial<SpaceExceptionalClosure>): FormGroup {
    return this.fb.group({
      startDate: [closure?.startDate ? new Date(closure.startDate) : null, [Validators.required]],
      endDate: [closure?.endDate ? new Date(closure.endDate) : null, [Validators.required]],
      reason: [closure?.reason || '', [Validators.maxLength(160)]]
    });
  }

  addExceptionalClosure(): void {
    this.exceptionalClosures.push(this.createExceptionalClosure());
  }

  removeExceptionalClosure(index: number): void {
    this.exceptionalClosures.removeAt(index);
  }

  toggleAvailability(): void {
    this.form.patchValue({ isAvailable: !this.form.value.isAvailable });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (this.id) {
      this.isLoading = true;
      this.spacesService.getSpace(this.id).subscribe({
        next: (space: Spaces) => {
          const openingHours: SpaceOpeningSlot[] = space.openingHours?.length ? space.openingHours : this.openingHours.value;
          this.form.patchValue({
            ...space,
            rentalUnit: space.rentalUnit || 'whole_room',
            rentalModes: space.rentalModes?.length ? space.rentalModes : ['time'],
            timeSlotMinutes: space.timeSlotMinutes || 60,
            workstationCount: space.workstationCount || 1,
            sectorEnabled: !!space.sectorEnabled,
            sectorCount: space.sectorCount || 2,
            calendarColor: space.calendarColor || '#f3f4f6',
            sectorRate: space.sectorRate || 0,
            sectorDailyRate: space.sectorDailyRate || 0,
            courseCreationAdvanceHours: space.courseCreationAdvanceHours ?? 2,
            paymentMethods: space.paymentMethods?.length ? space.paymentMethods : ['cash', 'stripe', 'paypal', 'nexi'],
            dailyRate: space.dailyRate || 0
          });
          this.syncSectorNames(space.sectorNames || []);
          this.syncSectorColors(space.sectorColors || []);
          this.openingHours.clear();
          this.days.forEach((day) => {
            const saved = openingHours.find((slot) => slot.day === day.value);
            const group = this.createOpeningSlot(day.value);
            group.patchValue({ maxConsecutiveTimeSlots: space.maxConsecutiveTimeSlots || 1, ...(saved || {}) });
            this.openingHours.push(group);
          });
          this.exceptionalClosures.clear();
          (space.exceptionalClosures || []).forEach((closure) => {
            this.exceptionalClosures.push(this.createExceptionalClosure(closure));
          });
          this.syncRentalModeValidators();
          this.syncSectorValidators();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Impossibile caricare la stanza selezionato.';
          this.isLoading = false;
        }
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Compila i campi obbligatori.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    const value = this.form.getRawValue();
    value.calendarColor = this.normalizedColor(value.calendarColor, '#f3f4f6');
    if (value.rentalUnit === 'whole_room') {
      value.workstationCount = 1;
      value.sectorNames = this.normalizedSectorNames();
      value.sectorColors = this.normalizedSectorColors();
    } else {
      value.sectorEnabled = false;
      value.sectorCount = 1;
      value.sectorNames = [];
      value.sectorColors = [];
      value.sectorRate = 0;
      value.sectorDailyRate = 0;
    }
    if (!this.hasTimeRental) {
      value.hourlyRate = 0;
      value.timeSlotMinutes = 60;
      value.maxConsecutiveTimeSlots = 1;
      value.openingHours = value.openingHours.map((slot: SpaceOpeningSlot) => ({ ...slot, maxConsecutiveTimeSlots: 1 }));
    }
    if (!this.hasFullDayRental) {
      value.dailyRate = 0;
    }
    value.maxConsecutiveTimeSlots = Math.max(...value.openingHours.map((slot: SpaceOpeningSlot) => Number(slot.maxConsecutiveTimeSlots || 1)), 1);
    value.exceptionalClosures = (value.exceptionalClosures || []).map((closure: SpaceExceptionalClosure) => ({
      ...closure,
      endDate: closure.endDate || closure.startDate
    }));

    const request = this.id
      ? this.spacesService.update(this.id, value)
      : this.spacesService.create(value);

    request.subscribe({
      next: () => this.router.navigate(['/spaces']),
      error: () => {
        this.errorMessage = 'Salvataggio non riuscito. Controlla i dati e riprova.';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/spaces']);
  }

  private syncRentalModeValidators(): void {
    const hourlyRate = this.form.get('hourlyRate');
    const dailyRate = this.form.get('dailyRate');
    const timeSlotMinutes = this.form.get('timeSlotMinutes');

    if (this.hasTimeRental) {
      hourlyRate?.setValidators([Validators.required, Validators.min(0)]);
      timeSlotMinutes?.setValidators([Validators.required, Validators.min(15)]);
    } else {
      hourlyRate?.setValidators([Validators.min(0)]);
      timeSlotMinutes?.setValidators([Validators.min(15)]);
    }

    if (this.hasFullDayRental) {
      dailyRate?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      dailyRate?.setValidators([Validators.min(0)]);
    }

    hourlyRate?.updateValueAndValidity({ emitEvent: false });
    dailyRate?.updateValueAndValidity({ emitEvent: false });
    timeSlotMinutes?.updateValueAndValidity({ emitEvent: false });
  }

  private syncSectorValidators(): void {
    const sectorCount = this.form.get('sectorCount');
    const sectorRate = this.form.get('sectorRate');
    const sectorDailyRate = this.form.get('sectorDailyRate');
    const enabled = this.form.value.rentalUnit === 'whole_room' && !!this.form.value.sectorEnabled;

    if (enabled) {
      sectorCount?.setValidators([Validators.required, Validators.min(2)]);
      sectorRate?.setValidators(this.hasTimeRental ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
      sectorDailyRate?.setValidators(this.hasFullDayRental ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
    } else {
      sectorCount?.setValidators([Validators.min(1)]);
      sectorRate?.setValidators([Validators.min(0)]);
      sectorDailyRate?.setValidators([Validators.min(0)]);
    }

    sectorCount?.updateValueAndValidity({ emitEvent: false });
    sectorRate?.updateValueAndValidity({ emitEvent: false });
    sectorDailyRate?.updateValueAndValidity({ emitEvent: false });
  }

  private syncSectorNames(savedNames: string[] = [], sectorCount?: number): void {
    const enabled = this.form.value.rentalUnit === 'whole_room' && !!this.form.value.sectorEnabled;
    const count = enabled ? Math.max(Number(sectorCount ?? this.form.get('sectorCount')?.value ?? 1), 1) : 0;

    while (this.sectorNames.length < count) {
      const index = this.sectorNames.length;
      this.sectorNames.push(this.fb.control(savedNames[index] || `Area ${index + 1}`, [Validators.required, Validators.maxLength(80)]));
    }

    while (this.sectorNames.length > count) {
      this.sectorNames.removeAt(this.sectorNames.length - 1);
    }

    savedNames.slice(0, count).forEach((name, index) => {
      this.sectorNames.at(index)?.patchValue(name || `Area ${index + 1}`, { emitEvent: false });
    });
    this.syncSectorColors([], count);
  }

  private syncSectorColors(savedColors: string[] = [], sectorCount?: number): void {
    const enabled = this.form.value.rentalUnit === 'whole_room' && !!this.form.value.sectorEnabled;
    const count = enabled ? Math.max(Number(sectorCount ?? this.form.get('sectorCount')?.value ?? 1), 1) : 0;

    while (this.sectorColors.length < count) {
      const index = this.sectorColors.length;
      this.sectorColors.push(this.fb.control(savedColors[index] || this.defaultSectorColor(index), [Validators.required]));
    }

    while (this.sectorColors.length > count) {
      this.sectorColors.removeAt(this.sectorColors.length - 1);
    }

    savedColors.slice(0, count).forEach((color, index) => {
      this.sectorColors.at(index)?.patchValue(color || this.defaultSectorColor(index), { emitEvent: false });
    });
  }

  private normalizedSectorNames(): string[] {
    if (!this.form.value.sectorEnabled) {
      return [];
    }

    return this.sectorNames.controls.map((control, index) => {
      const value = String(control.value || '').trim();
      return value || `Area ${index + 1}`;
    });
  }

  private normalizedSectorColors(): string[] {
    if (!this.form.value.sectorEnabled) {
      return [];
    }

    return this.sectorColors.controls.map((control, index) => {
      const value = String(control.value || '').trim();
      return this.normalizedColor(value, this.defaultSectorColor(index));
    });
  }

  private normalizedColor(value: unknown, fallback: string): string {
    const color = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
  }

  private defaultSectorColor(index: number): string {
    const colors = ['#f3f4f6', '#e5e7eb', '#eef2ff', '#ecfeff', '#f0fdf4', '#fff7ed'];
    return colors[index % colors.length];
  }
}
