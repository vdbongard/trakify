import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OAuthService } from 'angular-oauth2-oidc';
import { takeUntil } from 'rxjs';

import { AuthService } from '@services/auth.service';
import { Base } from '@helper/base';
import { onError } from '@helper/error';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [MatButtonModule],
})
export class LoginComponent extends Base implements OnInit {
  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (isLoggedIn) => {
        return isLoggedIn && (await this.router.navigate(['']));
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
