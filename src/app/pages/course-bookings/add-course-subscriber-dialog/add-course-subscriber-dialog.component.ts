import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
      taxCode: ['']
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
}
