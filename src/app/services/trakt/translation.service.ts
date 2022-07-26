import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { Translation } from '../../../types/interfaces/Trakt';
import { syncObjectsTrakt } from '../../helper/sync';
import { LocalStorage } from '../../../types/enum';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config.service';

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

    this.configService.config$.subscribe((config) => {
      if (
        config.language === 'en-US' &&
        this.showsTranslations$.value &&
        Object.keys(this.showsTranslations$.value).length > 0
      ) {
        this.showsTranslations$.next({});
        localStorage.removeItem(LocalStorage.SHOWS_TRANSLATIONS);
      }
    });
  }

  getShowTranslation$(
    showId?: number | string,
    sync?: boolean
  ): Observable<Translation | undefined> {
    if (!showId) return of(undefined);

    return this.showsTranslations$.pipe(
      switchMap((showsTranslations) => {
        const showTranslation = showsTranslations[showId];
        if (!showTranslation) {
          const language = this.configService.config$.value.language.substring(0, 2);
          return this.fetchShowTranslation(showId, language, sync);
        }
        return of(showTranslation);
      })
    );
  }
}
