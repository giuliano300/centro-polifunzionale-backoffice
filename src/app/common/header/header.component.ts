import { Component } from '@angular/core';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';
import { ToggleService } from './toggle.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/Notification.service';

@Component({
    selector: 'app-header',
    imports: [FeathericonsModule, MatButtonModule, MatMenuModule, NgIf, NgFor, AsyncPipe],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
    providers: [
        DatePipe
    ]
})
export class HeaderComponent {
    area: string = "";

    constructor(
        public toggleService: ToggleService,
        private datePipe: DatePipe,
        private authService: AuthService,
        public notifications: NotificationService,
        private router: Router
    ) {
        this.toggleService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
        this.formattedDate = this.datePipe.transform(this.currentDate, 'dd MMMM yyyy');

        this.authService.loginName$.subscribe(val => {
            this.area = val || (localStorage.getItem('loginName')?.replace(/^"|"$/g, '')) || '';
        });
        this.notifications.connect();
    }

    // Toggle Service
    isToggled = false;
    toggle() {
        this.toggleService.toggle();
    }

    // Dark Mode
    toggleTheme() {
        this.toggleService.toggleTheme();
    }

    // Current Date
    currentDate: Date = new Date();
    formattedDate: any;
    isNotificationsOpen = false;

    toggleNotifications() {
        this.isNotificationsOpen = !this.isNotificationsOpen;
        if (this.isNotificationsOpen) {
            this.notifications.markAllRead();
        }
    }

    openNotification(link?: string) {
        if (!link) {
            return;
        }
        this.isNotificationsOpen = false;
        this.router.navigateByUrl(link);
    }

}
