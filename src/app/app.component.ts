import { Component } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf, NgOptimizedImage, ViewportScroller } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Scroll,
} from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { OAuthService } from 'angular-oauth2-oidc';
import { delay, filter } from 'rxjs';

import { authCodeFlowConfig } from '@shared/auth-config';
import { ConfigService } from '@services/config.service';
import { AuthService } from '@services/auth.service';
import { LG } from '@constants';
import * as Paths from '@shared/paths';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HeaderComponent } from './home/ui/header/header.component';
import { NavComponent } from './home/ui/nav/nav.component';
import { Link } from '@type/Router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { State } from '@type/State';

@Component({
  selector: 't-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    MatMenuModule,
    MatIconModule,
    NgGenericPipeModule,
    RouterLink,
    FormsModule,
    AsyncPipe,
    MatRadioModule,
    RouterOutlet,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    NgOptimizedImage,
    MatButtonModule,
    RouterLinkActive,
    MatCheckboxModule,
    HeaderComponent,
    NavComponent,
  ],
})
export class AppComponent {
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

  constructor(
    private oauthService: OAuthService,
    private configService: ConfigService,
    private router: Router,
    private authService: AuthService,
    private observer: BreakpointObserver,
    private viewportScroller: ViewportScroller,
  ) {
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
