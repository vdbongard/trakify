import { Component, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs';
import { authCodeFlowConfig } from '@shared/auth-config';
import { ConfigService } from '@services/config.service';
import { AuthService } from '@services/auth.service';
import { LG } from '@constants';
import * as Paths from '@shared/paths';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavComponent } from '@shared/components/nav/nav.component';
import { Link } from '@type/Router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { State } from '@type/State';

@Component({
  selector: 't-root',
  imports: [RouterOutlet, HeaderComponent, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  oauthService = inject(OAuthService);
  configService = inject(ConfigService);
  router = inject(Router);
  authService = inject(AuthService);
  observer = inject(BreakpointObserver);

  isDesktop = true;
  state?: State;
  activeTabLink?: Link;
  tabLinks: Link[] = [
    { name: 'Progress', url: Paths.showsProgress({}) },
    { name: 'Upcoming', url: Paths.upcoming({}) },
    { name: 'Watchlist', url: Paths.watchlist({}) },
    { name: 'Shows', url: Paths.addShow({}) },
  ];

  constructor() {
    this.initOAuth();
    this.initNavigationEvents();
    this.initTheme();
    this.initIsDesktopObserver();
  }

  initOAuth(): void {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
  }

  initNavigationEvents(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.activeTabLink = this.getActiveTabLink(event.urlAfterRedirects);

        this.state = history.state;
        console.debug('state', this.state);
      });
  }

  getActiveTabLink(url: string): Link | undefined {
    const parsedUrl = this.router.parseUrl(url);
    parsedUrl.queryParams = {};
    const baseUrl = parsedUrl.toString();
    const tabLink = this.tabLinks.find((link) => link.url === baseUrl);
    return tabLink;
  }

  initTheme(): void {
    effect(() => {
      this.configService.setTheme(this.configService.config.s().theme);
    });
  }

  initIsDesktopObserver(): void {
    this.observer
      .observe([`(min-width: ${LG})`])
      .pipe(takeUntilDestroyed())
      .subscribe((breakpoint) => {
        this.isDesktop = breakpoint.matches;
      });
  }
}
