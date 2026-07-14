import { Routes } from '@angular/router';
import { NotFoundComponent } from './common/not-found/not-found.component';
import { SignInComponent } from './authentication/sign-in/sign-in.component';
import { AuthenticationComponent } from './authentication/authentication.component';
import { AuthGuard } from './authGuard/AuthGuard';
import { SpacesComponent } from './pages/spaces/spaces.component';
import { BookingsComponent } from './pages/spaces/bookings/bookings.component';
import { CalendarComponent } from './pages/spaces/booking-calendar/calendar.component';
import { SpaceFormComponent } from './pages/spaces/space-form/space-form.component';
import { UsersComponent } from './pages/users/users.component';
import { BookingsListComponent } from './pages/bookings/bookings-list.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CourseBookingsComponent } from './pages/course-bookings/course-bookings.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo : '/dashboard', pathMatch: 'full' },
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
            { path: 'dashboard', component: DashboardComponent },
            { path: 'spaces', component: SpacesComponent },
            { path: 'spaces/add', component: SpaceFormComponent },
            { path: 'spaces/add/:id', component: SpaceFormComponent },
            { path: 'space/bookings/:id', component: BookingsComponent },
            { path: 'space/bookings-calendar/:id/:month/:year', component: CalendarComponent },
            { path: 'users', component: UsersComponent },
            { path: 'bookings', component: BookingsListComponent },
            { path: 'payments', component: PaymentsComponent },
            { path: 'courses', component: CoursesComponent },
            { path: 'course-bookings', component: CourseBookingsComponent }
        ]
    },
    { path: '**', component: NotFoundComponent},
];
