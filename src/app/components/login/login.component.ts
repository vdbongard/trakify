import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OAuthService } from 'angular-oauth2-oidc';
import { takeUntil } from 'rxjs';

import { AuthService } from '@services/auth.service';
import { BaseComponent } from '@helper/base-component';
import { onError } from '@helper/error';

@Component({
  selector: 't-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent extends BaseComponent implements OnInit {
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
      next: async (isLoggedIn) => isLoggedIn && (await this.router.navigate([''])),
      error: (error) => onError(error, this.snackBar),
    });
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
