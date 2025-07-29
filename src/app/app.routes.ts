import { Routes } from '@angular/router';
import { NotFoundComponent } from './common/not-found/not-found.component';
import { SignInComponent } from './authentication/sign-in/sign-in.component';
import { AuthenticationComponent } from './authentication/authentication.component';
import { AuthGuard } from './authGuard/AuthGuard';
import { SpacesComponent } from './pages/spaces/spaces.component';
import { BookingsComponent } from './pages/spaces/bookings/bookings.component';

export const routes: Routes = [
    { path: '', redirectTo : '/authentication', pathMatch: 'full' },
    {
        path: 'authentication',
        component: AuthenticationComponent,
        children: [
            {path: '', component: SignInComponent},
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        children: [
            { path: 'spaces', component: SpacesComponent },
            { path: 'space/bookings/:id', component: BookingsComponent }
        ]
    },
    { path: '**', component: NotFoundComponent},
];
