import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-detail-location-dialog',
  templateUrl: './detail-location-dialog.component.html',
  styleUrls: ['./detail-location-dialog.component.scss'],
  standalone:true,
  imports: [MatDialogModule]
})
export class DetailLocationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DetailLocationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

  onCancel(): void {
    this.dialogRef.close(false); // L'utente ha annullato
  }
}
