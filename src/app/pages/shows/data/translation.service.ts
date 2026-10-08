import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@services/config.service';
import { toEpisodeId } from '@helper/toShowId';
import { LocalStorage } from '@type/Enum';
import type { Show, Translation } from '@type/Trakt';
import { translationSchema } from '@type/Trakt';
import { API } from '@shared/api';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  configService = inject(ConfigService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);

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

  getShowTranslation(show?: Show): Translation | undefined {
    if (!show) throw Error('Show is empty (getShowTranslation)');
    return this.showsTranslations.s()[show.ids.trakt];
  }

  getEpisodeTranslation(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
  ): Translation | undefined {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (getEpisodeTranslation)');
    // Preserved contract: episode translations never apply to en-US, even when the store
    // still holds a value from a previous language (the Sync module clears it on next sync).
    if (this.configService.config.s().language === 'en-US') return undefined;
    return this.showsEpisodesTranslations.s()[
      toEpisodeId(show.ids.trakt, seasonNumber, episodeNumber)
    ];
  }

  ensureShowTranslation(
    show?: Show,
    options?: { language?: string; persist?: boolean; force?: boolean },
  ): Promise<Translation | undefined> {
    if (!show) throw Error('Show is empty (ensureShowTranslation)');
    const language = options?.language ?? this.configService.config.s().language;
    const cached = this.getShowTranslation(show);
    if (language === 'en-US') return Promise.resolve(cached);
    if (!options?.force && cached) return Promise.resolve(cached);
    return lastValueFrom(
      this.showsTranslations.fetchIds([show.ids.trakt, language.substring(0, 2)], {
        persist: options?.persist || !!cached,
      }),
    );
  }

  ensureEpisodeTranslation(
    show?: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    options?: { language?: string; persist?: boolean; force?: boolean },
  ): Promise<Translation | undefined> {
    if (!show || seasonNumber === undefined || !episodeNumber)
      throw Error('Argument is empty (ensureEpisodeTranslation)');
    const language = options?.language ?? this.configService.config.s().language;
    if (language === 'en-US') return Promise.resolve(undefined);
    const cached = this.getEpisodeTranslation(show, seasonNumber, episodeNumber);
    if (!options?.force && cached) return Promise.resolve(cached);
    return lastValueFrom(
      this.showsEpisodesTranslations.fetchIds(
        [show.ids.trakt, seasonNumber, episodeNumber, language.substring(0, 2)],
        { persist: options?.persist || !!cached },
      ),
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
