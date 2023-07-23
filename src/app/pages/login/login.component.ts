import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '@services/auth.service';
import { onError } from '@helper/error';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [MatButtonModule],
})
export default class LoginComponent {
  oauthService = inject(OAuthService);
  router = inject(Router);
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  constructor() {
    this.authService.isLoggedIn$.pipe(takeUntilDestroyed()).subscribe({
      next: (isLoggedIn) => isLoggedIn && void this.router.navigate(['']),
      error: (error) => onError(error, this.snackBar),
    });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }
}
