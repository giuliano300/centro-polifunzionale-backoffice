import { Component, ViewChild } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { AuthUser } from '../../interfaces/auth-user';
import { UsersService } from '../../services/User.service';
import { UserRole } from '../../interfaces/roles/roles';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

type UserRow = AuthUser & { action: { delete: string; toggle: string } };

@Component({
  selector: 'app-users',
  imports: [NgIf, NgFor, RouterLink, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule, MatTableModule, FeathericonsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  displayedColumns: string[] = ['name', 'email', 'phone', 'taxCode', 'role', 'status', 'edit', 'toggle', 'delete'];
  dataSource = new MatTableDataSource<UserRow>([]);
  users: UserRow[] = [];
  filterForm: FormGroup;
  userForm: FormGroup;
  editingUser: UserRow | null = null;
  isUserModalOpen = false;
  userMessage = '';
  completeUrl = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: ['']
    });
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      taxCode: [''],
      role: [UserRole.Cliente, Validators.required],
      password: [''],
      sendCompletionLink: [true],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.usersService.getUsers(this.filterForm.value.search).subscribe((data: AuthUser[]) => {
      this.users = data.map((user) => ({
        ...user,
        action: {
          delete: 'ri-delete-bin-line',
          toggle: user.isActive === false ? 'ri-play-circle-line' : 'ri-pause-circle-line'
        }
      }));
      this.dataSource = new MatTableDataSource<UserRow>(this.users);
      this.dataSource.paginator = this.paginator;
    });
  }

  applyFilters(): void {
    this.getUsers();
  }

  resetFilters(): void {
    this.filterForm.patchValue({ search: '' });
    this.applyFilters();
  }

  DeleteItem(item: UserRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '860px',
      minWidth: 'min(800px, 94vw)',
      maxWidth: '94vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.usersService.deleteUser(item._id).subscribe(() => this.getUsers());
      }
    });
  }

  OpenCreate(): void {
    this.editingUser = null;
    this.completeUrl = '';
    this.userMessage = '';
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
    this.isUserModalOpen = true;
  }

  OpenEdit(item: UserRow): void {
    this.editingUser = item;
    this.completeUrl = '';
    this.userMessage = '';
    this.userForm.reset({
      name: item.name,
      email: item.email,
      phone: item.phone || '',
      taxCode: item.taxCode || '',
      role: item.role,
      password: '',
      sendCompletionLink: false,
      isActive: item.isActive !== false
    });
    this.isUserModalOpen = true;
  }

  CloseUserModal(): void {
    this.isUserModalOpen = false;
  }

  SaveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();
    const payload = {
      name: raw.name,
      email: raw.email,
      phone: raw.phone || undefined,
      taxCode: raw.taxCode || undefined,
      role: raw.role,
      isActive: raw.isActive !== false,
      password: raw.password || 'Utente123!'
    };

    if (this.editingUser) {
      const updatePayload = { ...payload };
      if (!raw.password) {
        delete (updatePayload as Partial<typeof payload>).password;
      }
      this.usersService.updateUser(this.editingUser._id, updatePayload).subscribe({
        next: () => {
          this.CloseUserModal();
          this.getUsers();
        },
        error: (error) => this.userMessage = error?.error?.message || 'Utente non salvato.'
      });
      return;
    }

    if (raw.sendCompletionLink) {
      this.usersService.inviteUser(payload).subscribe({
        next: (result) => {
          this.completeUrl = result.completeUrl;
          this.userMessage = 'Utente creato con link di completamento.';
          this.getUsers();
        },
        error: (error) => this.userMessage = error?.error?.message || 'Invito non creato.'
      });
      return;
    }

    this.usersService.createClient(payload).subscribe({
      next: () => {
        this.CloseUserModal();
        this.getUsers();
      },
      error: (error) => this.userMessage = error?.error?.message || 'Utente non creato.'
    });
  }

  ToggleActive(item: UserRow): void {
    this.usersService.updateUser(item._id, { isActive: item.isActive === false }).subscribe(() => this.getUsers());
  }

  getStatusLabel(item: UserRow): string {
    return item.isActive === false ? 'Disattivo' : 'Attivo';
  }

  canManageUser(item: UserRow): boolean {
    return item.role !== UserRole.Admin;
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
