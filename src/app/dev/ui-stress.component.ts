import { Component, Injectable, computed, effect, inject, input, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SM } from '@constants';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ShowHeaderComponent } from '../pages/shows/pages/show/ui/show-header/show-header.component';
import { ShowDetailsComponent } from '../pages/shows/pages/show/ui/show-details/show-details.component';
import { ShowCastComponent } from '../pages/shows/pages/show/ui/show-cast/show-cast.component';
import { SeasonEpisodesComponent } from '../pages/shows/pages/season/ui/season-episodes/season-episodes.component';
import { ShowSeasonsComponent } from '../pages/shows/pages/show/ui/show-seasons/show-seasons.component';
import StatisticsComponent from '../pages/statistics/statistics.component';
import { StatsService } from '../pages/statistics/data/stats.service';
import { StatsApiService } from '../pages/statistics/data/stats-api.service';
import { DataMode, dataModes, makeStressShow, stressCast, stressShows } from './ui-stress.fixtures';

@Injectable()
class StressStats {
  count = signal(3);
  showStats = computed(() => ({ showsCount: this.count(), showsHiddenCount: 0 }));
  episodeStats = computed(() => ({
    episodesCount: this.count() === 1 ? 1 : this.count() * 1284,
    watchedEpisodesCount: this.count(),
    notHiddenEpisodesCount: this.count() === 1 ? 1 : this.count() * 1284,
    notHiddenWatchedEpisodesCount: this.count(),
  }));
}

@Component({
  imports: [
    RouterLink,
    MatMenuModule,
    ShowsComponent,
    ShowHeaderComponent,
    ShowDetailsComponent,
    ShowCastComponent,
    BaseEpisodeComponent,
    SeasonEpisodesComponent,
    ShowSeasonsComponent,
    StatisticsComponent,
    ErrorText,
    SpinnerComponent,
  ],
  providers: [
    StressStats,
    {
      provide: StatsService,
      useFactory: (): Pick<StatsService, 'getShowStats' | 'getEpisodeStats'> => {
        const stats = inject(StressStats);
        return { getShowStats: () => stats.showStats, getEpisodeStats: () => stats.episodeStats };
      },
    },
    {
      provide: StatsApiService,
      useValue: { fetchStats: (): Promise<null> => Promise.resolve(null) },
    },
  ],
  selector: 't-ui-stress',
  styleUrl: './ui-stress.component.scss',
  templateUrl: './ui-stress.component.html',
})
export default class UiStressComponent {
  router = inject(Router);
  isSmall = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: ' + SM + ')')
      .pipe(map((state) => state.matches)),
  );
  stats = inject(StressStats);
  data = input<string>('demo');
  surface = input<string>('shows');
  mode = computed<DataMode>(() => dataModes.find((mode) => mode === this.data()) ?? 'demo');
  rows = computed(() => stressShows(this.mode()));
  detail = computed(() => this.rows()[0] ?? makeStressShow(0, this.mode()));
  cast = computed(() => stressCast(this.mode()));
  episodes = computed(() =>
    this.rows().flatMap((row, index) =>
      row.nextEpisode ? [{ ...row.nextEpisode, season: 1, number: index + 1 }] : [],
    ),
  );
  modes = dataModes;
  surfaces = ['shows', 'show', 'season', 'episode', 'statistics', 'error'];
  labels: Record<DataMode, string> = {
    demo: 'Demo data',
    worst: 'Worst case',
    empty: 'Empty',
    one: 'One',
    huge: '1,284 rows',
    missingRole: 'Missing role',
    loading: 'Loading',
  };
  error = new Error(
    'Unable to load this show. Request to https://example.com/shows/donaudampfschifffahrtsgesellschaftskapitaen failed. Please try again.',
  );

  constructor() {
    effect(() =>
      this.stats.count.set(
        this.mode() === 'empty' ? 0 : this.mode() === 'huge' ? 1284 : this.mode() === 'one' ? 1 : 3,
      ),
    );
  }

  async select(data: DataMode): Promise<void> {
    await this.router.navigate([], { queryParams: { data }, queryParamsHandling: 'merge' });
  }
}
