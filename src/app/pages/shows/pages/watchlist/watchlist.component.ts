import { Component, computed, effect, inject } from '@angular/core';
import { TmdbService } from '../../data/tmdb.service';
import { ListService } from '../../../lists/data/list.service';
import { EpisodeService } from '../../data/episode.service';
import { ExecuteService } from '@services/execute.service';
import { toEpisodeId } from '@helper/toShowId';
import { sortShows } from '@helper/shows';
import { Sort } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import type { Config } from '@type/Config';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { QueryErrorNoticeService } from '@services/query-error-notice.service';

@Component({
  selector: 't-watchlist',
  imports: [
    MatMenuModule,
    ShowsComponent,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    SpinnerComponent,
  ],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
  providers: [QueryErrorNoticeService],
})
export default class WatchlistComponent {
  tmdbService = inject(TmdbService);
  listService = inject(ListService);
  episodeService = inject(EpisodeService);
  executeService = inject(ExecuteService);
  router = inject(Router);
  queryErrorNotice = inject(QueryErrorNoticeService);

  private watchlistItems = this.listService.watchlistItems;
  private episodes = this.episodeService.episodes;

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

  private showsInfosSorted = computed<ShowInfo[]>(() => {
    const showsInfos = this.showsInfosWithoutTmdb();
    const episodes = this.episodes();
    const sorted = [...showsInfos];
    sortShows({ sort: { by: Sort.OLDEST_EPISODE }, sortOptions: [{}] } as Config, sorted, episodes);
    return sorted;
  });

  private shows = computed(() => this.showsInfosSorted().map((s) => s.show));

  private tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.shows);

  isPending = computed(() => {
    const queries = this.tmdbShowQueries();
    return queries.length > 0 && queries.some((q) => q.status() === 'pending');
  });

  /** The Watchlist itself is local; its rows only lose their artwork when TMDB fails. Report that
   *  in a Snackbar and keep the rows on screen rather than replacing them with an error. */
  private readonly tmdbErrorNotice = effect(() => {
    const queries = this.tmdbShowQueries();
    if (queries.length === 0 || !queries.every((query) => query.status() === 'error')) return;
    const error = queries.find((query) => query.error())?.error();
    if (!error) return;
    this.queryErrorNotice.show(error, () => {
      for (const query of queries) void query.refetch();
    });
  });

  showsInfos = this.tmdbService.getShowsInfosWithTmdb(this.tmdbShowQueries, this.showsInfosSorted);
}
