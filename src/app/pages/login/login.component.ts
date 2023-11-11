import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '@services/auth.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-login',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export default class LoginComponent {
  oauthService = inject(OAuthService);
  router = inject(Router);
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        void this.router.navigate(['']);
      }
    });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }
}
