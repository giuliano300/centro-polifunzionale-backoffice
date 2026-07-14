import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { HeaderComponent } from './common/header/header.component';
import { FooterComponent } from './common/footer/footer.component';
import { ToggleService } from './common/header/toggle.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SidebarComponent, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'district-operation-frontend';

  constructor(public router: Router,  public toggleService: ToggleService) {}
  
    routerSubscription: any;
    location: any;

   // Toggle Service
   isToggled = false;

   // Dark Mode
   toggleTheme() {
       this.toggleService.toggleTheme();
   }

   // Settings Button Toggle
   toggle() {
       this.toggleService.toggle();
   }

   // ngOnInit
   ngOnInit(){
     const token = localStorage.getItem('authToken');
     const path = this.router.url;
     if(!token && path.indexOf("/reset-password") < 0)
        this.router.navigate(['/authentication']);
     
   }
}
