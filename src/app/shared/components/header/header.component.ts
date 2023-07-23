import { Component, computed, inject, Input, Signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
import { Config, Filter, Language } from '@type/Config';
import { AuthService } from '@services/auth.service';
import { onError } from '@helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeasonService } from '../../../pages/shows/data/season.service';
import { DialogService } from '@services/dialog.service';
import { z } from 'zod';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import * as Paths from '@shared/paths';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ShowService } from '../../../pages/shows/data/show.service';
import { AppStatusService } from '@services/app-status.service';
import { getUrl } from '@helper/url';
import { toSignal } from '@angular/core/rxjs-interop';
import { State } from '@type/State';

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
    NgGenericPipeModule,
    MatRadioModule,
    FormsModule,
    MatCheckboxModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
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

  @Input({ required: true }) isLoggedIn!: boolean;
  @Input({ required: true }) config!: Signal<Config | undefined>;
  @Input() state?: State;

  url = getUrl(this.router);
  lists = toSignal(this.listService.lists.$);
  isSyncing = toSignal(this.syncService.isSyncing);

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

  themes = Theme;
  languages: Language[] = [
    {
      name: 'English',
      short: 'en-US',
    },
    { name: 'Deutsch', short: 'de-DE' },
  ];
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
