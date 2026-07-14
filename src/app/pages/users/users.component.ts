import { Component, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { AuthUser } from '../../interfaces/auth-user';
import { UsersService } from '../../services/User.service';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';

type UserRow = AuthUser & { action: { delete: string; toggle: string } };

@Component({
  selector: 'app-users',
  imports: [NgIf, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatTableModule, FeathericonsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  displayedColumns: string[] = ['name', 'email', 'phone', 'taxCode', 'role', 'status', 'toggle', 'delete'];
  dataSource = new MatTableDataSource<UserRow>([]);
  users: UserRow[] = [];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: ['']
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

  ToggleActive(item: UserRow): void {
    this.usersService.updateUser(item._id, { isActive: item.isActive === false }).subscribe(() => this.getUsers());
  }

  getStatusLabel(item: UserRow): string {
    return item.isActive === false ? 'Disattivo' : 'Attivo';
  }

  canManageUser(item: UserRow): boolean {
    return item.role !== 'admin';
  }
}
