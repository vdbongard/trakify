import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { concat, Observable, of, switchMap } from 'rxjs';

import { ConfigService } from '../config.service';
import { syncObjects } from '@helper/sync';
import { episodeId } from '@helper/episodeId';
import { setLocalStorage } from '@helper/localStorage';

import { LocalStorage } from '@type/enum';

import type { Show, Translation } from '@type/interfaces/Trakt';
import { translationSchema } from '@type/interfaces/Trakt';
import type { FetchOptions } from '@type/interfaces/Sync';
import { api } from '../../api';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  showsTranslations = syncObjects<Translation>({
    http: this.http,
    url: api.translationShow,
    localStorageKey: LocalStorage.SHOWS_TRANSLATIONS,
    schema: translationSchema,
  });
  showsEpisodesTranslations = syncObjects<Translation>({
    http: this.http,
    url: api.translationEpisode,
    localStorageKey: LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
    schema: translationSchema,
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

  getShowTranslation$(show?: Show, options?: FetchOptions): Observable<Translation | undefined> {
    if (!show) throw Error('Show is empty (getShowTranslation$)');

    const language = this.configService.config.$.value.language;

    return this.showsTranslations.$.pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[show.ids.trakt];

        if (options?.fetchAlways || (options?.fetch && !showTranslation && language !== 'en-US')) {
          let showTranslation$ = this.showsTranslations.fetch(
            show.ids.trakt,
            language.substring(0, 2),
            !!showTranslation || options.sync
          );

          if (showTranslation)
            showTranslation$ = concat(of(showTranslation), showTranslation$).pipe(
              distinctUntilChangedDeep()
            );

          return showTranslation$;
        }

        return of(showTranslation);
      })
    );
  }

  getShowTranslationBySlug$(
    slug?: string,
    options?: FetchOptions
  ): Observable<Translation | undefined> {
    if (!slug) throw Error('Slug is empty (getShowTranslationBySlug$)');
    const language = this.configService.config.$.value.language;
    return this.showsTranslations.fetch(slug, language.substring(0, 2), options?.sync);
  }

  getEpisodeTranslation$(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: FetchOptions
  ): Observable<Translation | undefined> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisodeTranslation$)');

    const language = this.configService.config.$.value.language;

    return this.showsEpisodesTranslations.$.pipe(
      switchMap((showsEpisodesTranslations) => {
        const episodeTranslation =
          showsEpisodesTranslations[episodeId(show.ids.trakt, seasonNumber, episodeNumber)];

        if (
          options?.fetchAlways ||
          (options?.fetch && !episodeTranslation && language !== 'en-US')
        ) {
          let showsEpisodesTranslations$ = this.showsEpisodesTranslations.fetch(
            show.ids.trakt,
            seasonNumber,
            episodeNumber,
            language.substring(0, 2),
            options.sync || !!episodeTranslation
          );

          if (episodeTranslation)
            showsEpisodesTranslations$ = concat(
              of(episodeTranslation),
              showsEpisodesTranslations$
            ).pipe(distinctUntilChangedDeep());

          return showsEpisodesTranslations$;
        }

        return of(episodeTranslation);
      })
    );
  }

  removeShowTranslation(showIdTrakt: number): void {
    const showsTranslations = this.showsTranslations.$.value;
    if (!showsTranslations[showIdTrakt]) return;

    console.debug('removing old show translation:', showIdTrakt, showsTranslations[showIdTrakt]);
    delete showsTranslations[showIdTrakt];
    this.showsTranslations.$.next(showsTranslations);
    setLocalStorage(LocalStorage.SHOWS_TRANSLATIONS, showsTranslations);
  }

  removeShowsEpisodesTranslation(show: Show): void {
    let isChanged = false;
    const showsEpisodesTranslations = Object.fromEntries(
      Object.entries(this.showsEpisodesTranslations.$.value).filter(([episodeId]) => {
        const filter = !episodeId.startsWith(`${show.ids.trakt}-`);
        if (!filter) isChanged = true;
        return filter;
      })
    );
    if (!isChanged) return;

    this.showsEpisodesTranslations.$.next(showsEpisodesTranslations);
    setLocalStorage(LocalStorage.SHOWS_EPISODES_TRANSLATIONS, showsEpisodesTranslations);
  }
}
