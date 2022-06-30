import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { authCodeFlowConfig } from './auth-config';
import { OAuthService } from 'angular-oauth2-oidc';
import { Config } from '../types/interfaces/Config';
import { ConfigService } from './services/config.service';
import { Subscription } from 'rxjs';
import { IsActiveMatchOptions, NavigationEnd, Router } from '@angular/router';
import { LocalStorage, Theme } from '../types/enum';
import { setLocalStorage } from './helper/local-storage';
import { SyncService } from './services/sync.service';
import { AppStatusService } from './services/app-status.service';
import { AuthService } from './services/auth.service';
import { Link } from '../types/interfaces/Router';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];
  config?: Config;
  theme = Theme;

  links: Link[] = [
    { name: 'Shows', url: '/', icon: 'tv' },
    { name: 'Lists', url: '/lists', icon: 'list' },
  ];
  activeOptions:
    | {
        exact: boolean;
      }
    | IsActiveMatchOptions = {
    exact: true,
    matrixParams: 'exact',
    queryParams: 'ignored',
    paths: 'exact',
    fragment: 'exact',
  };

  tabLinks: Link[] = [
    { name: 'Progress', url: '/' },
    { name: 'Upcoming', url: '/upcoming' },
    { name: 'Watchlist', url: '/watchlist' },
  ];
  activeTabLink?: Link;

  @ViewChild(MatSidenav) sidenav?: MatSidenav;

  constructor(
    public oauthService: OAuthService,
    public configService: ConfigService,
    public router: Router,
    public syncService: SyncService,
    public appStatus: AppStatusService,
    private authService: AuthService,
    private observer: BreakpointObserver
  ) {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  ngOnInit(): void {
    this.subscriptions = [
      this.router.events.subscribe((event) => {
        if (!(event instanceof NavigationEnd)) return;
        this.activeTabLink = this.tabLinks.find((link) => link.url === event.url);
      }),
      this.configService.config$.subscribe((config) => {
        this.config = config;
        this.configService.setTheme(config.theme);
      }),
      this.authService.isLoggedIn$.subscribe((isLoggedIn) => (this.isLoggedIn = isLoggedIn)),
    ];
  }

  ngAfterViewInit(): void {
    if (!this.sidenav) return;

    this.subscriptions.push(
      this.observer.observe(['(min-width: 992px)']).subscribe(async (breakpoint) => {
        if (breakpoint.matches) {
          this.sidenav!.mode = 'side';
          await this.sidenav!.open();
        } else {
          this.sidenav!.mode = 'over';
          await this.sidenav!.close();
        }
      })
    );
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
    this.authService.isLoggedIn$.next(false);
    await this.router.navigateByUrl('/login');
  }
}
