import { Component, OnInit } from '@angular/core';
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
import { delay, filter, takeUntil } from 'rxjs';

import { authCodeFlowConfig } from '@shared/auth-config';
import { ConfigService } from '@services/config.service';
import { AuthService } from '@services/auth.service';
import { Base } from '@helper/base';
import { LG } from '@constants';
import * as Paths from '@shared/paths';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { IsHiddenPipe } from '@shared/pipes/is-hidden.pipe';
import { IsFavoritePipe } from '@shared/pipes/is-favorite.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { FormsModule } from '@angular/forms';
import { StartsWithPipe } from '@shared/pipes/starts-with.pipe';
import { IncludesPipe } from '@shared/pipes/includes.pipe';
import { MatRadioModule } from '@angular/material/radio';
import { CategoryPipe } from '@shared/pipes/category.pipe';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HeaderComponent } from './home/ui/header/header.component';
import { NavComponent } from './home/ui/nav/nav.component';
import { Config } from '@type/interfaces/Config';
import { Link } from '@type/interfaces/Router';

@Component({
  selector: 't-root',
  template: `
    <t-header [isLoggedIn]="isLoggedIn" [state]="state" [config]="config"></t-header>
    <t-nav
      [isLoggedIn]="isLoggedIn"
      [isDesktop]="isDesktop"
      [activeTabLink]="activeTabLink"
      [tabLinks]="tabLinks"
    >
      <router-outlet></router-outlet>
    </t-nav>
  `,
  styles: [
    `
      @import './shared/styles';

      :host {
        --tab-bar-height: 0;
      }
    `,
  ],
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    MatMenuModule,
    MatIconModule,
    IsHiddenPipe,
    IsFavoritePipe,
    NgGenericPipeModule,
    RouterLink,
    FormsModule,
    StartsWithPipe,
    AsyncPipe,
    IncludesPipe,
    MatRadioModule,
    CategoryPipe,
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
export class AppComponent extends Base implements OnInit {
  isLoggedIn = false;
  isDesktop = true;
  state?: Record<string, string>;
  config?: Config;
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
}
