import { Injectable } from '@angular/core';
import {
  catchError,
  combineLatest,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { SeasonInfo, ShowInfo } from '../../types/interfaces/Show';
import { filterShows, isShowMissing, sortShows } from '../helper/shows';
import { episodeId } from '../helper/episodeId';
import { ShowService } from './trakt/show.service';
import { TmdbService } from './tmdb.service';
import { ConfigService } from './config.service';
import { EpisodeService } from './trakt/episode.service';
import {
  Episode,
  EpisodeFull,
  Ids,
  SeasonProgress,
  SeasonWatched,
  TraktShow,
} from '../../types/interfaces/Trakt';
import { setLocalStorage } from '../helper/localStorage';
import { LocalStorage } from '../../types/enum';
import { TmdbShow } from '../../types/interfaces/Tmdb';
import { SeasonService } from './trakt/season.service';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  constructor(
    private showService: ShowService,
    private tmdbService: TmdbService,
    private configService: ConfigService,
    private episodeService: EpisodeService,
    private seasonService: SeasonService
  ) {}

  getShowsFilteredAndSorted$(): Observable<ShowInfo[]> {
    return combineLatest([
      this.showService.getShowsAdded$(),
      this.showService.getShowsAddedProgress$(),
      this.episodeService.getShowsAddedEpisodes$(),
      this.episodeService.getShowsEpisodesTranslations$(),
      this.showService.showsTranslations$,
      this.showService.showsHidden$,
      this.showService.favorites$,
      this.configService.config$,
      this.tmdbService.tmdbShows$,
    ]).pipe(
      map(
        ([
          showsAdded,
          showsProgress,
          showsEpisodes,
          showsEpisodesTranslations,
          showsTranslations,
          showsHidden,
          favorites,
          config,
          tmdbShows,
        ]) => {
          const tmdbShowsArray = Object.values(tmdbShows);

          if (isShowMissing(showsAdded, tmdbShowsArray, showsProgress, showsEpisodes)) return [];

          const shows: ShowInfo[] = [];

          showsAdded.forEach((show) => {
            const showProgress = showsProgress[show.ids.trakt];
            const tmdbShow = tmdbShowsArray.find((tmdbShow) => tmdbShow?.id === show.ids.tmdb);

            if (filterShows(config, showProgress, tmdbShow, showsHidden, show)) return;

            const episodeIdentifier = episodeId(
              show.ids.trakt,
              showProgress.next_episode?.season,
              showProgress.next_episode?.number
            );

            shows.push({
              show,
              showTranslation: showsTranslations[show.ids.trakt],
              showProgress,
              tmdbShow,
              isFavorite: favorites.includes(show.ids.trakt),
              showWatched: this.showService.getShowWatched(show.ids.trakt),
              nextEpisode: showsEpisodes[episodeIdentifier],
              nextEpisodeTranslation: showsEpisodesTranslations[episodeIdentifier],
            });
          });

          sortShows(config, shows, showsEpisodes);

          return shows;
        }
      )
    );
  }

  getShowInfo$(slug?: string): Observable<ShowInfo | undefined> {
    if (!slug) return of(undefined);

    return this.showService.getShow$(slug).pipe(
      switchMap((show) => {
        if (!show) return of([]);
        return combineLatest([
          this.showService.getShowWatched$(show.ids.trakt),
          this.showService.getShowProgress$(show.ids.trakt),
          this.showService
            .getShowTranslation$(show.ids.trakt)
            .pipe(catchError(() => of(undefined))),
          this.tmdbService.getTmdbShow$(show.ids.tmdb).pipe(catchError(() => of(undefined))),
          of(show),
        ]);
      }),
      switchMap(([showWatched, showProgress, showTranslation, tmdbShow, show]) => {
        const showInfo: ShowInfo = {
          show,
          showWatched,
          showProgress,
          showTranslation,
          tmdbShow,
        };

        const isShowEnded = tmdbShow ? ['Ended', 'Canceled'].includes(tmdbShow.status) : false;

        const seasonNumber = showProgress?.next_episode
          ? showProgress.next_episode.season
          : isShowEnded && showWatched
          ? undefined
          : 1;
        const episodeNumber = showProgress?.next_episode
          ? showProgress.next_episode.number
          : isShowEnded && showWatched
          ? undefined
          : 1;

        if (seasonNumber !== undefined && episodeNumber !== undefined) {
          showInfo.nextEpisodeProgress = showProgress?.seasons
            .find((season) => season.number === seasonNumber)
            ?.episodes?.find((episode) => episode.number === episodeNumber);
        }

        return combineLatest([
          this.episodeService.getShowEpisode$(show.ids.trakt, seasonNumber, episodeNumber),
          this.episodeService.getShowEpisodeTranslation$(
            show.ids.trakt,
            seasonNumber,
            episodeNumber
          ),
          this.tmdbService.getTmdbEpisode$(show.ids.tmdb, seasonNumber, episodeNumber),
          of(showInfo),
        ]);
      }),
      switchMap(([nextEpisode, nextEpisodeTranslation, tmdbNextEpisode, showInfo]) => {
        showInfo.nextEpisode = nextEpisode;
        showInfo.nextEpisodeTranslation = nextEpisodeTranslation;
        showInfo.tmdbNextEpisode = tmdbNextEpisode;
        return of(showInfo);
      })
    );
  }

  getSeasonInfo$(slug?: string, seasonNumber?: number): Observable<SeasonInfo | undefined> {
    if (slug === undefined || seasonNumber === undefined) return of(undefined);

    return this.showService.getIdsBySlug$(slug).pipe(
      switchMap((ids) => {
        if (!ids) return of([]);
        return combineLatest([
          this.seasonService.getSeasonProgress$(ids.trakt, seasonNumber),
          this.showService.getShow$(ids.trakt).pipe(catchError(() => of(undefined))),
          this.showService.getShowTranslation$(ids.trakt).pipe(catchError(() => of(undefined))),
          this.tmdbService.getTmdbShow$(ids.tmdb).pipe(catchError(() => of(undefined))),
          of(ids),
        ]);
      }),
      switchMap(([seasonProgress, show, showTranslation, tmdbShow, ids]) => {
        const seasonInfo: SeasonInfo = {
          seasonProgress,
          seasonNumber,
          show,
          showTranslation,
        };

        const episodeCount = seasonProgress
          ? seasonProgress.episodes.length
          : tmdbShow?.seasons.find((season) => season.season_number === seasonNumber)
              ?.episode_count;

        return combineLatest([
          of(seasonInfo),
          this.episodeService
            .getEpisodes$(episodeCount, ids, seasonNumber)
            .pipe(catchError(() => of(undefined))),
          this.episodeService
            .getEpisodesTranslation$(episodeCount, ids, seasonNumber)
            .pipe(catchError(() => of(undefined))),
          seasonProgress
            ? from(this.episodeService.syncSeasonEpisodes(episodeCount, ids, seasonNumber))
            : of(undefined),
        ]);
      }),
      switchMap(([seasonInfo, episodes, episodesTranslation]) => {
        seasonInfo.episodes = episodes;
        seasonInfo.episodesTranslations = episodesTranslation;

        return of(seasonInfo);
      })
    );
  }

  addNewShow(ids: Ids | undefined, episode?: Episode): void {
    if (!ids || (episode && !(episode.season === 1 && episode.number === 1))) return;

    forkJoin([
      this.showService.getShow$(ids.trakt).pipe(take(1)),
      this.tmdbService.getTmdbShow$(ids.tmdb).pipe(take(1)),
      this.episodeService.getEpisode$(ids, 1, 1).pipe(take(1)),
    ]).subscribe(([show, tmdbShow, nextEpisode]) => {
      if (!show) return;

      const showInfo = this.getShowInfoForNewShow(show, tmdbShow, nextEpisode);
      if (!showInfo) return;

      const showInfos = this.showService.addedShowInfos$.value;
      showInfos[show.ids.trakt] = showInfo;
      setLocalStorage<{ [showId: number]: ShowInfo }>(LocalStorage.ADDED_SHOW_INFO, showInfos);
      this.showService.addedShowInfos$.next(showInfos);
    });
  }

  removeNewShow(showId: number): void {
    const addedShow = this.showService.addedShowInfos$.value[showId];
    if (!addedShow) return;

    delete this.showService.addedShowInfos$.value[showId];
    setLocalStorage<{ [showId: number]: ShowInfo }>(
      LocalStorage.ADDED_SHOW_INFO,
      this.showService.addedShowInfos$.value
    );
    this.showService.addedShowInfos$.next(this.showService.addedShowInfos$.value);
    this.showService.removeFavorite(showId);
  }

  getShowInfoForNewShow(
    show: TraktShow | undefined,
    tmdbShow: TmdbShow | undefined,
    nextEpisode: EpisodeFull | undefined
  ): ShowInfo | undefined {
    if (!show || !tmdbShow || !nextEpisode) return;
    return {
      show,
      nextEpisode,
      showProgress: {
        aired: tmdbShow.number_of_episodes,
        completed: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_episode: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        next_episode: {
          ids: {
            imdb: '',
            slug: '',
            tmdb: 0,
            trakt: 0,
            tvdb: 0,
            tvrage: 0,
          },
          number: 1,
          season: 1,
          title: nextEpisode.title,
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              aired: tmdbSeason.episode_count,
              completed: 0,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    completed: false,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                  };
                }),
              number: tmdbSeason.season_number,
              title: tmdbSeason.name,
            };
          })
          .filter(Boolean) as SeasonProgress[],
      },
      showWatched: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_updated_at: null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        last_watched_at: null,
        plays: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        reset_at: null,
        seasons: tmdbShow.seasons
          .map((tmdbSeason) => {
            if (tmdbSeason.season_number === 0) return;
            return {
              number: tmdbSeason.season_number,
              episodes: Array(tmdbSeason.episode_count)
                .fill(0)
                .map((_, index) => {
                  return {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    last_watched_at: null,
                    number: index + 1,
                    plays: 0,
                  };
                }),
            };
          })
          .filter(Boolean) as SeasonWatched[],
        show,
      },
    };
  }
}
