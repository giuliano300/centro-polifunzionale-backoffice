import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NgIf } from '@angular/common';
import { SystemSettingsService } from '../../services/SystemSettings.service';
import { ActivatedRoute } from '@angular/router';

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
  savedClientCredit = 0;
  savedManagerCredit = 0;
  mode: 'cliente' | 'gestore' = 'cliente';

  form = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private systemSettingsService: SystemSettingsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['walletRole'] === 'gestore' ? 'gestore' : 'cliente';
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.systemSettingsService.getSettings().subscribe({
      next: (settings) => {
        const clientCredit = settings.newClientWalletCredit ?? settings.newUserWalletCredit ?? 0;
        const managerCredit = settings.newManagerWalletCredit ?? settings.newUserWalletCredit ?? 0;
        this.form.patchValue({
          amount: this.mode === 'cliente' ? clientCredit : managerCredit
        });
        this.savedClientCredit = clientCredit;
        this.savedManagerCredit = managerCredit;
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
    const amount = Number(this.form.value.amount || 0);
    const newClientWalletCredit = this.mode === 'cliente' ? amount : this.savedClientCredit;
    const newManagerWalletCredit = this.mode === 'gestore' ? amount : this.savedManagerCredit;

    this.systemSettingsService.updateSettings({
      newUserWalletCredit: newClientWalletCredit,
      newClientWalletCredit,
      newManagerWalletCredit
    }).subscribe({
      next: () => {
        this.savedClientCredit = newClientWalletCredit;
        this.savedManagerCredit = newManagerWalletCredit;
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

  pageTitle(): string {
    return this.mode === 'cliente' ? 'Wallet nuovi clienti' : 'Wallet nuovi gestori';
  }

  currentCredit(): number {
    return this.mode === 'cliente' ? this.savedClientCredit : this.savedManagerCredit;
  }

  targetLabel(): string {
    return this.mode === 'cliente' ? 'clienti' : 'gestori';
  }
}
