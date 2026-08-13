import { Component } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/auth.service';
import { ApiService } from './core/api.service';
import { User } from './core/models';
import { NotificationsService } from './core/notifications.service';
import { environment } from '../environments/environment';
import { NagoraLogoComponent } from './shared/nagora-logo.component';

@Component({
  selector: 'backoffice-root',
  imports: [NgIf, NgFor, AsyncPipe, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatTooltipModule, NagoraLogoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  isNotificationsOpen = false;
  isOperationsMenuOpen = false;
  isProfileMenuOpen = false;
  isSettingsMenuOpen = false;
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  manager: User | null = null;
  currentYear = new Date().getFullYear();

  constructor(public auth: AuthService, public notifications: NotificationsService, private api: ApiService, private router: Router) {
    this.isSettingsMenuOpen = this.isSettingsRoute(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isMobileMenuOpen = false;
        if (this.isSettingsRoute(event.urlAfterRedirects)) {
          this.isSettingsMenuOpen = true;
        }
      }
    });

    if (this.auth.isAuthenticated()) {
      this.notifications.connect();
      this.loadManager();
    }

    this.auth.loginCompleted$.subscribe(() => {
      this.isOperationsMenuOpen = false;
      this.isProfileMenuOpen = false;
      this.isNotificationsOpen = false;
      this.loadManager();
    });
  }

  get managerName(): string {
    const payload = this.auth.payload();
    return this.manager?.name || payload?.name || payload?.email || 'Amministratore';
  }

  get clientAutoLoginUrl(): string {
    const token = this.auth.token();
    const baseUrl = environment.clientAppUrl.replace(/\/$/, '');
    return token ? `${baseUrl}/login?autoLoginToken=${encodeURIComponent(token)}` : `${baseUrl}/login`;
  }

  private loadManager(): void {
    this.api.profile().subscribe({
      next: (user) => {
        this.manager = user;
      },
      error: (error) => {
        this.manager = null;
        if (error?.status === 401) {
          this.logout();
        }
      },
    });
  }

  logout(): void {
    this.isOperationsMenuOpen = false;
    this.isProfileMenuOpen = false;
    this.isNotificationsOpen = false;
    this.isMobileMenuOpen = false;
    this.notifications.disconnect();
    this.auth.logout();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isNotificationsOpen = false;
    this.isOperationsMenuOpen = false;
    this.isProfileMenuOpen = false;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isOperationsMenuOpen = false;
    this.isProfileMenuOpen = false;
    if (this.isNotificationsOpen) {
      this.notifications.markAllRead();
    }
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isOperationsMenuOpen = false;
    this.isNotificationsOpen = false;
  }

  toggleOperationsMenu(): void {
    this.isOperationsMenuOpen = !this.isOperationsMenuOpen;
    this.isNotificationsOpen = false;
    this.isProfileMenuOpen = false;
  }

  closeOperationsMenu(): void {
    this.isOperationsMenuOpen = false;
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  openNotification(link?: string): void {
    if (!link) {
      return;
    }
    this.isNotificationsOpen = false;
    this.router.navigateByUrl(link);
  }

  private isSettingsRoute(url: string): boolean {
    return ['/wallet-client-settings', '/wallet-manager-settings', '/course-tag-settings'].some((route) => url.startsWith(route));
  }
}
