import { Injectable } from '@angular/core';
import { combineLatest, concat, EMPTY, map, merge, Observable, of, switchMap, tap } from 'rxjs';

import { ShowService } from './show.service';
import { TranslationService } from './translation.service';

import { episodeId, seasonId } from '@helper/episodeId';

import { LocalStorage } from '@type/enum';

import type { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
import { tmdbEpisodeSchema, tmdbSeasonSchema, tmdbShowSchema } from '@type/interfaces/Tmdb';
import type { Show } from '@type/interfaces/Trakt';
import type { FetchOptions } from '@type/interfaces/Sync';
import { api } from '@shared/api';
import { translated } from '@helper/translation';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { pick } from '@helper/pick';
import { ShowInfo } from '@type/interfaces/Show';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  static tmdbShowExtendedString = '?append_to_response=videos,external_ids,aggregate_credits';

  tmdbShows = this.syncDataService.syncObjects<TmdbShow>({
    url: api.tmdbShow,
    localStorageKey: LocalStorage.TMDB_SHOWS,
    schema: tmdbShowSchema,
    mapFunction: (tmdbShow: TmdbShow) => {
      const tmdbShowData = pick(
        tmdbShow,
        'aggregate_credits',
        'created_by',
        'episode_run_time',
        'external_ids',
        'first_air_date',
        'genres',
        'homepage',
        'id',
        'name',
        'networks',
        'number_of_episodes',
        'overview',
        'poster_path',
        'seasons',
        'status',
        'type',
        'videos',
        'vote_average',
        'vote_count'
      );
      if (tmdbShowData.aggregate_credits) {
        tmdbShowData.aggregate_credits.cast = tmdbShowData.aggregate_credits.cast.slice(0, 20);
        delete tmdbShowData.aggregate_credits?.crew;
      }
      if (tmdbShowData.videos) {
        tmdbShowData.videos.results = tmdbShowData.videos.results.filter((video) =>
          ['Trailer', 'Teaser'].includes(video.type)
        );
      }
      return tmdbShowData;
    },
  });

  tmdbSeasons = this.syncDataService.syncObjects<TmdbSeason>({
    url: api.tmdbSeason,
    localStorageKey: LocalStorage.TMDB_SEASONS,
    schema: tmdbSeasonSchema,
    idFormatter: seasonId as (...args: unknown[]) => string,
    mapFunction: (tmdbSeason: TmdbSeason) => {
      const tmdbSeasonData = pick<TmdbSeason>(tmdbSeason, 'episodes', 'id', 'name', 'poster_path');
      tmdbSeasonData.episodes = tmdbSeasonData.episodes.map((episode) =>
        pick(episode, 'air_date', 'episode_number', 'id', 'name', 'season_number')
      );
      return tmdbSeasonData;
    },
  });
  tmdbEpisodes = this.syncDataService.syncObjects<TmdbEpisode>({
    url: api.tmdbEpisode,
    localStorageKey: LocalStorage.TMDB_EPISODES,
    schema: tmdbEpisodeSchema,
    idFormatter: episodeId as (...args: unknown[]) => string,
    mapFunction: (tmdbEpisode: TmdbEpisode) =>
      pick<TmdbEpisode>(
        tmdbEpisode,
        'air_date',
        'episode_number',
        'id',
        'name',
        'season_number',
        'still_path'
      ),
  });

  constructor(
    private showService: ShowService,
    private translationService: TranslationService,
    private localStorageService: LocalStorageService,
    private syncDataService: SyncDataService
  ) {}

  getTmdbShows$(): Observable<{ [showId: number]: TmdbShow }> {
    return combineLatest([
      this.tmdbShows.$,
      this.translationService.showsTranslations.$,
      this.showService.getShows$(),
    ]).pipe(
      switchMap(([tmdbShows, showsTranslation, shows]) => {
        const tmdbShowsTranslated = Object.entries(tmdbShows).map(([tmdbIdString, tmdbShow]) => {
          if (!tmdbShow) return [tmdbIdString, tmdbShow];
          const traktId = shows.find((show) => show.ids.tmdb === parseInt(tmdbIdString))?.ids.trakt;

          return [
            tmdbIdString,
            translated(tmdbShow, traktId ? showsTranslation[traktId] : undefined),
          ];
        });

        return of(Object.fromEntries(tmdbShowsTranslated));
      })
    );
  }

  getTmdbShow$(
    show?: Show,
    extended?: boolean,
    options?: FetchOptions
  ): Observable<TmdbShow | undefined> {
    if (!show) throw Error('Show is empty (getTmdbShow$)');
    return this.tmdbShows.$.pipe(
      switchMap((tmdbShows) => {
        const tmdbShow: TmdbShow | undefined = show.ids.tmdb ? tmdbShows[show.ids.tmdb] : undefined;

        const showTranslation$ = show
          ? this.translationService.getShowTranslation$(show, {
              ...options,
              sync: !!tmdbShow || options?.sync,
            })
          : of(undefined);

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbShow))) {
          let tmdbShow$ = merge(
            tmdbShow ? of(tmdbShow) : EMPTY, // todo add translation here instead
            history.state.showInfo ? of((history.state.showInfo as ShowInfo).tmdbShow) : EMPTY,
            combineLatest([
              this.tmdbShows.fetch(
                show.ids.tmdb,
                extended ? TmdbService.tmdbShowExtendedString : '',
                !!tmdbShow || options.sync
              ),
              this.translationService.getShowTranslation$(show, { fetch: true }), // todo remove translation here because it is below already
            ]).pipe(map(([show, translation]) => translated(show, translation)))
          )
            .pipe(distinctUntilChangedDeep())
            .pipe(tap((v) => console.log('v tmdb show', v)));

          // if (tmdbShow)
          //   tmdbShow$ = concat(of(tmdbShow), tmdbShow$).pipe(distinctUntilChangedDeep());

          return combineLatest([tmdbShow$, showTranslation$]).pipe(
            map(([tmdbShow, showTranslation]) => {
              if (!tmdbShow) throw Error('Show is empty (getTmdbShow$ 2)');
              return translated(tmdbShow, showTranslation);
            })
          );
        }

        if (!tmdbShow || (tmdbShow && !Object.keys(tmdbShow).length)) return of(undefined);

        return combineLatest([of(tmdbShow), showTranslation$]).pipe(
          map(([tmdbShow, showTranslation]) => translated(tmdbShow, showTranslation))
        );
      }),
      distinctUntilChangedDeep()
    );
  }

  getTmdbSeason$(
    show: Show,
    seasonNumber: number | undefined,
    sync?: boolean,
    fetch?: boolean
  ): Observable<TmdbSeason> {
    if (!show || !show.ids.tmdb || seasonNumber === undefined)
      throw Error('Argument is empty (getTmdbSeason$)');
    return this.tmdbSeasons.$.pipe(
      switchMap((tmdbSeasons) => {
        const tmdbSeason = tmdbSeasons[seasonId(show.ids.tmdb, seasonNumber)];
        if (fetch && !tmdbSeason)
          return merge(
            history.state.showInfo ? of((history.state.showInfo as ShowInfo).tmdbSeason!) : EMPTY,
            this.tmdbSeasons.fetch(show.ids.tmdb, seasonNumber, sync)
          )
            .pipe(distinctUntilChangedDeep())
            .pipe(tap((v) => console.log('v tmdbSeason', v)));
        if (!tmdbSeason) throw Error('Season is empty (getTmdbSeason$)');
        return of(tmdbSeason);
      })
    );
  }

  getTmdbEpisode$(
    show: Show,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    options?: FetchOptions
  ): Observable<TmdbEpisode | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getTmdbEpisode$)');

    return this.tmdbEpisodes.$.pipe(
      switchMap((tmdbEpisodes) => {
        const tmdbEpisode = tmdbEpisodes[episodeId(show.ids.tmdb, seasonNumber, episodeNumber)];

        if (show.ids.tmdb && (options?.fetchAlways || (options?.fetch && !tmdbEpisode))) {
          let tmdbEpisode$ = merge(
            history.state.showInfo
              ? of((history.state.showInfo as ShowInfo).tmdbNextEpisode)
              : EMPTY,
            this.tmdbEpisodes.fetch(
              show.ids.tmdb,
              seasonNumber,
              episodeNumber,
              options.sync || !!tmdbEpisode
            ) // todo add translation
          )
            .pipe(distinctUntilChangedDeep())
            .pipe(tap((v) => console.log('v tmdbEpisode', v)));

          if (tmdbEpisode)
            tmdbEpisode$ = concat(of(tmdbEpisode), tmdbEpisode$).pipe(distinctUntilChangedDeep());
          return tmdbEpisode$;
        }

        if (tmdbEpisode && !Object.keys(tmdbEpisode).length)
          throw Error('Episode is empty (getTmdbEpisode$)');

        return of(tmdbEpisode);
      })
    );
  }

  removeShow(showIdTmdb: number | null): void {
    if (!showIdTmdb) return;

    const tmdbShows = this.tmdbShows.$.value;
    if (!tmdbShows[showIdTmdb]) return;

    console.debug('removing tmdb show:', showIdTmdb, tmdbShows[showIdTmdb]);
    delete tmdbShows[showIdTmdb];
    this.tmdbShows.$.next(tmdbShows);
    this.localStorageService.setObject(LocalStorage.TMDB_SHOWS, tmdbShows);
  }

  getTmdbSeason(show: Show, seasonNumber: number): TmdbSeason {
    const tmdbSeasons = this.tmdbSeasons.$.value;
    if (!tmdbSeasons) throw Error('Tmdb seasons empty');

    const tmdbSeason = tmdbSeasons[seasonId(show.ids.tmdb, seasonNumber)];
    if (!tmdbSeason) throw Error('Tmdb season empty');

    return tmdbSeason;
  }

  getTmdbEpisode(show: Show, seasonNumber: number, episodeNumber: number): TmdbEpisode | undefined {
    const tmdbSeason = this.getTmdbSeason(show, seasonNumber);
    return tmdbSeason.episodes.find((e) => e.episode_number === episodeNumber);
  }

  getTmdbShow(show: Show): TmdbShow {
    const tmdbShows = this.tmdbShows.$.value;
    if (!tmdbShows) throw Error('Tmdb shows empty');

    const tmdbShow = show.ids.tmdb && tmdbShows[show.ids.tmdb];
    if (!tmdbShow) throw Error('Tmdb show empty');

    return tmdbShow;
  }
}