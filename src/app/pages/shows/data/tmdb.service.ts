import { computed, inject, Injectable, Signal } from '@angular/core';
import {
  combineLatest,
  first,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  throwError,
} from 'rxjs';
import { TranslationService } from './translation.service';
import { toEpisodeId, toSeasonId } from '@helper/toShowId';
import { LocalStorage } from '@type/Enum';
import { pick } from '@helper/pick';
import { translated } from '@helper/translation';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { API } from '@shared/api';
import { ShowInfo } from '@type/Show';
import {
  TmdbEpisode,
  tmdbEpisodeSchema,
  TmdbSeason,
  tmdbSeasonSchema,
  TmdbShow,
  tmdbShowSchema,
  TmdbShowWithId,
} from '@type/Tmdb';
import { Show, ShowProgress } from '@type/Trakt';
import { QueryObserverResult } from '@tanstack/angular-query-experimental';
import { injectQueries } from '@tanstack/angular-query-experimental/inject-queries-experimental';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);

  static tmdbShowExtendedString = '?append_to_response=videos,external_ids,aggregate_credits';

  tmdbShows = this.syncDataService.syncObjects<TmdbShow>({
    url: API.tmdbShow,
    schema: tmdbShowSchema,
    parseItem: (tmdbShow: TmdbShow) => {
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
        'vote_count',
      );
      if (tmdbShowData.aggregate_credits) {
        tmdbShowData.aggregate_credits.cast = tmdbShowData.aggregate_credits.cast.slice(0, 20);
        delete tmdbShowData.aggregate_credits?.crew;
      }
      if (tmdbShowData.videos) {
        tmdbShowData.videos.results = tmdbShowData.videos.results.filter((video) =>
          ['Trailer', 'Teaser'].includes(video.type),
        );
      }
      return tmdbShowData;
    },
  });

  tmdbSeasons = this.syncDataService.syncObjects<TmdbSeason>({
    url: API.tmdbSeason,
    localStorageKey: LocalStorage.TMDB_SEASONS,
    schema: tmdbSeasonSchema,
    idFormatter: toSeasonId as (...args: unknown[]) => string,
    parseItem: (tmdbSeason: TmdbSeason) => {
      const tmdbSeasonData = pick<TmdbSeason>(tmdbSeason, 'episodes', 'id', 'name', 'poster_path');
      tmdbSeasonData.episodes = tmdbSeasonData.episodes.map((episode) =>
        pick(episode, 'air_date', 'episode_number', 'id', 'name', 'season_number'),
      );
      return tmdbSeasonData;
    },
  });

  tmdbEpisodes = this.syncDataService.syncObjects<TmdbEpisode>({
    url: API.tmdbEpisode,
    localStorageKey: LocalStorage.TMDB_EPISODES,
    schema: tmdbEpisodeSchema,
    idFormatter: toEpisodeId as (...args: unknown[]) => string,
    parseItem: (tmdbEpisode: TmdbEpisode) =>
      pick<TmdbEpisode>(
        tmdbEpisode,
        'air_date',
        'episode_number',
        'id',
        'name',
        'season_number',
        'still_path',
      ),
  });

  fetchTmdbShowExtended(show: Show): Observable<TmdbShow> {
    if (!show.ids.tmdb) return throwError(() => new Error('No TMDB id'));
    const tmdbShowUntranslated$ = this.tmdbShows.fetchIds(
      [show.ids.tmdb, TmdbService.tmdbShowExtendedString],
      { persist: true },
    );

    const language = this.translationService.configService.config.s().language;
    const showTranslation$ =
      language !== 'en-US'
        ? this.translationService.showsTranslations.fetchIds(
            [show.ids.trakt, language.substring(0, 2)],
            { persist: true },
          )
        : of(undefined);

    return combineLatest([tmdbShowUntranslated$, showTranslation$]).pipe(
      map(([tmdbShowUntranslated, showTranslation]) => {
        if (!tmdbShowUntranslated) throw new Error('Tmdb show is empty (fetchTmdbShowExtended)');
        return translated(tmdbShowUntranslated, showTranslation);
      }),
      first(),
    );
  }

  fetchTmdbShowEntry(
    show: Show,
    options?: { force?: boolean; persist?: boolean },
  ): Promise<TmdbShow> {
    if (!show?.ids.tmdb) throw Error('Tmdb show is empty (fetchTmdbShowEntry)');
    const tmdbId: number = show.ids.tmdb;
    const cached = this.tmdbShows.s()[tmdbId];
    const cachedTranslation = this.translationService.getShowTranslation(show);
    if (!options?.force && cached) {
      if (!Object.keys(cached).length) throw Error('Tmdb show is empty (fetchTmdbShowEntry)');
      return Promise.resolve(translated(cached, cachedTranslation));
    }
    return Promise.all([
      lastValueFrom(
        this.tmdbShows.fetchIds([tmdbId, ''], { persist: options?.persist ?? !!cached }),
      ),
      this.translationService.ensureShowTranslation(show, {
        force: options?.force,
        persist: options?.persist ?? (!!cachedTranslation || !!cached),
      }),
    ]).then(([tmdbShow, showTranslation]) => {
      if (!tmdbShow) throw new Error('Tmdb show is empty (fetchTmdbShowEntry)');
      return translated(tmdbShow, showTranslation);
    });
  }

  fetchTmdbSeason(show: Show, seasonNumber: number | undefined): Promise<TmdbSeason> {
    if (!show?.ids.tmdb || seasonNumber === undefined)
      throw Error('Argument is empty (fetchTmdbSeason)');
    const tmdbId: number = show.ids.tmdb;
    const cached = this.tmdbSeasons.s()[toSeasonId(tmdbId, seasonNumber)];
    if (cached) return Promise.resolve(cached);
    return lastValueFrom(this.tmdbSeasons.fetchIds([tmdbId, seasonNumber], { persist: true })).then(
      (season) => {
        if (!season) throw new Error('Season is empty (fetchTmdbSeason)');
        return season;
      },
    );
  }

  fetchTmdbEpisode(
    show: Show,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    options?: { force?: boolean; persist?: boolean },
  ): Promise<TmdbEpisode | undefined | null> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (fetchTmdbEpisode)');
    if (!show.ids.tmdb) return Promise.resolve(undefined);
    const cached = this.tmdbEpisodes.s()[toEpisodeId(show.ids.tmdb, seasonNumber, episodeNumber)];
    if (!options?.force && cached) {
      if (!Object.keys(cached).length) throw Error('Episode is empty (fetchTmdbEpisode)');
      return Promise.resolve(
        translated(
          cached,
          this.translationService.getEpisodeTranslation(show, seasonNumber, episodeNumber),
        ),
      );
    }
    return lastValueFrom(
      this.tmdbEpisodes.fetchIds([show.ids.tmdb, seasonNumber, episodeNumber], {
        persist: options?.persist ?? !!cached,
      }),
    ).then((tmdbEpisode) => {
      if (!tmdbEpisode) throw new Error('Tmdb episode is empty (fetchTmdbEpisode)');
      return translated(
        tmdbEpisode,
        this.translationService.getEpisodeTranslation(show, seasonNumber, episodeNumber),
      );
    });
  }

  removeShow(showIdTmdb: number | null | undefined): void {
    if (!showIdTmdb) return;

    const tmdbShows = this.tmdbShows.s();
    if (!tmdbShows[showIdTmdb]) return;

    console.debug('removing tmdb show:', showIdTmdb, tmdbShows[showIdTmdb]);
    delete tmdbShows[showIdTmdb];
    this.tmdbShows.s.set({ ...tmdbShows });
    this.localStorageService.setObject(LocalStorage.TMDB_SHOWS, tmdbShows);
  }

  getTmdbSeason(show: Show, seasonNumber: number): TmdbSeason {
    const tmdbSeasons = this.tmdbSeasons.s();
    if (!tmdbSeasons) throw Error('Tmdb seasons empty');

    const tmdbSeason = tmdbSeasons[toSeasonId(show.ids.tmdb, seasonNumber)];
    if (!tmdbSeason) throw Error('Tmdb season empty');

    return tmdbSeason;
  }

  getTmdbEpisode(show: Show, seasonNumber: number, episodeNumber: number): TmdbEpisode | undefined {
    const tmdbSeason = this.tmdbSeasons.s()?.[toSeasonId(show.ids.tmdb, seasonNumber)];
    return tmdbSeason?.episodes?.find((episode) => episode.episode_number === episodeNumber);
  }

  fetchTmdbShow(show: Show): Promise<TmdbShowWithId> {
    const tmdbShow = this.fetchTmdbShowEntry(show).catch(() => null);
    const traktId = show.ids.trakt;
    return lastValueFrom(forkJoin([tmdbShow, of({ traktId })]));
  }

  getTmdbShowQueries(
    shows: Signal<Show[] | undefined>,
  ): Signal<QueryObserverResult<Signal<TmdbShowWithId>>[]> {
    return injectQueries(() => ({
      queries:
        shows()?.map((show) => ({
          queryKey: ['tmdbShow', show.ids.trakt],
          queryFn: (): Promise<TmdbShowWithId> => this.fetchTmdbShow(show),
        })) ?? [],
    }));
  }

  getShowsInfosWithTmdb(
    tmdbShowQueries: Signal<QueryObserverResult<Signal<TmdbShowWithId>>[]>,
    showsInfosWithoutTmdb: Signal<ShowInfo[]>,
  ): Signal<ShowInfo[]> {
    return computed(() => {
      const tmdbShowData = tmdbShowQueries().map((query) => query.data);
      const showsInfosWithTmdb = showsInfosWithoutTmdb().map((showInfos) => {
        const i = tmdbShowData.findIndex((t) => t?.()?.[1]?.traktId === showInfos.show.ids.trakt);
        const tmdbShow = tmdbShowData[i]?.()?.[0];
        return { ...showInfos, tmdbShow };
      });
      return showsInfosWithTmdb;
    });
  }

  toTmdbSeason(show: Show, showProgress: ShowProgress | undefined): TmdbSeason | undefined {
    if (!showProgress?.next_episode) return;

    const seasonId = toSeasonId(show.ids.tmdb, showProgress.next_episode.season);
    const tmdbSeason = this.tmdbSeasons.s()[seasonId];
    return tmdbSeason;
  }
}
