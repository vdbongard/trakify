import { Component, inject, Input } from '@angular/core';
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
import { Theme } from '@type/Enum';
import { Config, Filter, Language } from '@type/Config';
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

  @Input() isLoggedIn = false;
  @Input() state?: Record<string, string>;
  @Input() config?: Config;

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
