import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ExecuteService } from '@services/execute.service';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { ListService } from '../../../lists/data/list.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SyncService } from '@services/sync.service';
import { ConfigService } from '@services/config.service';
import { Theme } from '@type/enum';
import { Config, Filter, Language } from '@type/interfaces/Config';
import { AuthService } from '@services/auth.service';
import { StartsWithPipe } from '@shared/pipes/starts-with.pipe';
import { onError } from '@helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeasonService } from '../../../shows/data/season.service';
import { IncludesPipe } from '@shared/pipes/includes.pipe';
import { DialogService } from '@services/dialog.service';
import { z } from 'zod';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import * as Paths from '@shared/paths';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IsHiddenPipe } from '@shared/pipes/is-hidden.pipe';
import { ShowService } from '../../../shows/data/show.service';
import { IsFavoritePipe } from '@shared/pipes/is-favorite.pipe';
import { AppStatusService } from '@services/app-status.service';
import { CategoryPipe } from '@shared/pipes/category.pipe';

@Component({
  selector: 't-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    MatToolbarModule,
    NgOptimizedImage,
    MatProgressSpinnerModule,
    StartsWithPipe,
    IncludesPipe,
    NgGenericPipeModule,
    MatRadioModule,
    FormsModule,
    MatCheckboxModule,
    IsHiddenPipe,
    IsFavoritePipe,
    CategoryPipe,
  ],
  template: `
    <mat-toolbar class="toolbar">
      <button
        *ngIf="state?.['back']"
        mat-icon-button
        class="back-link"
        aria-label="Back"
        (click)="goBack(state?.['back'])"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
      <a routerLink="" class="logo-wrapper" data-test-id="logo">
        <img
          ngSrc="assets/logo-T.png"
          width="28"
          height="32"
          priority
          alt="Logo"
          class="logo-image"
        />
        <span class="logo-text">Trakify</span>
      </a>
      <mat-spinner *ngIf="syncService.isSyncing | async" diameter="24"></mat-spinner>
      <span class="spacer"></span>
      <ng-container *ngIf="isLoggedIn">
        <button
          *ngIf="['/shows/progress', '/shows/upcoming'] | includes : router.url"
          mat-icon-button
          aria-label="Filter icon"
          [matMenuTriggerFor]="menuFilter"
        >
          <mat-icon>filter_alt</mat-icon>
        </button>
        <button
          *ngIf="router.url === '/shows/progress'"
          mat-icon-button
          aria-label="Sort icon"
          [matMenuTriggerFor]="menuSort"
        >
          <mat-icon>sort</mat-icon>
        </button>

        <ng-container *ngIf="router.url | startsWith : '/lists'">
          <button
            mat-icon-button
            aria-label="Create list"
            (click)="dialogService.addList()"
            data-test-id="add-list-button"
          >
            <mat-icon>playlist_add</mat-icon>
          </button>
          <ng-container *ngIf="listService.lists.$ | async as lists">
            <button
              *ngIf="lists.length > 0"
              mat-icon-button
              aria-label="Remove list"
              (click)="executeService.removeList(getQueryParams().slug)"
              data-test-id="remove-list-button"
            >
              <mat-icon>playlist_remove</mat-icon>
            </button>
          </ng-container>
        </ng-container>
        <a mat-icon-button aria-label="Search icon" [routerLink]="paths.search.pattern">
          <mat-icon>search</mat-icon>
        </a>
      </ng-container>
      <button
        mat-icon-button
        aria-label="Open menu"
        [matMenuTriggerFor]="menu"
        data-test-id="topbar-menu"
      >
        <mat-icon>more_vert</mat-icon>
      </button>
    </mat-toolbar>

    <mat-menu #menuFilter="matMenu">
      <section
        class="section"
        (click)="$event.stopPropagation()"
        (keyup)="$event.stopPropagation()"
      >
        <ng-container *ngIf="config">
          <h4 class="list-title">Hide</h4>

          <ul class="list">
            <ng-container *ngIf="router.url === '/shows/progress'">
              <li *ngFor="let filter of config.filters | category : 'hide'">
                <mat-checkbox [(ngModel)]="filter.value" (ngModelChange)="onFilterChange(filter)">
                  {{ filter.name }}
                </mat-checkbox>
              </li>
            </ng-container>
            <ng-container *ngIf="router.url === '/shows/upcoming'">
              <li *ngFor="let filter of config.upcomingFilters | category : 'hide'">
                <mat-checkbox [(ngModel)]="filter.value" (ngModelChange)="onFilterChange(filter)">
                  {{ filter.name }}
                </mat-checkbox>
              </li>
            </ng-container>
          </ul>

          <h4 class="list-title">Show</h4>

          <ul class="list">
            <ng-container *ngIf="router.url === '/shows/progress'">
              <li *ngFor="let filter of config.filters | category : 'show'">
                <mat-checkbox [(ngModel)]="filter.value" (ngModelChange)="onFilterChange(filter)">
                  {{ filter.name }}
                </mat-checkbox>
              </li>
            </ng-container>
            <ng-container *ngIf="router.url === '/shows/upcoming'">
              <li *ngFor="let filter of config.upcomingFilters | category : 'show'">
                <mat-checkbox [(ngModel)]="filter.value" (ngModelChange)="onFilterChange(filter)">
                  {{ filter.name }}
                </mat-checkbox>
              </li>
            </ng-container>
          </ul>
        </ng-container>
      </section>
    </mat-menu>

    <mat-menu #menuSort="matMenu">
      <section
        class="section"
        (click)="$event.stopPropagation()"
        (keyup)="$event.stopPropagation()"
      >
        <h4 class="list-title">Sort</h4>

        <mat-radio-group
          *ngIf="config"
          class="radio-group"
          [(ngModel)]="config.sort.by"
          (ngModelChange)="configService.config.sync()"
        >
          <mat-radio-button
            *ngFor="let sortBy of config.sort.values"
            [value]="sortBy"
            class="radio-button"
          >
            {{ sortBy }}
          </mat-radio-button>
        </mat-radio-group>
        <ul *ngIf="config" class="list">
          <li *ngFor="let sortOption of config.sortOptions" [value]="sortOption.value">
            <mat-checkbox
              [(ngModel)]="sortOption.value"
              (ngModelChange)="configService.config.sync()"
            >
              {{ sortOption.name }}
            </mat-checkbox>
          </li>
        </ul>
      </section>
    </mat-menu>

    <mat-menu #menu="matMenu">
      <ng-template matMenuContent>
        <ng-container *ngIf="!isLoggedIn">
          <a mat-menu-item [routerLink]="{} | ngGenericPipe : paths.login">
            <mat-icon>login</mat-icon>
            <span>Login</span>
          </a>
        </ng-container>
        <ng-container *ngIf="!isLoggedIn || !(router.url | startsWith : '/shows/s/')">
          <button mat-menu-item [matMenuTriggerFor]="themeMenu">
            <mat-icon>palette</mat-icon>
            <span>Theme</span>
          </button>
          <button mat-menu-item [matMenuTriggerFor]="languageMenu">
            <mat-icon>language</mat-icon>
            <span>Language</span>
          </button>
          <button *ngIf="isLoggedIn" mat-menu-item [matMenuTriggerFor]="syncMenu">
            <mat-icon>sync</mat-icon>
            <span>Sync</span>
          </button>
          <button mat-menu-item (click)="appStatus.checkForUpdate()">
            <mat-icon>update</mat-icon>
            <span>Check for updates</span>
          </button>
        </ng-container>
        <ng-container *ngIf="isLoggedIn && (router.url | startsWith : '/shows/s/')">
          <ng-container *ngIf="showService.activeShow$ | async as show">
            <ng-container *ngIf="listService.lists.$ | async as lists">
              <button
                *ngIf="lists.length > 0"
                mat-menu-item
                (click)="dialogService.manageLists(show.ids.trakt)"
              >
                Manage lists
              </button>
            </ng-container>

            <button mat-menu-item (click)="executeService.addShow(show, { showConfirm: true })">
              Mark as seen
            </button>

            <button
              mat-menu-item
              (click)="
                showService.isFavorite(show)
                  ? showService.removeFavorite(show)
                  : showService.addFavorite(show)
              "
            >
              {{ (show | isFavorite) ? 'Remove favorite' : 'Add favorite' }}
            </button>

            <button
              mat-menu-item
              (click)="
                showService.isHidden(show)
                  ? executeService.removeShowHidden(show)
                  : executeService.addShowHidden(show)
              "
            >
              {{ (show | isHidden) ? 'Unhide show' : 'Hide show' }}
            </button>

            <ng-container *ngIf="router.url | includes : '/season/'">
              <ng-container *ngIf="seasonService.activeSeason$ | async as season">
                <button
                  mat-menu-item
                  (click)="executeService.addSeason(season, show, { showConfirm: true })"
                >
                  Mark season as seen
                </button>
                <button mat-menu-item (click)="executeService.removeSeason(season, show)">
                  Mark season as unseen
                </button>
              </ng-container>
            </ng-container>
          </ng-container>
        </ng-container>
        <button mat-menu-item (click)="onShare()">
          <mat-icon>share</mat-icon>
          <span>Share</span>
        </button>
        <button
          *ngIf="isLoggedIn && !(router.url | startsWith : '/shows/s/')"
          mat-menu-item
          (click)="authService.logout()"
        >
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </ng-template>
    </mat-menu>

    <mat-menu #themeMenu="matMenu">
      <button
        mat-menu-item
        (click)="configService.setTheme(themes.LIGHT); configService.config.sync()"
      >
        Light
      </button>
      <button
        mat-menu-item
        (click)="configService.setTheme(themes.DARK); configService.config.sync()"
      >
        Dark
      </button>
      <button
        mat-menu-item
        (click)="configService.setTheme(themes.SYSTEM); configService.config.sync()"
      >
        System
      </button>
    </mat-menu>

    <mat-menu #languageMenu="matMenu">
      <button
        *ngFor="let language of languages"
        mat-menu-item
        (click)="
          configService.setLanguage(language.short);
          syncService.sync(undefined, { publishSingle: false })
        "
      >
        {{ language.name }}
      </button>
    </mat-menu>

    <mat-menu #syncMenu="matMenu">
      <button mat-menu-item (click)="syncService.syncNew({ showSyncingSnackbar: true })">
        Sync new
      </button>
      <button mat-menu-item (click)="syncService.syncAll({ showSyncingSnackbar: true })">
        Sync all
      </button>
    </mat-menu>
  `,
  styles: [
    `
      @import '../../../shared/styles';

      .toolbar {
        position: fixed;
        top: env(safe-area-inset-top);
        z-index: 2;
      }

      .back-link {
        margin-left: rem(-8px);

        @media (min-width: $breakpoint-sm) {
          margin-right: rem(8px);
        }
      }

      .logo-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;
        text-decoration: none;

        .logo-image {
          height: rem(28px);
          width: auto;
          margin-right: 0.5rem;
          aspect-ratio: 28 / 32;
        }

        .logo-text {
          color: var(--text-color);
          margin-right: 0.5rem;
        }
      }

      .spacer {
        flex: 1 1 auto;
      }

      .list-title {
        margin: rem(12px) 0;
      }

      .section {
        margin: 0 1rem;
      }

      .radio-group {
        display: flex;
        flex-direction: column;
        margin: 0.5rem 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input() isLoggedIn = false;
  @Input() state?: Record<string, string>;
  @Input() config?: Config;

  executeService = inject(ExecuteService);
  listService = inject(ListService);
  syncService = inject(SyncService);
  configService = inject(ConfigService);
  authService = inject(AuthService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  seasonService = inject(SeasonService);
  dialogService = inject(DialogService);
  showService = inject(ShowService);
  appStatus = inject(AppStatusService);

  themes = Theme;
  languages: Language[] = [
    {
      name: 'English',
      short: 'en-US',
    },
    { name: 'Deutsch', short: 'de-DE' },
  ];
  paths = Paths;

  async goBack(url: string | undefined): Promise<void> {
    if (url === undefined) return;
    await this.router.navigateByUrl(url);
  }

  onFilterChange(filter: Filter): void {
    if (!this.config) return;
    const filters = [...this.config.filters, ...this.config.upcomingFilters];
    const otherCategory = filter.category === 'hide' ? 'show' : 'hide';
    const otherFilter = filters.find(
      (innerFilter) =>
        innerFilter.name === filter.name &&
        innerFilter.value &&
        innerFilter.category === otherCategory
    );
    if (otherFilter) otherFilter.value = false;
    this.configService.config.sync();
  }

  async onShare(): Promise<void> {
    try {
      await navigator.share({
        title: document.title,
        url: location.href,
      });
    } catch (err) {
      onError(err, this.snackBar);
    }
  }

  getQueryParams(): z.infer<typeof queryParamSchema> {
    const queryParams = this.router.parseUrl(this.router.url).queryParams;
    return queryParamSchema.parse(queryParams);
  }
}

const queryParamSchema = z.object({
  slug: z.string().optional(),
});
