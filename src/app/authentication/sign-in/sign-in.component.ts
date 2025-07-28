import { Component } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { FeathericonsModule } from '../../icons/feathericons/feathericons.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgIf } from '@angular/common';
import { Login } from '../../interfaces/Login';
import { UtilsService } from '../../utils.service';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/User.service';
import { JwtPayloads } from '../../interfaces/JwtPayloads';

@Component({
    selector: 'app-sign-in',
    imports: [MatButton, MatIconButton, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, FeathericonsModule, MatCheckboxModule, 
        ReactiveFormsModule, NgIf],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
    isError: boolean = false;
    user: JwtPayloads | null = null;
    options: any [] = [];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private utilsService: UtilsService,
        private authService: AuthService,
        private userService: UsersService
    ) {
        this.authForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(4)]]
        });
        this.options = [{id: 1, name: "Entity"}, {id: 2, name: "Location"}];
    }

    // Password Hide
    hide = true;

    // Form
    authForm: FormGroup;
    onSubmit() {
        if (this.authForm.valid) {
            let login:Login = {
                "email": this.authForm.value["email"],
                "password" : this.authForm.value["password"]
            };
            
            this.userService.login(login).subscribe((data: any) => {
                if(data == null)
                    this.isError = true;
                else
                {
                    this.user! = this.authService.decodeToken(data)!;
                    localStorage.setItem('isLogin', "true");
                    localStorage.setItem('loginName', this.user!.username!);
                    this.authService.setIsLogin(true);
                    this.authService.setLoginName(this.user!.username!);
                    localStorage.setItem('authToken', data.access_token);
                    localStorage.setItem('user', JSON.stringify(this.user!));
                    this.router.navigate(['/spaces']);
                }
            });
                        
        } else {
            console.log('Il modulo non è valido. Si prega di controllare i campi.');
        }
    }

    ngOnInit(): void {
        const token = localStorage.getItem('authToken');
        if (token) 
            this.router.navigate(['/spaces']);
   }
   

   passwordRecovery(){
        this.router.navigate(['/authentication/forgot-password']);
   }
}