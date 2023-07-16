import { Component } from '@angular/core';
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
export class LoginComponent {
  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
    this.authService.isLoggedIn$.pipe(takeUntilDestroyed()).subscribe({
      next: (isLoggedIn) => {
        return isLoggedIn && void this.router.navigate(['']);
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }
}
