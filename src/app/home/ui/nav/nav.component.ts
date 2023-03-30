import { Component, inject, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Link } from '@type/Router';
import * as Paths from '@shared/paths';
import { mod, SwipeDirective } from '@shared/directives/swipe.directive';

@Component({
  selector: 't-nav',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    RouterLink,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterLinkActive,
    SwipeDirective,
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  router = inject(Router);

  @Input() isLoggedIn = false;
  @Input() isDesktop = true;
  @Input() activeTabLink?: Link;
  @Input() tabLinks: Link[] = [];

  @ViewChild(MatSidenav) sidenav?: MatSidenav;
  @ViewChild(MatTabNav) tabs?: MatTabNav;

  links: Link[] = [
    { name: 'Shows', url: Paths.shows({}), icon: 'tv' },
    { name: 'Lists', url: Paths.lists({}), icon: 'list', queryParamsHandling: 'merge' },
    { name: 'Statistics', url: Paths.statistics({}), icon: 'bar_chart' },
  ];

  sidenavClosedStart(): void {
    (document.activeElement as HTMLElement | null)?.blur();
  }

  sidenavOpened(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    this.tabs?._alignInkBarToSelectedTab();
  }

  async swipeLeft(): Promise<void> {
    if (!this.tabs) return;

    const newLinkIndex = mod(this.tabs.selectedIndex + 1, this.tabLinks.length);
    const link: Link | undefined = this.tabLinks[newLinkIndex];
    if (!link) return;

    await this.router.navigateByUrl(link.url);
  }

  async swipeRight(): Promise<void> {
    if (!this.tabs) return;

    const newLinkIndex = mod(this.tabs.selectedIndex - 1, this.tabLinks.length);
    const link: Link | undefined = this.tabLinks[newLinkIndex];
    if (!link) return;

    await this.router.navigateByUrl(link.url);
  }
}
