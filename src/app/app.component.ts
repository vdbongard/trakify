import { Component, OnDestroy, OnInit } from '@angular/core';
import { authCodeFlowConfig } from './auth-config';
import { OAuthService } from 'angular-oauth2-oidc';
import { Config } from '../types/interfaces/Config';
import { ConfigService } from './services/config.service';
import { Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { LocalStorage, Theme } from '../types/enum';
import { setLocalStorage } from './helper/local-storage';
import { SyncService } from './services/sync.service';
import { AppStatusService } from './services/app-status.service';
import { AuthService } from './services/auth.service';
import { Link } from '../types/interfaces/Router';

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

  links: Link[] = [
    { name: 'Progress', url: '/' },
    { name: 'Upcoming', url: '/upcoming' },
    { name: 'Watchlist', url: '/watchlist' },
  ];
  activeLink?: Link;

  constructor(
    public oauthService: OAuthService,
    public configService: ConfigService,
    public router: Router,
    public syncService: SyncService,
    public appStatus: AppStatusService,
    private authService: AuthService
  ) {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  ngOnInit(): void {
    this.subscriptions = [
      this.router.events.subscribe((event) => {
        if (!(event instanceof NavigationEnd)) return;
        this.activeLink = this.links.find((link) => link.url === event.url);
      }),
      this.configService.config.subscribe((config) => {
        this.config = config;
        this.configService.setTheme(config.theme);
      }),
      this.authService.isLoggedIn.subscribe((isLoggedIn) => (this.isLoggedIn = isLoggedIn)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async logout(): Promise<void> {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG].includes(key)) continue;
      setLocalStorage(key, {});
    }
    this.oauthService.logOut();
    this.authService.isLoggedIn.next(false);
    await this.router.navigateByUrl('/login');
  }
}
