import { Component, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, Scroll } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OAuthService } from 'angular-oauth2-oidc';
import { delay, filter } from 'rxjs';
import { authCodeFlowConfig } from '@shared/auth-config';
import { ConfigService } from '@services/config.service';
import { AuthService } from '@services/auth.service';
import { LG } from '@constants';
import * as Paths from '@shared/paths';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavComponent } from '@shared/components/nav/nav.component';
import { Link } from '@type/Router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { State } from '@type/State';

@Component({
  selector: 't-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, NavComponent, RouterOutlet],
})
export class AppComponent {
  oauthService = inject(OAuthService);
  configService = inject(ConfigService);
  router = inject(Router);
  authService = inject(AuthService);
  observer = inject(BreakpointObserver);
  viewportScroller = inject(ViewportScroller);

  isLoggedIn = false;
  isDesktop = true;
  state?: State;
  config = toSignal(this.configService.config.$);
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

    this.router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntilDestroyed(),
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

    this.configService.config.$.pipe(takeUntilDestroyed()).subscribe((config) => {
      this.configService.setTheme(config.theme);
    });

    this.observer
      .observe([`(min-width: ${LG})`])
      .pipe(takeUntilDestroyed())
      .subscribe((breakpoint) => {
        this.isDesktop = breakpoint.matches;
      });

    this.authService.isLoggedIn$.pipe(takeUntilDestroyed()).subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
    });
  }
}
