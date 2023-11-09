import { Component, effect, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { State } from '@type/State';

@Component({
  selector: 't-root',
  standalone: true,
  imports: [HeaderComponent, NavComponent, RouterOutlet],
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
})
export class AppComponent {
  oauthService = inject(OAuthService);
  configService = inject(ConfigService);
  router = inject(Router);
  authService = inject(AuthService);
  observer = inject(BreakpointObserver);
  viewportScroller = inject(ViewportScroller);

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
    // todo check
    // this.oauthService.configure(authCodeFlowConfigFactory({ baseURI: inject(DOCUMENT).baseURI }));
    this.oauthService.configure(authCodeFlowConfig({ baseURI: '/' }));
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
        delay(1),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position); // backward navigation
        } else if (event.anchor) {
          this.viewportScroller.scrollToAnchor(event.anchor); // anchor navigation
        } else {
          this.viewportScroller.scrollToPosition([0, 0]); // forward navigation
        }
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
