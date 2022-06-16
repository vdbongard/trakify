import { Component, OnDestroy, OnInit } from '@angular/core';
import { authCodeFlowConfig } from './auth-config';
import { OAuthService } from 'angular-oauth2-oidc';
import { Config } from '../types/interfaces/Config';
import { ConfigService } from './services/config.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Theme } from '../types/enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];
  config?: Config;
  theme = Theme;

  constructor(
    public oauthService: OAuthService,
    public configService: ConfigService,
    public router: Router
  ) {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();

    this.subscriptions = [
      this.configService.config.subscribe((config) => {
        document.body.classList.add(config.theme);
      }),
    ];
  }

  ngOnInit(): void {
    this.subscriptions = [
      this.configService.config.subscribe((config) => (this.config = config)),
      this.configService.isLoggedIn.subscribe((isLoggedIn) => (this.isLoggedIn = isLoggedIn)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
