import { Component, ViewChild } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { CourseTagService } from '../../services/CourseTag.service';

type UserRow = AuthUser & { action: { delete: string; toggle: string } };

@Component({
  selector: 'app-users',
  imports: [NgIf, NgFor, RouterLink, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule, MatTableModule, FeathericonsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  readonly UserRole = UserRole;
  displayedColumns: string[] = ['name', 'email', 'phone', 'taxCode', 'role', 'status', 'wallet', 'edit', 'toggle', 'delete'];
  dataSource = new MatTableDataSource<UserRow>([]);
  users: UserRow[] = [];
  filterForm: FormGroup;
  userForm: FormGroup;
  walletCreditForm: FormGroup;
  editingUser: UserRow | null = null;
  walletCreditUser: UserRow | null = null;
  isUserModalOpen = false;
  isWalletCreditModalOpen = false;
  userMessage = '';
  walletCreditMessage = '';
  walletCreditMessageType: 'success' | 'error' = 'success';
  completeUrl = '';
  courseTagOptions: Array<{ value: string; label: string }> = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private courseTagService: CourseTagService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: ['']
    });
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      taxCode: [''],
      role: [UserRole.Cliente, Validators.required],
      interestedTags: [[] as string[]],
      password: [''],
      sendCompletionLink: [true],
      isActive: [true]
    });
    this.walletCreditForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadTags();
    this.route.queryParamMap.subscribe((params) => {
      this.filterForm.patchValue({
        search: params.get('search') || '',
        role: params.get('role') || ''
      }, { emitEvent: false });
      this.getUsers();
    });
  }

  private loadTags(): void {
    this.courseTagService.getTags().subscribe({
      next: (tags) => {
        this.courseTagOptions = tags.map((tag) => ({ value: tag.value, label: tag.label }));
      },
      error: () => {
        this.courseTagOptions = [];
      },
    });
  }

  getUsers(): void {
    this.usersService.getUsers(this.filterForm.value.search, this.filterForm.value.role).subscribe((data: AuthUser[]) => {
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
    this.filterForm.patchValue({ search: '', role: '' });
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
      interestedTags: [],
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
      interestedTags: item.interestedTags || [],
      password: '',
      sendCompletionLink: false,
      isActive: item.isActive !== false
    });
    this.isUserModalOpen = true;
  }

  CloseUserModal(): void {
    this.isUserModalOpen = false;
  }

  OpenWalletCredit(item: UserRow): void {
    this.walletCreditUser = item;
    this.walletCreditMessage = '';
    this.walletCreditMessageType = 'success';
    this.walletCreditForm.reset({
      amount: null,
      description: ''
    });
    this.isWalletCreditModalOpen = true;
  }

  CloseWalletCreditModal(): void {
    this.isWalletCreditModalOpen = false;
    this.walletCreditUser = null;
  }

  SaveWalletCredit(): void {
    if (!this.walletCreditUser) {
      return;
    }

    if (this.walletCreditForm.invalid) {
      this.walletCreditForm.markAllAsTouched();
      return;
    }

    const raw = this.walletCreditForm.getRawValue();
    this.usersService.creditWallet({
      userId: this.walletCreditUser._id,
      amount: Number(raw.amount),
      description: raw.description || undefined
    }).subscribe({
      next: () => {
        this.walletCreditMessageType = 'success';
        this.walletCreditMessage = 'Credito accreditato nel wallet.';
        this.walletCreditForm.reset({ amount: null, description: '' });
      },
      error: (error) => {
        this.walletCreditMessageType = 'error';
        this.walletCreditMessage = error?.error?.message || 'Credito non accreditato.';
      }
    });
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
      interestedTags: raw.interestedTags || [],
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

  registrationStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      complete: 'Completa',
      invited: 'Invitato'
    };
    return status ? labels[status] || status : '-';
  }

  get userRoles(): UserRole[] {
    return [UserRole.Cliente, UserRole.Gestore];
  }
}
