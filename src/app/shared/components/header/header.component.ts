import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ExecuteService } from '@services/execute.service';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { ListService } from '../../../pages/lists/data/list.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SyncService } from '@services/sync.service';
import { ConfigService } from '@services/config.service';
import { Theme } from '@type/Enum';
import { Config, Filter, Language, LanguageName, LanguageShort } from '@type/Config';
import { AuthService } from '@services/auth.service';
import { onError } from '@helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeasonService } from '../../../pages/shows/data/season.service';
import { DialogService } from '@services/dialog.service';
import { z } from 'zod';
import * as Paths from '@shared/paths';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ShowService } from '../../../pages/shows/data/show.service';
import { AppStatusService } from '@services/app-status.service';
import { getUrl } from '@helper/url';
import { State } from '@type/State';

@Component({
  selector: 't-header',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    MatToolbarModule,
    NgOptimizedImage,
    MatProgressSpinnerModule,
    MatRadioModule,
    FormsModule,
    MatCheckboxModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
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

  config = input<Config>();
  isLoggedIn = input<boolean>();
  state = input<State>();

  url = getUrl(this.router);
  lists = this.listService.lists.s;

  isList = computed(() => this.url().startsWith('/lists'));
  hasFilter = computed(() => ['/shows/progress', '/shows/upcoming'].includes(this.url()));
  hasSort = computed(() => ['/shows/progress'].includes(this.url()));
  hideFilters = computed(() => this.config()?.filters.filter((v) => v.category === 'hide'));
  upcomingHideFilters = computed(
    () => this.config()?.upcomingFilters.filter((v) => v.category === 'hide'),
  );
  showFilters = computed(() => this.config()?.filters.filter((v) => v.category === 'show'));
  upcomingShowFilters = computed(
    () => this.config()?.upcomingFilters.filter((v) => v.category === 'show'),
  );
  isShow = computed(() => this.url().startsWith('/shows/s/'));
  isSeason = computed(() => this.url().startsWith('/shows/s/') && this.url().includes('/season/'));
  isFavoriteShow = computed(() => this.showService.isFavorite(this.showService.activeShow()));
  isHiddenShow = computed(() => this.showService.isHidden(this.showService.activeShow()));
  hasLists = computed(() => this.lists() && this.lists()!.length > 0);

  protected readonly Languages: Language[] = [
    {
      name: LanguageName.EN_US,
      short: LanguageShort.EN_US,
    },
    {
      name: LanguageName.DE_DE,
      short: LanguageShort.DE_DE,
    },
  ];
  protected readonly Theme = Theme;
  protected readonly Paths = Paths;

  async goBack(url: string | undefined): Promise<void> {
    if (url === undefined) return;
    await this.router.navigateByUrl(url);
  }

  onFilterChange(filter: Filter): void {
    if (!this.config()) return;
    const filters = [...this.config()!.filters, ...this.config()!.upcomingFilters];
    const otherCategory = filter.category === 'hide' ? 'show' : 'hide';
    const otherFilter = filters.find(
      (innerFilter) =>
        innerFilter.name === filter.name &&
        innerFilter.value &&
        innerFilter.category === otherCategory,
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
