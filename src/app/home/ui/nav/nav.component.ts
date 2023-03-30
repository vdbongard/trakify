import { Component, inject, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Link } from '@type/Router';
import * as Paths from '@shared/paths';

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
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit, OnDestroy {
  ngZone = inject(NgZone);
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

  // todo general swipe directive
  down: { x: number; y: number } | null = null;

  sidenavClosedStart(): void {
    (document.activeElement as HTMLElement | null)?.blur();
  }

  sidenavOpened(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    this.tabs?._alignInkBarToSelectedTab();
  }

  ngOnInit(): void {
    // needed to have the same reference in the event listener
    this.onDown = this.onDown.bind(this);
    this.onUp = this.onUp.bind(this);

    this.addDownListener();
  }

  ngOnDestroy(): void {
    this.removeDownListener();
    this.removeUpListener();
  }

  addDownListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('pointerdown', this.onDown, { passive: true });
    });
  }

  removeDownListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.removeEventListener('pointerdown', this.onDown);
    });
  }

  addUpListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('pointerup', this.onUp, { passive: true });
      document.addEventListener('dragend', this.onUp, { passive: true });
    });
  }

  removeUpListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.removeEventListener('pointerup', this.onUp);
      document.removeEventListener('dragend', this.onUp);
    });
  }

  onDown(event: PointerEvent): void {
    this.addUpListener();
    if (!this.activeTabLink) return;

    this.down = { x: event.clientX, y: event.clientY };
    console.log('down', event);
  }

  async onUp(event: PointerEvent | DragEvent): Promise<void> {
    this.removeUpListener();
    if (!this.activeTabLink) return;

    const up = { x: event.clientX, y: event.clientY };

    if (isSwipeRight(this.down, up)) {
      this.down = null;

      // todo call general callback
      await this.ngZone.run(async () => {
        console.log('swipe right');
        if (this.tabs) {
          const newLinkIndex = mod(this.tabs.selectedIndex - 1, this.tabLinks.length);
          const link: Link | undefined = this.tabLinks[newLinkIndex];
          if (!link) return;
          await this.router.navigateByUrl(link.url);
        }
      });
    } else if (isSwipeLeft(this.down, up)) {
      this.down = null;

      // todo call general callback
      await this.ngZone.run(async () => {
        console.log('swipe right');
        if (this.tabs) {
          const newLinkIndex = mod(this.tabs.selectedIndex + 1, this.tabLinks.length);
          const link: Link | undefined = this.tabLinks[newLinkIndex];
          if (!link) return;
          await this.router.navigateByUrl(link.url);
        }
      });
    }

    console.log('up', event);
  }
}

export function isSwipeRight(
  down: { x: number; y: number } | null,
  up: { x: number; y: number } | null
): boolean {
  if (!down || !up) return false;
  return up.x - down.x > 50;
}

export function isSwipeLeft(
  down: { x: number; y: number } | null,
  up: { x: number; y: number } | null
): boolean {
  if (!down || !up) return false;
  return up.x - down.x < -50;
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
