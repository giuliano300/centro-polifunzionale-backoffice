import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NgIf } from '@angular/common';
import { SystemSettingsService } from '../../services/SystemSettings.service';

@Component({
  selector: 'app-system-settings',
  imports: [NgIf, ReactiveFormsModule, MatButtonModule, MatCardModule],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss'
})
export class SystemSettingsComponent {
  private fb = inject(FormBuilder);
  isLoading = true;
  isSaving = false;
  message = '';
  messageType: 'success' | 'warning' = 'warning';
  savedCredit = 0;

  form = this.fb.group({
    newUserWalletCredit: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private systemSettingsService: SystemSettingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.systemSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.form.patchValue({
          newUserWalletCredit: settings.newUserWalletCredit || 0
        });
        this.savedCredit = settings.newUserWalletCredit || 0;
        this.isLoading = false;
      },
      error: () => {
        this.messageType = 'warning';
        this.message = 'Impostazioni non disponibili.';
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.message = '';
    const newUserWalletCredit = Number(this.form.value.newUserWalletCredit || 0);

    this.systemSettingsService.updateSettings({
      newUserWalletCredit
    }).subscribe({
      next: () => {
        this.savedCredit = newUserWalletCredit;
        this.messageType = 'success';
        this.message = 'Impostazioni salvate.';
        this.isSaving = false;
      },
      error: (error) => {
        this.messageType = 'warning';
        this.message = error?.error?.message || 'Impostazioni non salvate.';
        this.isSaving = false;
      }
    });
  }

  formatCurrency(value?: number | null): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }
}
