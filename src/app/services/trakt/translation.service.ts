import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { Ids, Translation } from '../../../types/interfaces/Trakt';
import { syncObjectsTrakt } from '../../helper/sync';
import { LocalStorage } from '../../../types/enum';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config.service';
import { episodeId } from '../../helper/episodeId';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  showsTranslations$: BehaviorSubject<{ [showId: string]: Translation }>;
  syncShowTranslation: (
    showId: number | undefined,
    language: string,
    force?: boolean
  ) => Observable<void>;
  private readonly fetchShowTranslation: (
    showId: number | string | undefined,
    language: string,
    sync?: boolean
  ) => Observable<Translation | undefined>;

  showsEpisodesTranslations$: BehaviorSubject<{ [episodeId: string]: Translation }>;
  syncShowEpisodeTranslation: (
    showId: number | undefined,
    seasonNumber: number | undefined,
    episodeNumber: number | undefined,
    language: string,
    force?: boolean
  ) => Observable<void>;
  private readonly fetchShowEpisodeTranslation: (
    showId: number,
    seasonNumber: number,
    episodeNumber: number,
    language: string,
    sync?: boolean
  ) => Observable<Translation | undefined>;

  constructor(private http: HttpClient, private configService: ConfigService) {
    const [showsTranslations$, syncShowTranslation, fetchShowTranslation] =
      syncObjectsTrakt<Translation>({
        http: this.http,
        url: '/shows/%/translations/%',
        localStorageKey: LocalStorage.SHOWS_TRANSLATIONS,
      });
    this.showsTranslations$ = showsTranslations$;
    this.syncShowTranslation = syncShowTranslation;
    this.fetchShowTranslation = fetchShowTranslation;

    const [showsEpisodesTranslations$, syncShowEpisodeTranslation, fetchShowEpisodeTranslation] =
      syncObjectsTrakt<Translation>({
        http: this.http,
        url: '/shows/%/seasons/%/episodes/%/translations/%',
        localStorageKey: LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
        idFormatter: episodeId as (...args: unknown[]) => string,
      });
    this.showsEpisodesTranslations$ = showsEpisodesTranslations$;
    this.syncShowEpisodeTranslation = syncShowEpisodeTranslation;
    this.fetchShowEpisodeTranslation = fetchShowEpisodeTranslation;

    this.configService.config$.subscribe((config) => {
      if (
        config.language === 'en-US' &&
        this.showsTranslations$.value &&
        Object.keys(this.showsTranslations$.value).length > 0
      ) {
        this.showsTranslations$.next({});
        localStorage.removeItem(LocalStorage.SHOWS_TRANSLATIONS);
      }

      if (
        config.language === 'en-US' &&
        this.showsEpisodesTranslations$.value &&
        Object.keys(this.showsEpisodesTranslations$.value).length > 0
      ) {
        localStorage.removeItem(LocalStorage.SHOWS_EPISODES_TRANSLATIONS);
        this.showsEpisodesTranslations$.next({});
      }
    });
  }

  getShowTranslation$(
    showId?: number | string,
    sync?: boolean,
    fetch?: boolean
  ): Observable<Translation | undefined> {
    if (!showId) throw Error('Show id is empty');

    return this.showsTranslations$.pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[showId];
        if (fetch && !showTranslation) {
          const language = this.configService.config$.value.language.substring(0, 2);
          return this.fetchShowTranslation(showId, language, sync);
        }
        return of(showTranslation);
      })
    );
  }

  getEpisodeTranslation$(
    ids?: Ids,
    seasonNumber?: number,
    episodeNumber?: number,
    sync?: boolean,
    fetch?: boolean
  ): Observable<Translation | undefined> {
    if (!ids || seasonNumber === undefined || !episodeNumber) throw Error('Argument is empty');

    return this.showsEpisodesTranslations$.pipe(
      switchMap((showsEpisodesTranslations) => {
        const episodeTranslation =
          showsEpisodesTranslations[episodeId(ids.trakt, seasonNumber, episodeNumber)];
        if (fetch && !episodeTranslation) {
          const language = this.configService.config$.value.language.substring(0, 2);
          return this.fetchShowEpisodeTranslation(
            ids.trakt,
            seasonNumber,
            episodeNumber,
            language,
            sync
          );
        }
        return of(episodeTranslation);
      })
    );
  }
}
