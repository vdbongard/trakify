import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { ConfigService } from '@services/config.service';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { LocalStorage } from '@type/Enum';
import type { Show, Translation } from '@type/Trakt';
import { mockShow } from '@shared/mocks/mockShow';

describe('TranslationService', () => {
  let service: TranslationService;
  let configSignal: ReturnType<typeof signal<{ language: string }>>;
  let showsTranslationsSignal: ReturnType<typeof signal<Record<number, Translation | undefined>>>;
  let showsEpisodesTranslationsSignal: ReturnType<
    typeof signal<Record<string, Translation | undefined>>
  >;
  let fetchShowTranslationMock: ReturnType<typeof vi.fn>;
  let fetchEpisodeTranslationMock: ReturnType<typeof vi.fn>;
  let localStorageServiceMock: {
    setObject: ReturnType<typeof vi.fn>;
  };
  const otherShowId = 999;
  const otherEpisodeId = '999-1-1';

  beforeEach(() => {
    configSignal = signal({ language: 'en-US' });
    showsTranslationsSignal = signal<Record<number, Translation | undefined>>({});
    showsEpisodesTranslationsSignal = signal<Record<string, Translation | undefined>>({});
    fetchShowTranslationMock = vi.fn(() => of({ title: 'Fetched show title' }));
    fetchEpisodeTranslationMock = vi.fn(() => of({ title: 'Fetched episode title' }));

    localStorageServiceMock = {
      setObject: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            config: {
              s: configSignal,
            },
          },
        },
        {
          provide: LocalStorageService,
          useValue: localStorageServiceMock,
        },
        {
          provide: SyncDataService,
          useValue: {
            syncObjects: vi
              .fn()
              .mockReturnValueOnce({
                s: showsTranslationsSignal,
                fetch: fetchShowTranslationMock,
              })
              .mockReturnValueOnce({
                s: showsEpisodesTranslationsSignal,
                fetch: fetchEpisodeTranslationMock,
              }),
          },
        },
      ],
    });
    service = TestBed.inject(TranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getShowTranslation$', () => {
    it('should throw when show is missing', () => {
      expect(() => service.getShowTranslation$()).toThrow('Show is empty (getShowTranslation$)');
    });

    it('should return existing translation without fetching', async () => {
      showsTranslationsSignal.set({ [mockShow.ids.trakt]: { title: 'Stored title' } });

      const translation = await firstValueFrom(service.getShowTranslation$(mockShow));

      expect(translation).toEqual({ title: 'Stored title' });
      expect(fetchShowTranslationMock).not.toHaveBeenCalled();
    });

    it('should fetch show translation when missing and fetch is true', async () => {
      configSignal.set({ language: 'de-DE' });

      const translation = await firstValueFrom(
        service.getShowTranslation$(mockShow, { fetch: true, sync: true }),
      );

      expect(fetchShowTranslationMock).toHaveBeenCalledWith(mockShow.ids.trakt, 'de', true);
      expect(translation).toEqual({ title: 'Fetched show title' });
    });

    it('should return stored value first when fetching with existing translation', async () => {
      configSignal.set({ language: 'de-DE' });
      showsTranslationsSignal.set({ [mockShow.ids.trakt]: { title: 'Stored title' } });

      const translation = await firstValueFrom(
        service.getShowTranslation$(mockShow, { fetch: true }),
      );

      expect(translation).toEqual({ title: 'Stored title' });
    });
  });

  describe('getEpisodeTranslation$', () => {
    it('should throw when arguments are missing', () => {
      expect(() => service.getEpisodeTranslation$(mockShow, undefined, 1)).toThrow(
        'Argument is empty (getEpisodeTranslation$)',
      );
    });

    it('should return undefined for en-US language', async () => {
      const translation = await firstValueFrom(service.getEpisodeTranslation$(mockShow, 1, 1));
      expect(translation).toBeUndefined();
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });

    it('should fetch episode translation when missing and fetch is true', async () => {
      configSignal.set({ language: 'de-DE' });

      const translation = await firstValueFrom(
        service.getEpisodeTranslation$(mockShow, 1, 2, { fetch: true, sync: true }),
      );

      expect(fetchEpisodeTranslationMock).toHaveBeenCalledWith(
        mockShow.ids.trakt,
        1,
        2,
        'de',
        true,
      );
      expect(translation).toEqual({ title: 'Fetched episode title' });
    });

    it('should return existing episode translation without fetching', async () => {
      configSignal.set({ language: 'de-DE' });
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-3`]: { title: 'Stored episode' },
      });

      const translation = await firstValueFrom(service.getEpisodeTranslation$(mockShow, 1, 3));

      expect(translation).toEqual({ title: 'Stored episode' });
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });
  });

  describe('remove methods', () => {
    it('should remove a stored show translation and persist', () => {
      showsTranslationsSignal.set({
        [mockShow.ids.trakt]: { title: 'Stored title' },
        [otherShowId]: { title: 'Other' },
      });

      service.removeShowTranslation(mockShow.ids.trakt);

      expect(service.showsTranslations.s()[mockShow.ids.trakt]).toBeUndefined();
      expect(service.showsTranslations.s()[otherShowId]).toEqual({ title: 'Other' });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_TRANSLATIONS,
        service.showsTranslations.s(),
      );
    });

    it('should remove matching episode translations by show id prefix', () => {
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-1`]: { title: 'Episode one' },
        [`${mockShow.ids.trakt}-1-2`]: { title: 'Episode two' },
        [otherEpisodeId]: { title: 'Other show' },
      });

      service.removeShowsEpisodesTranslation(mockShow as Show);

      expect(service.showsEpisodesTranslations.s()).toEqual({
        [otherEpisodeId]: { title: 'Other show' },
      });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_EPISODES_TRANSLATIONS,
        service.showsEpisodesTranslations.s(),
      );
    });
  });
});
