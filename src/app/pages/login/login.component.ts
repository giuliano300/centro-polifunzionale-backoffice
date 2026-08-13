import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth.service';
import { NotificationsService } from '../../core/notifications.service';
import { environment } from '../../../environments/environment';
import { NagoraLogoComponent } from '../../shared/nagora-logo.component';
import { timeout } from 'rxjs';

declare global {
  interface Window { google?: any; FB?: any; fbAsyncInit?: () => void; }
}

@Component({
  selector: 'backoffice-login',
  imports: [NgIf, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, NagoraLogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  isLoading = false;
  isRecovery = false;
  isRegistration = false;
  resetToken = '';
  registrationOtpRequested = false;
  registrationEmail = '';
  registrationPhone = '';
  registrationOtpCooldown = 0;
  devEmailOtp = '';
  devPhoneOtp = '';
  devResetUrl = '';
  hideLoginPassword = true;
  hideResetPassword = true;
  hideResetConfirmPassword = true;
  hideRegistrationPassword = true;
  hideRegistrationConfirmPassword = true;
  errorMessage = '';
  successMessage = '';
  socialCompletionToken = '';
  socialEmail = '';
  socialOtpRequested = false;
  socialOtpCooldown = 0;
  socialProvider: 'google' | 'facebook' | '' = '';
  readonly googleConfigured = Boolean(environment.googleClientId);
  showSplash = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  @ViewChild('splashLogo', { read: ElementRef }) private splashLogo?: ElementRef<HTMLElement>;
  @ViewChild('finalLogo', { read: ElementRef }) private finalLogo?: ElementRef<HTMLElement>;
  private googleButtonElement?: HTMLElement;
  private googleIdentityInitialized = false;
  private googleOneTapPrompted = false;
  private googleOneTapTimer?: ReturnType<typeof setTimeout>;
  private socialOtpCooldownTimer?: ReturnType<typeof setInterval>;
  private registrationOtpCooldownTimer?: ReturnType<typeof setInterval>;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  recoveryForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetTokenForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  registrationForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, this.italianMobilePhoneValidator]],
    taxCode: ['', [Validators.required, this.taxCodeValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    acceptedDataProcessing: [false, Validators.requiredTrue],
  });

  otpForm = this.fb.group({
    emailOtp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    phoneOtp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  socialCompletionForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, this.italianMobilePhoneValidator]],
    taxCode: ['', [Validators.required, this.taxCodeValidator]],
    phoneOtp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    acceptedDataProcessing: [false, Validators.requiredTrue],
  });

  @ViewChild('googleButton') set googleButton(element: ElementRef<HTMLElement> | undefined) {
    this.googleButtonElement = element?.nativeElement;
    if (this.googleButtonElement) {
      setTimeout(() => this.initializeGoogleButton());
    }
  }

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute, private notifications: NotificationsService) {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('resetToken') || '';
      if (!token) {
        return;
      }

      this.resetToken = token;
      this.isRecovery = true;
      this.isRegistration = false;
      this.errorMessage = '';
      this.successMessage = '';
    });
  }

  ngAfterViewInit(): void {
    if (!this.showSplash) return;
    window.requestAnimationFrame(() => this.playSplashLogoAnimation());
  }

  ngOnDestroy(): void {
    if (this.googleOneTapTimer) clearTimeout(this.googleOneTapTimer);
    if (this.socialOtpCooldownTimer) clearInterval(this.socialOtpCooldownTimer);
    if (this.registrationOtpCooldownTimer) clearInterval(this.registrationOtpCooldownTimer);
  }

  private playSplashLogoAnimation(): void {
    const splashLogo = this.splashLogo?.nativeElement;
    const finalLogo = this.finalLogo?.nativeElement;
    if (!splashLogo || !finalLogo) return;

    const start = splashLogo.getBoundingClientRect();
    const target = finalLogo.getBoundingClientRect();
    const translateX = target.left + target.width / 2 - (start.left + start.width / 2);
    const translateY = target.top + target.height / 2 - (start.top + start.height / 2);
    const targetScale = target.width / start.width;
    const animation = splashLogo.animate([
      { opacity: 0, transform: 'translate(0, 0) scale(.92)', offset: 0 },
      { opacity: 0, transform: 'translate(0, 0) scale(.92)', offset: .12 },
      { opacity: 1, transform: 'translate(0, 0) scale(1)', offset: .28 },
      { opacity: 1, transform: 'translate(0, 0) scale(1)', offset: .85, easing: 'cubic-bezier(.4, 0, .2, 1)' },
      { opacity: 1, transform: `translate(${translateX}px, ${translateY}px) scale(${targetScale})`, offset: 1 },
    ], { duration: 6000, fill: 'forwards', easing: 'linear' });

    animation.addEventListener('finish', () => {
      this.showSplash = false;
      this.cdr.detectChanges();
    }, { once: true });
  }

  signInWithFacebook(): void {
    if (!environment.facebookAppId) {
      this.errorMessage = 'Accesso Facebook non ancora configurato.';
      return;
    }
    this.isLoading = true;
    this.loadScript('https://connect.facebook.net/it_IT/sdk.js').then(() => {
      window.FB.init({
        appId: environment.facebookAppId,
        cookie: true,
        xfbml: false,
        version: 'v23.0',
      });
      window.FB.login((response: any) => this.ngZone.run(() => {
        const accessToken = response?.authResponse?.accessToken;
        if (!accessToken) {
          this.errorMessage = 'Accesso Facebook annullato o non autorizzato.';
          this.isLoading = false;
          return;
        }
        this.handleSocialToken('facebook', accessToken);
      }), { scope: 'public_profile,email' });
    }).catch(() => {
      this.errorMessage = 'Accesso Facebook non disponibile.';
      this.isLoading = false;
    });
  }

  socialNotConfigured(provider: string): void {
    this.successMessage = '';
    this.errorMessage = `Accesso ${provider} pronto graficamente: manca solo la configurazione del Client ID.`;
  }

  requestSocialOtp(): void {
    const phone = this.socialCompletionForm.controls.phone.value || '';
    if (this.socialCompletionForm.controls.phone.invalid || this.isLoading || this.socialOtpCooldown > 0) {
      this.socialCompletionForm.controls.phone.markAsTouched();
      return;
    }
    this.isLoading = true;
    this.auth.requestSocialPhoneOtp(this.socialCompletionToken, phone).subscribe({
      next: (response) => {
        this.socialOtpRequested = true;
        this.successMessage = `OTP inviato a ${response.phone}.`;
        if (response.devPhoneOtp) this.successMessage += ` OTP sviluppo: ${response.devPhoneOtp}`;
        this.startSocialOtpCooldown(response.retryAfterSeconds || 120);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Invio OTP non riuscito.';
        if (error?.error?.retryAfterSeconds) this.startSocialOtpCooldown(error.error.retryAfterSeconds);
        this.isLoading = false;
      },
    });
  }

  private startSocialOtpCooldown(seconds: number): void {
    if (this.socialOtpCooldownTimer) clearInterval(this.socialOtpCooldownTimer);
    this.socialOtpCooldown = Math.max(0, Math.ceil(seconds));
    this.socialOtpCooldownTimer = setInterval(() => {
      this.socialOtpCooldown = Math.max(0, this.socialOtpCooldown - 1);
      if (this.socialOtpCooldown === 0 && this.socialOtpCooldownTimer) {
        clearInterval(this.socialOtpCooldownTimer);
        this.socialOtpCooldownTimer = undefined;
      }
    }, 1000);
  }

  completeSocialProfile(): void {
    if (this.socialCompletionForm.invalid || !this.socialOtpRequested || this.isLoading) {
      this.socialCompletionForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const value = this.socialCompletionForm.getRawValue();
    this.auth.completeSocialRegistration({
      completionToken: this.socialCompletionToken,
      name: value.name || '', phone: value.phone || '', taxCode: value.taxCode || '',
      phoneOtp: value.phoneOtp || '', acceptedDataProcessing: value.acceptedDataProcessing === true,
    }).subscribe({
      next: () => this.finishSocialLogin(),
      error: (error) => { this.errorMessage = error?.error?.message || 'Completamento profilo non riuscito.'; this.isLoading = false; },
    });
  }

  private initializeGoogleButton(): void {
    if (!this.googleButtonElement || !environment.googleClientId) return;
    this.loadScript('https://accounts.google.com/gsi/client').then(() => {
      if (!this.googleIdentityInitialized) {
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.ngZone.run(() => this.handleSocialToken('google', response.credential)),
          auto_select: false,
          context: 'signin',
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
        });
        this.googleIdentityInitialized = true;
      }
      this.googleButtonElement!.innerHTML = '';
      window.google.accounts.id.renderButton(this.googleButtonElement, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill',
        width: Math.max(140, Math.floor(this.googleButtonElement!.getBoundingClientRect().width)),
      });

      if (!this.googleOneTapPrompted) {
        this.googleOneTapPrompted = true;
        this.googleOneTapTimer = setTimeout(() => {
          window.google.accounts.id.prompt();
          this.googleOneTapTimer = undefined;
        }, 7000);
      }
    }).catch(() => {
      this.errorMessage = 'Accesso Google non disponibile.';
    });
  }

  private handleSocialToken(provider: 'google' | 'facebook', idToken?: string, name?: string): void {
    if (!idToken) { this.errorMessage = 'Il provider non ha restituito credenziali valide.'; this.isLoading = false; return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.auth.socialSignIn(provider, idToken, name).pipe(timeout(15000)).subscribe({
      next: (response) => {
        if (!response.completionRequired) { this.finishSocialLogin(); return; }
        this.socialProvider = provider;
        this.socialCompletionToken = response.completionToken;
        this.socialEmail = response.profile?.email || '';
        this.socialCompletionForm.patchValue({ name: response.profile?.name || '' });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.name === 'TimeoutError'
          ? `${provider === 'google' ? 'Google' : 'Facebook'} ha completato l’accesso, ma il server non ha risposto entro 15 secondi.`
          : error?.error?.message || 'Accesso social non riuscito.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private finishSocialLogin(): void {
    if (!this.auth.isAdmin()) {
      this.auth.logout();
      this.errorMessage = 'Accesso consentito solo agli amministratori.';
      this.isLoading = false;
      return;
    }
    this.notifications.connect();
    this.router.navigate(['/']);
  }

  private loadScript(src: string): Promise<void> {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing?.dataset['loaded'] === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => { script.dataset['loaded'] = 'true'; resolve(); };
      script.onerror = () => reject();
      if (!existing) document.head.appendChild(script);
    });
  }

  submit(): void {
    if (this.form.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email || '', password || '').subscribe({
      next: () => {
        if (!this.auth.isAdmin()) {
          this.auth.logout();
          this.errorMessage = 'Accesso consentito solo agli amministratori.';
          this.isLoading = false;
          return;
        }

        this.notifications.connect();
        this.router.navigate(['/']);
      },
      error: (error) => {
        const message = error?.error?.message || '';
        this.errorMessage = message.toLowerCase().includes('utente disattivato')
          ? "Utente disattivato, contattare l'amministrazione."
          : 'Username o password errati.';
        this.isLoading = false;
      },
    });
  }

  toggleRecovery(): void {
    this.isRecovery = !this.isRecovery;
    this.isRegistration = false;
    if (!this.isRecovery) {
      this.resetToken = '';
      this.devResetUrl = '';
      this.router.navigate(['/login']);
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleRegistration(): void {
    this.isRegistration = !this.isRegistration;
    this.isRecovery = false;
    this.resetToken = '';
    this.devResetUrl = '';
    this.registrationOtpRequested = false;
    this.registrationEmail = '';
    this.registrationPhone = '';
    this.devEmailOtp = '';
    this.devPhoneOtp = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetPassword(): void {
    if (this.recoveryForm.invalid || this.isLoading) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    const { email } = this.recoveryForm.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.devResetUrl = '';
    this.auth.requestManagerPasswordResetLink(email || '').subscribe({
      next: (response) => {
        this.devResetUrl = response.devResetUrl || '';
        this.successMessage = `Link di recupero inviato a ${response.email}. Valido ${response.expiresInMinutes} minuti.`;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Invio link non riuscito.';
        this.isLoading = false;
      },
    });
  }

  confirmResetPassword(): void {
    if (this.resetTokenForm.invalid || this.isLoading) {
      this.resetTokenForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.resetTokenForm.getRawValue();
    if (password !== confirmPassword) {
      this.errorMessage = 'Le password non coincidono.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.auth.confirmManagerPasswordReset(this.resetToken, password || '').subscribe({
      next: (response) => {
        this.successMessage = 'Password aggiornata. Ora puoi effettuare il login.';
        this.form.patchValue({ email: response.email, password });
        this.resetTokenForm.reset();
        this.isRecovery = false;
        this.resetToken = '';
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Aggiornamento password non riuscito.';
        this.isLoading = false;
      },
    });
  }

  requestRegistrationOtp(): void {
    if (this.registrationForm.invalid || this.isLoading || this.registrationOtpCooldown > 0) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const { name, email, phone, taxCode, password, confirmPassword, acceptedDataProcessing } = this.registrationForm.getRawValue();
    if (password !== confirmPassword) {
      this.errorMessage = 'Le password non coincidono.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.devEmailOtp = '';
    this.devPhoneOtp = '';
    this.auth.requestManagerRegistrationOtp({
      name: name || '',
      email: email || '',
      phone: phone || '',
      taxCode: taxCode || '',
      password: password || '',
      acceptedDataProcessing: acceptedDataProcessing === true,
    }).subscribe({
      next: (response) => {
        this.registrationOtpRequested = true;
        this.registrationEmail = response.email;
        this.registrationPhone = response.phone;
        this.devEmailOtp = response.devEmailOtp || '';
        this.devPhoneOtp = response.devPhoneOtp || '';
        this.successMessage = `OTP inviati a ${response.email} e ${response.phone}. Validi ${response.expiresInMinutes} minuti.`;
        this.startRegistrationOtpCooldown(response.retryAfterSeconds || 120);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Registrazione non avviata.';
        if (error?.error?.retryAfterSeconds) this.startRegistrationOtpCooldown(error.error.retryAfterSeconds);
        this.isLoading = false;
      },
    });
  }

  private startRegistrationOtpCooldown(seconds: number): void {
    if (this.registrationOtpCooldownTimer) clearInterval(this.registrationOtpCooldownTimer);
    this.registrationOtpCooldown = Math.max(0, Math.ceil(seconds));
    this.registrationOtpCooldownTimer = setInterval(() => {
      this.registrationOtpCooldown = Math.max(0, this.registrationOtpCooldown - 1);
      if (this.registrationOtpCooldown === 0 && this.registrationOtpCooldownTimer) {
        clearInterval(this.registrationOtpCooldownTimer);
        this.registrationOtpCooldownTimer = undefined;
      }
    }, 1000);
  }

  confirmRegistrationOtp(): void {
    if (this.otpForm.invalid || this.isLoading) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.auth.confirmManagerRegistrationOtp(
      this.registrationEmail,
      this.otpForm.value.emailOtp || '',
      this.otpForm.value.phoneOtp || '',
    ).subscribe({
      next: () => {
        const { email, password } = this.registrationForm.getRawValue();
        this.successMessage = 'Registrazione completata. Ora puoi effettuare il login.';
        this.form.patchValue({ email, password });
        this.registrationForm.reset();
        this.otpForm.reset();
        this.isRegistration = false;
        this.registrationOtpRequested = false;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'OTP non confermato.';
        this.isLoading = false;
      },
    });
  }

  private taxCodeValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').trim().toUpperCase();
    if (!value) {
      return null;
    }

    if (!/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(value)) {
      return { taxCode: true };
    }

    const oddMap: Record<string, number> = {
      '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
      A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
      N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
    };
    const evenMap: Record<string, number> = {
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12,
      N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
    };
    const sum = value.slice(0, 15).split('').reduce((total, char, index) => {
      return total + ((index + 1) % 2 === 1 ? oddMap[char] : evenMap[char]);
    }, 0);

    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[sum % 26] === value[15] ? null : { taxCode: true };
  }

  private italianMobilePhoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value || '').replace(/[\s./()-]/g, '');
    if (!value) {
      return null;
    }

    return /^3[0-9]{8,9}$/.test(value) ? null : { italianMobilePhone: true };
  }
}
