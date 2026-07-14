import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthUser } from '../../../interfaces/auth-user';
import { CourseBookingService } from '../../../services/CourseBooking.service';
import { UsersService } from '../../../services/User.service';

export interface AddCourseSubscriberDialogData {
  courseId: string;
}

@Component({
  selector: 'app-add-course-subscriber-dialog',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
  ],
  templateUrl: './add-course-subscriber-dialog.component.html',
  styleUrl: './add-course-subscriber-dialog.component.scss'
})
export class AddCourseSubscriberDialogComponent {
  searchForm: FormGroup;
  newClientForm: FormGroup;
  results: AuthUser[] = [];
  selectedUser: AuthUser | null = null;
  isSearching = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private courseBookingService: CourseBookingService,
    private dialogRef: MatDialogRef<AddCourseSubscriberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCourseSubscriberDialogData
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
  }

  searchClients(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';
    this.selectedUser = null;
    this.usersService.searchClients(this.searchForm.value.search).subscribe({
      next: (users) => {
        this.results = users;
        this.isSearching = false;
      },
      error: () => {
        this.errorMessage = 'Ricerca cliente non riuscita.';
        this.isSearching = false;
      }
    });
  }

  selectUser(user: AuthUser): void {
    this.selectedUser = user;
    this.errorMessage = '';
  }

  addSelectedUser(): void {
    if (!this.selectedUser || this.isSaving) {
      return;
    }

    this.createCourseBooking(this.selectedUser._id);
  }

  createAndAddClient(): void {
    if (this.newClientForm.invalid || this.isSaving) {
      this.newClientForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.usersService.createClient({
      ...this.newClientForm.value,
      password: this.generateTemporaryPassword(),
      role: 'cliente'
    }).subscribe({
      next: (user) => this.createCourseBooking(user._id),
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Creazione cliente non riuscita.';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private createCourseBooking(userId: string): void {
    this.isSaving = true;
    this.errorMessage = '';

    this.courseBookingService.createCourseBooking({
      courseId: this.data.courseId,
      userId
    }).subscribe({
      next: (booking) => this.dialogRef.close(booking),
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Iscrizione al corso non riuscita.';
        this.isSaving = false;
      }
    });
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
