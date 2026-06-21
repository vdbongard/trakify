import { Component, computed, inject } from '@angular/core';
import { TmdbService } from '../../data/tmdb.service';
import { ListService } from '../../../lists/data/list.service';
import { EpisodeService } from '../../data/episode.service';
import { ExecuteService } from '@services/execute.service';
import { toEpisodeId } from '@helper/toShowId';
import type { ShowInfo } from '@type/Show';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';

@Component({
  selector: 't-watchlist',
  imports: [
    MatMenuModule,
    ShowsComponent,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    SpinnerComponent,
    ErrorText,
  ],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
})
export default class WatchlistComponent {
  tmdbService = inject(TmdbService);
  listService = inject(ListService);
  episodeService = inject(EpisodeService);
  executeService = inject(ExecuteService);
  router = inject(Router);

  private watchlistItems = this.listService.watchlistItems;
  private episodes = this.episodeService.getEpisodes;

  private showsInfosWithoutTmdb = computed<ShowInfo[]>(() => {
    const items = this.watchlistItems();
    const episodes = this.episodes();
    return items.map((item) => {
      const show = item.show;
      return {
        show,
        isWatchlist: true,
        nextEpisode: episodes[toEpisodeId(show.ids.trakt, 1, 1)],
      };
    });
  });

  private shows = computed(() => this.showsInfosWithoutTmdb().map((s) => s.show));

  private tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.shows);

  isPending = computed(() => {
    const queries = this.tmdbShowQueries();
    // @ts-expect-error status signal type issue in TanStack Query injectQueries
    return queries.length > 0 && queries.some((q) => q.status() === 'pending');
  });

  isError = computed(() => {
    const queries = this.tmdbShowQueries();
    // @ts-expect-error status signal type issue in TanStack Query injectQueries
    return queries.length > 0 && queries.every((q) => q.status() === 'error');
  });

  watchlistError = computed<Error | null>(() =>
    this.isError() ? new Error('Failed to load watchlist.') : null,
  );

  showsInfos = this.tmdbService.getShowsInfosWithTmdb(
    this.tmdbShowQueries,
    this.showsInfosWithoutTmdb,
  );
}
