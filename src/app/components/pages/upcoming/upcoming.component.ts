import { Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { BaseComponent } from '../../../helper/base-component';
import { EpisodeAiring, EpisodeFull } from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent extends BaseComponent implements OnInit {
  loadingState = new Subject<LoadingState>();
  shows: ShowInfo[] = [];

  constructor(public showService: ShowService, public tmdbService: TmdbService) {
    super();
  }

  ngOnInit(): void {
    this.showService
      .fetchCalendar(198)
      .pipe(
        switchMap((episodesAiring) => this.combineWithTmdbShows(episodesAiring)),
        map(([episodesAiring, tmdbShows]) => this.getShowInfo(episodesAiring, tmdbShows)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (shows) => {
          this.shows = shows;
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: () => this.loadingState.next(LoadingState.ERROR),
      });
  }

  combineWithTmdbShows(episodesAiring: EpisodeAiring[]): Observable<[EpisodeAiring[], TmdbShow[]]> {
    return combineLatest([
      of(episodesAiring),
      combineLatest(
        episodesAiring.map((episodeAiring) =>
          this.tmdbService.getTmdbShow$(episodeAiring.show.ids.tmdb)
        )
      ),
    ]);
  }

  getShowInfo(episodesAiring: EpisodeAiring[], tmdbShows: TmdbShow[]): ShowInfo[] {
    return episodesAiring.map((episodeAiring, i) => {
      const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
      episodeFull.first_aired = episodeAiring.first_aired;
      return {
        show: episodeAiring.show,
        nextEpisode: episodeFull as EpisodeFull,
        tmdbShow: tmdbShows[i],
      };
    });
  }
}
