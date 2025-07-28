import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CustomDateFormatPipe } from "../custom-date-format.pipe";
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-incident-accident-dialog',
  imports: [MatDialogModule, CustomDateFormatPipe, NgFor],
  templateUrl: './incident-accident-dialog.component.html',
  styleUrl: './incident-accident-dialog.component.scss'
})
export class IncidentAccidentDialogComponent {
 constructor(
    public dialogRef: MatDialogRef<IncidentAccidentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

  onCancel(): void {
    this.dialogRef.close(false); // L'utente ha annullato
  }

    downloadFile(file: { name: string, base64: string }) {
      const byteCharacters = atob(file.base64);
      const byteNumbers = new Array(byteCharacters.length).fill(null).map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
  }

}
