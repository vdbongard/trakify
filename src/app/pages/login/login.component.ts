import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 't-login',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  router = inject(Router);
  authService = inject(AuthService);
  oauthService = inject(OAuthService);

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['']);
      }
    });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }
}
