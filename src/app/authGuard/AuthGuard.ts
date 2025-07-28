import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    if (isLogin) {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
}
