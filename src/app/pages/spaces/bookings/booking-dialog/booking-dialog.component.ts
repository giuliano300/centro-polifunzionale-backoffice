import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthUser } from '../../../../interfaces/auth-user';
import { Spaces } from '../../../../interfaces/spaces';
import { AvailabilitySlot, BookingService } from '../../../../services/Booking.service';
import { UsersService } from '../../../../services/User.service';

export interface BookingDialogData {
  space: Spaces;
}

@Component({
  selector: 'app-booking-dialog',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './booking-dialog.component.html',
  styleUrl: './booking-dialog.component.scss'
})
export class BookingDialogComponent {
  form: FormGroup;
  searchForm: FormGroup;
  newClientForm: FormGroup;
  clients: AuthUser[] = [];
  slots: AvailabilitySlot[] = [];
  selectedSlot: AvailabilitySlot | null = null;
  isLoadingSlots = false;
  isCreatingClient = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private bookingService: BookingService,
    private dialogRef: MatDialogRef<BookingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookingDialogData
  ) {
    this.searchForm = this.fb.group({
      search: ['', [Validators.required, Validators.minLength(2)]]
    });
    this.newClientForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      taxCode: ['', [this.taxCodeValidator]]
    });
    this.form = this.fb.group({
      userId: ['', [Validators.required]],
      name: ['Prenotazione spazio', [Validators.required, Validators.maxLength(140)]],
      date: ['', [Validators.required]],
      rentalMode: [this.data.space.rentalModes?.[0] || 'time', [Validators.required]],
      workstationQuantity: [1, [Validators.required, Validators.min(1)]],
      slotKey: ['', [Validators.required]]
    });

    this.form.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
  }

  get isWorkstation(): boolean {
    return this.data.space.rentalUnit === 'workstation';
  }

  get rentalModesLabel(): string {
    const modes = this.data.space.rentalModes || [];
    const hasTime = modes.includes('time');
    const hasFullDay = modes.includes('full_day');

    if (hasTime && hasFullDay) {
      return 'A tempo e giornata';
    }

    return hasFullDay ? 'Tutta la giornata' : 'A tempo';
  }

  searchClients(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.usersService.searchClients(this.searchForm.value.search).subscribe((clients) => {
      this.clients = clients.filter((client) => client.isActive !== false);
    });
  }

  createClient(): void {
    if (this.newClientForm.invalid || this.isCreatingClient) {
      this.newClientForm.markAllAsTouched();
      return;
    }

    this.isCreatingClient = true;
    this.errorMessage = '';

    this.usersService.createClient({
      ...this.newClientForm.value,
      password: this.generateTemporaryPassword(),
      role: 'cliente'
    }).subscribe({
      next: (user) => {
        this.clients = [user, ...this.clients.filter((client) => client._id !== user._id)];
        this.form.patchValue({ userId: user._id });
        this.newClientForm.reset();
        this.isCreatingClient = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Creazione cliente non riuscita.';
        this.isCreatingClient = false;
      }
    });
  }

  loadAvailability(): void {
    if (!this.form.value.date || !this.form.value.rentalMode) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoadingSlots = true;
    this.slots = [];
    this.selectedSlot = null;
    this.form.patchValue({ slotKey: '' }, { emitEvent: false });

    this.bookingService.getAvailability(
      this.data.space._id,
      this.form.value.date,
      this.form.value.rentalMode,
      Number(this.form.value.workstationQuantity || 1)
    ).subscribe({
      next: (result) => {
        this.slots = (result.slots || []).filter((slot) => slot.available);
        this.isLoadingSlots = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Disponibilita non calcolabile.';
        this.isLoadingSlots = false;
      }
    });
  }

  selectSlot(key: string): void {
    this.selectedSlot = this.slots.find((slot) => this.getSlotKey(slot) === key) || null;
  }

  submit(): void {
    if (this.form.invalid || !this.selectedSlot || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.bookingService.create({
      spaceId: this.data.space._id,
      userId: this.form.value.userId,
      name: this.form.value.name,
      date: this.form.value.date,
      startTime: this.selectedSlot.startTime,
      endTime: this.selectedSlot.endTime,
      rentalUnit: this.data.space.rentalUnit,
      rentalMode: this.form.value.rentalMode,
      workstationQuantity: this.isWorkstation ? Number(this.form.value.workstationQuantity) : 1
    }).subscribe({
      next: (booking) => this.dialogRef.close(booking),
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Creazione prenotazione non riuscita.';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  getSlotKey(slot: AvailabilitySlot): string {
    return `${slot.startTime}-${slot.endTime}`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  }

  private generateTemporaryPassword(): string {
    return 'Cliente' + Math.random().toString(36).slice(2, 10) + '!';
  }

  private taxCodeValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').trim().toUpperCase();
    if (!value) {
      return null;
    }

    if (!/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(value)) {
      return { taxCode: true };
    }

    const oddMap: Record<string, number> = {
      '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
      A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
      N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
    };
    const evenMap: Record<string, number> = {
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12,
      N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
    };
    const sum = value.slice(0, 15).split('').reduce((total, char, index) => {
      return total + ((index + 1) % 2 === 1 ? oddMap[char] : evenMap[char]);
    }, 0);

    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[sum % 26] === value[15] ? null : { taxCode: true };
  }
}
