import { Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { wait } from '../../../helper/wait';
import { BaseComponent } from '../../../helper/base-component';
import { EpisodeAiring, EpisodeFull } from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent extends BaseComponent implements OnInit {
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(public showService: ShowService, public tmdbService: TmdbService) {
    super();
  }

  ngOnInit(): void {
    this.showService
      .fetchCalendar(198)
      .pipe(
        tap(() => this.isLoading.next(true)),
        switchMap((episodesAiring) => this.combineWithTmdbShows(episodesAiring)),
        map(([episodesAiring, tmdbShows]) => this.getShowInfo(episodesAiring, tmdbShows)),
        takeUntil(this.destroy$)
      )
      .subscribe(async (shows) => {
        this.shows = shows;
        await wait();
        this.isLoading.next(false);
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
