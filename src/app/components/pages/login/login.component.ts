import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];

  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.authService.isLoggedIn$.subscribe(async (isLoggedIn) => {
        if (isLoggedIn) {
          await this.router.navigateByUrl('/');
          return;
        }
        this.isLoggedIn = isLoggedIn;
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
