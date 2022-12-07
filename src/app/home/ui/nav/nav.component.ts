import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Link } from '@type/interfaces/Router';
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
  template: `
    <mat-sidenav-container class="sidenav-container" [hasBackdrop]="false">
      <mat-sidenav
        class="sidenav"
        role="navigation"
        [mode]="isDesktop && isLoggedIn ? 'side' : 'over'"
        [opened]="isLoggedIn"
        (closedStart)="sidenavClosedStart()"
        (opened)="sidenavOpened()"
      >
        <mat-nav-list class="sidenav-list" *ngIf="isLoggedIn">
          <a
            *ngFor="let link of links"
            [routerLink]="link.url"
            [queryParamsHandling]="link.queryParamsHandling"
            routerLinkActive="active"
            class="sidenav-link"
          >
            <mat-list-item class="sidenav-item">
              <div class="sidenav-wrapper">
                <div class="icon-wrapper">
                  <mat-icon class="sidenav-icon">{{ link.icon }}</mat-icon>
                </div>
                <div class="sidenav-link-name">{{ link.name }}</div>
              </div>
            </mat-list-item>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content role="main" [class.has-tabs]="activeTabLink">
        <nav
          *ngIf="activeTabLink"
          mat-tab-nav-bar
          [tabPanel]="tabPanel"
          [mat-stretch-tabs]="false"
          class="tab-bar-top"
          color="accent"
        >
          <a
            mat-tab-link
            *ngFor="let link of tabLinks"
            [routerLink]="link.url"
            [active]="activeTabLink === link"
          >
            {{ link.name }}
          </a>
        </nav>

        <mat-tab-nav-panel #tabPanel class="tab-content">
          <ng-content></ng-content>
        </mat-tab-nav-panel>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      @import '../../../shared/styles';

      .has-tabs {
        --tab-bar-height: 3rem;
      }

      .tab-bar-top {
        position: fixed;
        top: var(--toolbar-height);
        z-index: 1;
        background: var(--background);
        width: 100%;

        @media (min-width: $breakpoint-lg) {
          width: calc(100% - var(--sidenav-width));
        }
      }

      .tab-content {
        display: block;
        margin-top: var(--tab-bar-height);
      }
    `,
  ],
})
export class NavComponent {
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
}
