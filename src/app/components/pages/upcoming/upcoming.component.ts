import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, takeUntil } from 'rxjs';
import { ShowService } from '../../../services/trakt/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { BaseComponent } from '../../../helper/base-component';
import { EpisodeAiring, EpisodeFull, Translation } from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { LoadingState } from '../../../../types/enum';
import { EpisodeService } from '../../../services/trakt/episode.service';
import { TranslationService } from '../../../services/trakt/translation.service';

@Component({
  selector: 'app-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  shows: ShowInfo[] = [];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private translationService: TranslationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.episodeService
      .fetchCalendar(198)
      .pipe(
        switchMap((episodesAiring) => this.combine(episodesAiring)),
        map(this.getShowInfo),
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

  combine(
    episodesAiring: EpisodeAiring[]
  ): Observable<
    [
      EpisodeAiring[],
      (TmdbShow | undefined)[],
      (Translation | undefined)[],
      (Translation | undefined)[]
    ]
  > {
    return combineLatest([
      of(episodesAiring),
      combineLatest(
        episodesAiring.map((episodeAiring) => this.tmdbService.getTmdbShow$(episodeAiring.show.ids))
      ),
      combineLatest(
        episodesAiring.map((episodeAiring) =>
          this.translationService.getShowTranslation$(episodeAiring.show.ids.trakt)
        )
      ),
      combineLatest(
        episodesAiring.map((episodeAiring) =>
          this.episodeService.getEpisodeTranslation$(
            episodeAiring.show.ids,
            episodeAiring.episode.season,
            episodeAiring.episode.number,
            true
          )
        )
      ),
    ]);
  }

  getShowInfo([episodesAiring, tmdbShows, showTranslations, nextEpisodeTranslations]: [
    EpisodeAiring[],
    (TmdbShow | undefined)[],
    (Translation | undefined)[],
    (Translation | undefined)[]
  ]): ShowInfo[] {
    return episodesAiring.map((episodeAiring, i) => {
      const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
      episodeFull.first_aired = episodeAiring.first_aired;
      return {
        show: episodeAiring.show,
        showTranslation: showTranslations[i],
        nextEpisode: episodeFull as EpisodeFull,
        nextEpisodeTranslation: nextEpisodeTranslations[i],
        tmdbShow: tmdbShows[i],
      };
    });
  }
}
