import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgFor } from '@angular/common';
import { CustomDateFormatPipe } from "../custom-date-format.pipe";

@Component({
  selector: 'app-disciplinary-dialog',
  imports: [MatDialogModule, NgFor, CustomDateFormatPipe],
  templateUrl: './disciplinary-dialog.component.html',
  styleUrl: './disciplinary-dialog.component.scss'
})
export class DisciplinaryDialogComponent {
constructor(
    public dialogRef: MatDialogRef<DisciplinaryDialogComponent>,
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
