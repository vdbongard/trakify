import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { Ids, Translation } from '../../../../types/interfaces/Trakt';
import { syncObjectsTrakt } from '../../helper/sync';
import { LocalStorage } from '../../../../types/enum';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config.service';
import { episodeId } from '../../helper/episodeId';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  showsTranslations = syncObjectsTrakt<Translation>({
    http: this.http,
    url: '/shows/%/translations/%',
    localStorageKey: LocalStorage.SHOWS_TRANSLATIONS,
  });
  showsEpisodesTranslations = syncObjectsTrakt<Translation>({
    http: this.http,
    url: '/shows/%/seasons/%/episodes/%/translations/%',
    localStorageKey: LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
    idFormatter: episodeId as (...args: unknown[]) => string,
  });

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.configService.config.$.subscribe((config) => {
      if (
        config.language === 'en-US' &&
        this.showsTranslations.$.value &&
        Object.keys(this.showsTranslations.$.value).length > 0
      ) {
        localStorage.removeItem(LocalStorage.SHOWS_TRANSLATIONS);
        this.showsTranslations.$.next({});
      }

      if (
        config.language === 'en-US' &&
        this.showsEpisodesTranslations.$.value &&
        Object.keys(this.showsEpisodesTranslations.$.value).length > 0
      ) {
        localStorage.removeItem(LocalStorage.SHOWS_EPISODES_TRANSLATIONS);
        this.showsEpisodesTranslations.$.next({});
      }
    });
  }

  getShowTranslation$(
    showId?: number | string,
    sync?: boolean,
    fetch?: boolean
  ): Observable<Translation | undefined> {
    if (!showId) throw Error('Show id is empty');

    const language = this.configService.config.$.value.language;

    return this.showsTranslations.$.pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[showId];
        if (fetch && !showTranslation && language !== 'en-US') {
          return this.showsTranslations.fetch(showId, language.substring(0, 2), sync);
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

    const language = this.configService.config.$.value.language;

    return this.showsEpisodesTranslations.$.pipe(
      switchMap((showsEpisodesTranslations) => {
        const episodeTranslation =
          showsEpisodesTranslations[episodeId(ids.trakt, seasonNumber, episodeNumber)];
        if (fetch && !episodeTranslation && language !== 'en-US') {
          return this.showsEpisodesTranslations.fetch(
            ids.trakt,
            seasonNumber,
            episodeNumber,
            language.substring(0, 2),
            sync
          );
        }
        return of(episodeTranslation);
      })
    );
  }
}
