import { Component, effect, inject, isDevMode } from '@angular/core';
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
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental';

@Component({
  selector: 't-root',
  standalone: true,
  imports: [HeaderComponent, NavComponent, RouterOutlet, AngularQueryDevtools],
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
})
export class AppComponent {
  oauthService = inject(OAuthService);
  configService = inject(ConfigService);
  router = inject(Router);
  authService = inject(AuthService);
  observer = inject(BreakpointObserver);

  searchParams = new URLSearchParams(window.location.search);
  isDebug = isDevMode() || this.searchParams.get('debug') === '1';
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
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const url = this.router.parseUrl(event.urlAfterRedirects);
        url.queryParams = {};
        const baseUrl = url.toString();
        this.activeTabLink = this.tabLinks.find((link) => link.url === baseUrl);
        this.state = history.state as State;
        console.debug('state', this.state);
      });

    effect(() => {
      this.configService.setTheme(this.configService.config.s().theme);
    });

    this.observer
      .observe([`(min-width: ${LG})`])
      .pipe(takeUntilDestroyed())
      .subscribe((breakpoint) => {
        this.isDesktop = breakpoint.matches;
      });
  }
}
