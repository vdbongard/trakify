import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTabNav } from '@angular/material/tabs';
import { OAuthService } from 'angular-oauth2-oidc';
import { takeUntil } from 'rxjs';

import { authCodeFlowConfig } from './auth-config';
import { ConfigService } from './shared/services/config.service';
import { SyncService } from './shared/services/sync.service';
import { AppStatusService } from './shared/services/app-status.service';
import { AuthService } from './shared/services/auth.service';
import { ShowService } from './shared/services/trakt/show.service';
import { BaseComponent } from './shared/helper/base-component';
import { DialogService } from './shared/services/dialog.service';
import { ListService } from './shared/services/trakt/list.service';
import { SeasonService } from './shared/services/trakt/season.service';
import { ExecuteService } from './shared/services/execute.service';
import { LG } from './shared/constants';

import { Theme } from '../types/enum';

import type { Config, Language } from '../types/interfaces/Config';
import type { Link } from '../types/interfaces/Router';

@Component({
  selector: 't-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends BaseComponent implements OnInit {
  isLoggedIn = false;
  isDesktop = true;
  config?: Config;
  themes = Theme;
  languages: Language[] = [
    {
      name: 'English',
      short: 'en-US',
    },
    { name: 'Deutsch', short: 'de-DE' },
  ];

  links: Link[] = [
    { name: 'Shows', url: '/series', icon: 'tv' },
    { name: 'Lists', url: '/lists', icon: 'list', queryParamsHandling: 'merge' },
    { name: 'Statistics', url: '/statistics', icon: 'bar_chart' },
  ];

  tabLinks: Link[] = [
    { name: 'Shows', url: '/series' },
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
    public authService: AuthService,
    private observer: BreakpointObserver,
    public showService: ShowService,
    public dialogService: DialogService,
    public listService: ListService,
    public seasonService: SeasonService,
    public executeService: ExecuteService
  ) {
    super();
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  ngOnInit(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const url = event.urlAfterRedirects.split('?')[0];
      this.activeTabLink = this.tabLinks.find((link) => link.url === url);
    });

    this.configService.config.$.pipe(takeUntil(this.destroy$)).subscribe((config) => {
      this.config = config;
      this.configService.setTheme(config.theme);
    });

    this.observer
      .observe([`(min-width: ${LG})`])
      .pipe(takeUntil(this.destroy$))
      .subscribe((breakpoint) => {
        this.isDesktop = breakpoint.matches;
      });

    this.authService.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
    });
  }

  sidenavClosedStart(): void {
    (document.activeElement as HTMLElement | null)?.blur();
  }

  sidenavOpened(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    this.tabs?._alignInkBarToSelectedTab();
  }
}
