import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { SpacesService } from '../../../services/Space.service';
import { SpaceOpeningSlot, Spaces } from '../../../interfaces/spaces';

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
      openingHours: this.fb.array(this.days.map((day) => this.createOpeningSlot(day.value))),
      isAvailable: [true]
    });
    this.form.get('rentalModes')?.valueChanges.subscribe(() => this.syncRentalModeValidators());
    this.syncRentalModeValidators();
  }

  get openingHours(): FormArray {
    return this.form.get('openingHours') as FormArray;
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
      closeTime: ['18:00', [Validators.required]]
    });
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
            dailyRate: space.dailyRate || 0
          });
          this.openingHours.clear();
          this.days.forEach((day) => {
            const saved = openingHours.find((slot) => slot.day === day.value);
            const group = this.createOpeningSlot(day.value);
            group.patchValue(saved || {});
            this.openingHours.push(group);
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
    }
    if (!this.hasFullDayRental) {
      value.dailyRate = 0;
    }

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
