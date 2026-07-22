import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../main';
import { SystemSettings } from '../interfaces/system-settings';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private apiUrl = API_URL + 'system-settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(this.apiUrl, { headers: this.headers() });
  }

  updateSettings(payload: Partial<Pick<SystemSettings, 'newUserWalletCredit' | 'newClientWalletCredit' | 'newManagerWalletCredit'>>): Observable<SystemSettings> {
    return this.http.put<SystemSettings>(this.apiUrl, payload, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
