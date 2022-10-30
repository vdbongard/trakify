import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { NavigationEnd, Router, Scroll } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTabNav } from '@angular/material/tabs';
import { OAuthService } from 'angular-oauth2-oidc';
import { delay, filter, takeUntil } from 'rxjs';

import { authCodeFlowConfig } from './auth-config';
import { ConfigService } from '@services/config.service';
import { SyncService } from '@services/sync.service';
import { AppStatusService } from '@services/app-status.service';
import { AuthService } from '@services/auth.service';
import { ShowService } from '@services/trakt/show.service';
import { BaseComponent } from '@helper/base-component';
import { DialogService } from '@services/dialog.service';
import { ListService } from '@services/trakt/list.service';
import { SeasonService } from '@services/trakt/season.service';
import { ExecuteService } from '@services/execute.service';
import { LG } from '@constants';

import { Theme } from '@type/enum';

import type { Config, Language } from '@type/interfaces/Config';
import type { Link } from '@type/interfaces/Router';
import { z } from 'zod';
import * as Paths from 'src/app/paths';

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
    { name: 'Shows', url: Paths.shows({}), icon: 'tv' },
    { name: 'Lists', url: Paths.lists({}), icon: 'list', queryParamsHandling: 'merge' },
    { name: 'Statistics', url: Paths.statistics({}), icon: 'bar_chart' },
  ];

  tabLinks: Link[] = [
    { name: 'Shows', url: Paths.showsProgress({}) },
    { name: 'Upcoming', url: Paths.upcoming({}) },
    { name: 'Watchlist', url: Paths.watchlist({}) },
  ];
  activeTabLink?: Link;
  paths = Paths;
  state?: Record<string, string>;

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
    public executeService: ExecuteService,
    private viewportScroller: ViewportScroller
  ) {
    super();
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = this.router.parseUrl(event.urlAfterRedirects);
        url.queryParams = {};
        const baseUrl = url.toString();
        this.activeTabLink = this.tabLinks.find((link) => link.url === baseUrl);
        this.state = history.state;
        console.debug('state', this.state);
      });

    this.router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntil(this.destroy$)
      )
      .pipe(delay(1))
      .subscribe((event) => {
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position); // backward navigation
        } else if (event.anchor) {
          this.viewportScroller.scrollToAnchor(event.anchor); // anchor navigation
        } else {
          this.viewportScroller.scrollToPosition([0, 0]); // forward navigation
        }
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

  getQueryParams(): z.infer<typeof queryParamSchema> {
    const queryParams = this.router.parseUrl(this.router.url).queryParams;
    return queryParamSchema.parse(queryParams);
  }

  async goBack(url: string | undefined): Promise<void> {
    if (url === undefined) return;
    await this.router.navigateByUrl(url);
  }
}

const queryParamSchema = z.object({
  slug: z.string().optional(),
});
