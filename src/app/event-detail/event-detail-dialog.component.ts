import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CustomDateFormatPipe } from "../services/custom-date-format.pipe";

@Component({
  selector: 'app-event-detail-dialog',
  templateUrl: './event-detail-dialog.component.html',
  styleUrls: ['./event-detail-dialog.component.scss'],
  standalone:true,
  imports: [MatDialogModule, CustomDateFormatPipe]
})
export class EventDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EventDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

  onCancel(): void {
    this.dialogRef.close(false); // L'utente ha annullato
  }
}
