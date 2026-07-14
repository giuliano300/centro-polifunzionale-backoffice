import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { environment } from './environments/environment';

export const API_URL = environment.apiUrl;
export const TOKEN_KEY = 'a-string-secret-at-least-256-bits-long';
export const exceedsLimit = 3;
export const maxLenghtUploadFile = 2;

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideToastr(), 
    provideHttpClient(),
    provideAuth(() => getAuth()),
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
  ]
}).catch(err => console.error(err));
