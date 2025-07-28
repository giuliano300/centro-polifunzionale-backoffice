import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CustomDateFormatPipe } from '../custom-date-format.pipe';

@Component({
  selector: 'app-bonus-dialog',
  imports: [MatDialogModule, CustomDateFormatPipe],
  templateUrl: './bonus-dialog.component.html',
  styleUrl: './bonus-dialog.component.scss'
})
export class BonusDialogComponent {
constructor(
  public dialogRef: MatDialogRef<BonusDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  quarters: any[] = [{id: 1, name: "1st quarter"}, {id: 2, name: "2nd quarter"}, {id: 3, name: "3rd quarter"}, {id: 4, name: "4th quarter"}];

  getQuarterName(id: number): string {
    const q = this.quarters.find(q => q.id === id);
    return q ? q.name : '';
  }

  onCancel(): void {
    this.dialogRef.close(false); // L'utente ha annullato
  }
}
