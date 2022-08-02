import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BaseComponent } from '../../../helper/base-component';
import { takeUntil } from 'rxjs';
import { onError } from '../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends BaseComponent implements OnInit {
  isLoggedIn = false;

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
        if (isLoggedIn) {
          await this.router.navigateByUrl('/');
          return;
        }
        this.isLoggedIn = isLoggedIn;
      },
      error: (error) => onError(error, this.snackBar),
    });
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
