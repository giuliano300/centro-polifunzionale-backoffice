import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserRole } from '../../../interfaces/roles/roles';
import { CreateClientUser, UsersService } from '../../../services/User.service';

@Component({
  selector: 'app-user-form',
  imports: [NgIf, NgFor, RouterLink, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  userMessage = '';
  userMessageType: 'success' | 'error' = 'success';
  completeUrl = '';
  isSaving = false;

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    taxCode: [''],
    role: [UserRole.Cliente, Validators.required],
    password: [''],
    sendCompletionLink: [true],
    isActive: [true]
  });

  constructor(
    private usersService: UsersService,
    private router: Router
  ) {}

  SaveUser(): void {
    this.userMessage = '';
    this.completeUrl = '';

    if (this.userForm.invalid || this.isSaving) {
      this.userForm.markAllAsTouched();
      this.userMessageType = 'error';
      this.userMessage = 'Compila i campi obbligatori.';
      return;
    }

    const raw = this.userForm.getRawValue();
    const role: UserRole.Cliente | UserRole.Gestore = raw.role === UserRole.Gestore ? UserRole.Gestore : UserRole.Cliente;
    const payload: CreateClientUser & { isActive: boolean } = {
      name: raw.name || '',
      email: raw.email || '',
      phone: raw.phone || undefined,
      taxCode: raw.taxCode || undefined,
      role,
      isActive: raw.isActive !== false,
      password: raw.password || 'Utente123!'
    };

    this.isSaving = true;
    if (raw.sendCompletionLink) {
      this.usersService.inviteUser(payload).subscribe({
        next: (result) => {
          this.completeUrl = result.completeUrl;
          this.userMessageType = 'success';
          this.userMessage = result.sent
            ? 'Utente creato. Link di completamento inviato.'
            : 'Utente creato con link di completamento.';
          this.isSaving = false;
          this.userForm.reset({
            name: '',
            email: '',
            phone: '',
            taxCode: '',
            role: UserRole.Cliente,
            password: '',
            sendCompletionLink: true,
            isActive: true
          });
        },
        error: (error) => {
          this.userMessageType = 'error';
          this.userMessage = error?.error?.message || 'Invito non creato.';
          this.isSaving = false;
        }
      });
      return;
    }

    this.usersService.createClient(payload).subscribe({
      next: () => this.router.navigate(['/users']),
      error: (error) => {
        this.userMessageType = 'error';
        this.userMessage = error?.error?.message || 'Utente non creato.';
        this.isSaving = false;
      }
    });
  }

  roleLabel(role: UserRole): string {
    const labels = {
      [UserRole.Admin]: 'Admin',
      [UserRole.Gestore]: 'Gestore',
      [UserRole.Cliente]: 'Cliente'
    };
    return labels[role] || role;
  }

  get userRoles(): UserRole[] {
    return [UserRole.Cliente, UserRole.Gestore];
  }
}
