import { inject, Injectable, Injector } from '@angular/core';
import { concat, Observable, of, switchMap } from 'rxjs';
import { ConfigService } from '@services/config.service';
import { toEpisodeId } from '@helper/toShowId';
import { LocalStorage } from '@type/Enum';
import type { Show, Translation } from '@type/Trakt';
import { translationSchema } from '@type/Trakt';
import type { FetchOptions } from '@type/Sync';
import { API } from '@shared/api';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  configService = inject(ConfigService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);
  injector = inject(Injector);

  showsTranslations = this.syncDataService.syncObjects<Translation>({
    url: API.translationShow,
    localStorageKey: LocalStorage.SHOWS_TRANSLATIONS,
    schema: translationSchema,
  });
  showsEpisodesTranslations = this.syncDataService.syncObjects<Translation>({
    url: API.translationEpisode,
    localStorageKey: LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
    schema: translationSchema,
    idFormatter: toEpisodeId as (...args: unknown[]) => string,
  });

  getShowTranslation$(show?: Show, options?: FetchOptions): Observable<Translation | undefined> {
    if (!show) throw Error('Show is empty (getShowTranslation$)');

    const language = this.configService.config.s().language;

    return toObservable(this.showsTranslations.s, { injector: this.injector }).pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[show.ids.trakt];

        if (options?.fetchAlways || (options?.fetch && !showTranslation && language !== 'en-US')) {
          let showTranslation$ = this.showsTranslations.fetch(
            show.ids.trakt,
            language.substring(0, 2),
            !!showTranslation || options.sync,
          );

          if (showTranslation)
            showTranslation$ = concat(of(showTranslation), showTranslation$).pipe(
              distinctUntilChangedDeep(),
            );

          return showTranslation$;
        }

        return of(showTranslation);
      }),
    );
  }

  getEpisodeTranslation$(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: FetchOptions,
  ): Observable<Translation | undefined> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisodeTranslation$)');

    const language = this.configService.config.s().language;

    if (language === 'en-US') return of(undefined);

    return toObservable(this.showsEpisodesTranslations.s, { injector: this.injector }).pipe(
      switchMap((showsEpisodesTranslations) => {
        const episodeTranslation =
          showsEpisodesTranslations[toEpisodeId(show.ids.trakt, seasonNumber, episodeNumber)];

        if (options?.fetchAlways || (options?.fetch && !episodeTranslation)) {
          let showsEpisodesTranslations$ = this.showsEpisodesTranslations.fetch(
            show.ids.trakt,
            seasonNumber,
            episodeNumber,
            language.substring(0, 2),
            options.sync || !!episodeTranslation,
          );

          if (episodeTranslation)
            showsEpisodesTranslations$ = concat(
              of(episodeTranslation),
              showsEpisodesTranslations$,
            ).pipe(distinctUntilChangedDeep());

          return showsEpisodesTranslations$;
        }

        return of(episodeTranslation);
      }),
    );
  }

  removeShowTranslation(showIdTrakt: number): void {
    const showsTranslations = this.showsTranslations.s();
    if (!showsTranslations[showIdTrakt]) return;

    console.debug('removing show translation:', showIdTrakt, showsTranslations[showIdTrakt]);
    delete showsTranslations[showIdTrakt];
    this.showsTranslations.s.set({ ...showsTranslations });
    this.localStorageService.setObject(LocalStorage.SHOWS_TRANSLATIONS, showsTranslations);
  }

  removeShowsEpisodesTranslation(show: Show): void {
    let isChanged = false;
    const showsEpisodesTranslations = Object.fromEntries(
      Object.entries(this.showsEpisodesTranslations.s()).filter(([episodeId]) => {
        const filter = !episodeId.startsWith(`${show.ids.trakt}-`);
        if (!filter) isChanged = true;
        return filter;
      }),
    );
    if (!isChanged) return;

    this.showsEpisodesTranslations.s.set({ ...showsEpisodesTranslations });
    this.localStorageService.setObject(
      LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
      showsEpisodesTranslations,
    );
  }
}
