import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { wait } from './helper/wait';
import { ShowService } from './services/show.service';
import { MatTabNav } from '@angular/material/tabs';

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
    { name: 'Shows', url: '/series', icon: 'tv' },
    { name: 'Lists', url: '/lists', icon: 'list', queryParamsHandling: 'merge' },
    { name: 'Statistic', url: '/statistic', icon: 'bar_chart' },
  ];

  tabLinks: Link[] = [
    { name: 'Progress', url: '/series' },
    { name: 'Upcoming', url: '/series/upcoming' },
    { name: 'Watchlist', url: '/series/watchlist' },
  ];
  activeTabLink?: Link;

  @ViewChild(MatSidenav) sidenav?: MatSidenav;
  @ViewChild(MatTabNav) tabs?: MatTabNav;

  constructor(
    public oauthService: OAuthService,
    public configService: ConfigService,
    public router: Router,
    public syncService: SyncService,
    public appStatus: AppStatusService,
    private authService: AuthService,
    private observer: BreakpointObserver,
    public showService: ShowService
  ) {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  ngOnInit(): void {
    this.subscriptions = [
      this.router.events.subscribe((event) => {
        if (!(event instanceof NavigationEnd)) return;
        const url = event.urlAfterRedirects.split('?')[0];
        this.activeTabLink = this.tabLinks.find((link) => link.url === url);
      }),
      this.configService.config$.subscribe((config) => {
        this.config = config;
        this.configService.setTheme(config.theme);
      }),
      this.authService.isLoggedIn$.subscribe((isLoggedIn) => (this.isLoggedIn = isLoggedIn)),
    ];
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.observer.observe(['(min-width: 992px)']).subscribe(async (breakpoint) => {
        if (!this.sidenav) return;
        await wait();
        if (breakpoint.matches) {
          this.sidenav.mode = 'side';
          await this.sidenav.open();
        } else {
          this.sidenav.mode = 'over';
          await this.sidenav.close();
        }
        this.tabs?.updatePagination();
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

  onClosed(): void {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
