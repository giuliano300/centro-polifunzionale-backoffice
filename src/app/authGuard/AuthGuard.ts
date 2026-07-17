import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const token = localStorage.getItem('authToken');

    if (isLogin && this.auth.isTokenValid(token)) {
      return true;
    }

    this.auth.clearRoles();
    this.router.navigate(['/authentication']);
    return false;
  }
}
