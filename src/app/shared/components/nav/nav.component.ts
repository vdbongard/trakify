import { Component, inject, input, ViewChild } from '@angular/core';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Link } from '@type/Router';
import * as Paths from '@shared/paths';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { mod } from '@helper/mod';
import { onKeyArrow } from '@helper/onKeyArrow';

@Component({
  selector: 't-nav',
  standalone: true,
  imports: [
    MatTabsModule,
    RouterLink,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterLinkActive,
    SwipeDirective,
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  router = inject(Router);

  isLoggedIn = input(false);
  isDesktop = input(true);
  activeTabLink = input<Link>();
  tabLinks = input<Link[]>([]);

  @ViewChild(MatSidenav) sidenav?: MatSidenav;
  @ViewChild(MatTabNav) tabs?: MatTabNav;

  links: Link[] = [
    { name: 'Shows', url: Paths.shows({}), icon: 'tv' },
    { name: 'Lists', url: Paths.lists({}), icon: 'list', queryParamsHandling: 'merge' },
    { name: 'Statistics', url: Paths.statistics({}), icon: 'bar_chart' },
  ];

  constructor() {
    onKeyArrow({
      arrowLeft: () => void this.previous(),
      arrowRight: () => void this.next(),
    });
  }

  sidenavClosedStart(): void {
    (document.activeElement as HTMLElement | null)?.blur();
  }

  sidenavOpened(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    this.tabs?._alignInkBarToSelectedTab();
  }

  async previous(): Promise<void> {
    if (!this.tabs) return;

    const newLinkIndex = mod(this.tabs.selectedIndex - 1, this.tabLinks().length);
    const link: Link | undefined = this.tabLinks()[newLinkIndex];
    if (!link) return;

    await this.router.navigateByUrl(link.url);
  }

  async next(): Promise<void> {
    if (!this.tabs) return;

    const newLinkIndex = mod(this.tabs.selectedIndex + 1, this.tabLinks().length);
    const link: Link | undefined = this.tabLinks()[newLinkIndex];
    if (!link) return;

    await this.router.navigateByUrl(link.url);
  }
}
