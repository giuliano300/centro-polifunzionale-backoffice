import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
      courseCreationAdvanceHours: [2, [Validators.required, Validators.min(0)]],
      paymentMethods: [['cash', 'stripe', 'paypal', 'nexi'], [Validators.required]],
      openingHours: this.fb.array(this.days.map((day) => this.createOpeningSlot(day.value))),
      exceptionalClosures: this.fb.array([]),
      isAvailable: [true]
    });
    this.form.get('rentalModes')?.valueChanges.subscribe(() => this.syncRentalModeValidators());
    this.syncRentalModeValidators();
  }

  get openingHours(): FormArray {
    return this.form.get('openingHours') as FormArray;
  }

  get exceptionalClosures(): FormArray {
    return this.form.get('exceptionalClosures') as FormArray;
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
            courseCreationAdvanceHours: space.courseCreationAdvanceHours ?? 2,
            paymentMethods: space.paymentMethods?.length ? space.paymentMethods : ['cash', 'stripe', 'paypal', 'nexi'],
            dailyRate: space.dailyRate || 0
          });
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
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Impossibile caricare lo spazio selezionato.';
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
    const value = this.form.value;
    if (value.rentalUnit === 'whole_room') {
      value.workstationCount = 1;
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
}
