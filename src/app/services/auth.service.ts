import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_URL } from '../../main';
import { JwtPayloads } from '../interfaces/JwtPayloads';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoginSubject = new BehaviorSubject<boolean>(this.getBooleanFromStorage('isLogin'));
  private loginNameSubject = new BehaviorSubject<string>("");
  
  constructor(private http: HttpClient) { }

  // Osservabili pubblici
  isLogin$ = this.isLoginSubject.asObservable();
  loginName$ = this.loginNameSubject.asObservable();

  setLoginName(value: string) {
    localStorage.setItem('loginName', JSON.stringify(value));
    this.loginNameSubject.next(value);
  }

  setIsLogin(value: boolean) {
    localStorage.setItem('isLogin', JSON.stringify(value));
    this.isLoginSubject.next(value);
  }

  decodeToken(token: any): JwtPayloads | null {
    try {
      const decoded = jwtDecode<JwtPayloads>(token.access_token);
      return decoded;
    } catch (error) {
      console.error('Errore decodifica JWT', error);
      return null;
    }
  }

  decodeRawToken(token: string): JwtPayloads | null {
    try {
      return jwtDecode<JwtPayloads>(token);
    } catch (error) {
      console.error('Errore decodifica JWT', error);
      return null;
    }
  }

  isTokenValid(token: string | null): boolean {
    if (!token) {
      return false;
    }

    const decoded = this.decodeRawToken(token);
    if (!decoded?.exp) {
      return false;
    }

    return decoded.exp * 1000 > Date.now();
  }

  // Pulisce i ruoli
  clearRoles() {
    localStorage.removeItem('isLogin');
    localStorage.removeItem('loginName');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.isLoginSubject.next(false);
    this.loginNameSubject.next("");
  }

  // Legge da localStorage
  private getBooleanFromStorage(key: string): boolean {
    return localStorage.getItem(key) === 'true';
  }

}
