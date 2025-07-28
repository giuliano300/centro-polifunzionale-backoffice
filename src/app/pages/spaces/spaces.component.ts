import { Component, ViewChild } from '@angular/core';
import { Spaces } from '../../interfaces/spaces';
import { SpacesService } from '../../services/Space.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-spaces',
  imports: [MatCardModule, MatButtonModule, MatMenuModule, MatPaginatorModule, MatTableModule, MatCheckboxModule],
  templateUrl: './spaces.component.html',
  styleUrl: './spaces.component.scss'
})
export class SpacesComponent {
 spaces: Spaces[] = [];

 displayedColumns: string[] = ['name', 'description', 'hourlyRate', 'isAvailable','viewDetails', 'edit', 'delete'];

 dataSource = new MatTableDataSource<Spaces>(this.spaces);

 @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
      private router: Router,
      private spaceService: SpacesService,
      private dialog: MatDialog
  ) {}

   ngOnInit(): void {
    this.getSpaces();
   }

   getSpaces(){
        this.spaceService.getSpaces()
        .subscribe((data: Spaces[]) => {
          if (!data || data.length === 0) {
            console.log('Nessun dato disponibile');
          } else {
            this.spaces = data.map(c => ({
                ...c, 
                action: {
                    viewDetails: 'ri-menu-search-line',
                    edit: 'ri-edit-line',
                    delete: 'ri-delete-bin-line'
                }
            }));;
            this.dataSource = new MatTableDataSource<Spaces>(this.spaces);
            this.dataSource.paginator = this.paginator;
        }
    });

   }

    DeleteItem(item:Spaces){

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '500px'
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.spaceService.delete(item._id)
            .subscribe((data: boolean) => {
              if(data){
                this.getSpaces();
              }
            });
        } 
        else 
        {
          console.log("Close");
        }
      });
    }

    UpdateItem(item:Spaces){
      this.router.navigate(["/spaces/add/" + item._id]);
    }

  }
