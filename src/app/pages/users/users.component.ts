import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { AuthUser } from '../../interfaces/auth-user';
import { UsersService } from '../../services/User.service';

type UserRow = AuthUser & { action: { delete: string } };

@Component({
  selector: 'app-users',
  imports: [MatButtonModule, MatCardModule, MatPaginatorModule, MatTableModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  displayedColumns: string[] = ['name', 'email', 'role', 'delete'];
  dataSource = new MatTableDataSource<UserRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.usersService.getUsers().subscribe((data: AuthUser[]) => {
      this.dataSource = new MatTableDataSource<UserRow>(
        data
          .filter((user) => user.role !== 'admin')
          .map((user) => ({
            ...user,
            action: { delete: 'ri-delete-bin-line' }
          }))
      );
      this.dataSource.paginator = this.paginator;
    });
  }

  DeleteItem(item: UserRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.usersService.deleteUser(item._id).subscribe(() => this.getUsers());
      }
    });
  }
}
