import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { signal } from '@angular/core';
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
    fetchShowTranslationMock = vi.fn(() => Promise.resolve({ title: 'Fetched show title' }));
    fetchEpisodeTranslationMock = vi.fn(() => Promise.resolve({ title: 'Fetched episode title' }));

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
                fetchIds: fetchShowTranslationMock,
                syncIds: vi.fn(() => Promise.resolve()),
                evictWhere: vi.fn(() => undefined),
                flush: vi.fn(() => undefined),
              })
              .mockReturnValueOnce({
                s: showsEpisodesTranslationsSignal,
                fetchIds: fetchEpisodeTranslationMock,
                syncIds: vi.fn(() => Promise.resolve()),
                evictWhere: vi.fn(() => undefined),
                flush: vi.fn(() => undefined),
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

  describe('getShowTranslation', () => {
    it('should throw when show is missing', () => {
      expect(() => service.getShowTranslation()).toThrow('Show is empty (getShowTranslation)');
    });

    it('should return the stored translation without fetching', () => {
      showsTranslationsSignal.set({ [mockShow.ids.trakt]: { title: 'Stored title' } });

      const translation = service.getShowTranslation(mockShow);

      expect(translation).toEqual({ title: 'Stored title' });
      expect(fetchShowTranslationMock).not.toHaveBeenCalled();
    });

    it('should return undefined when missing without fetching', () => {
      configSignal.set({ language: 'de-DE' });

      const translation = service.getShowTranslation(mockShow);

      expect(translation).toBeUndefined();
      expect(fetchShowTranslationMock).not.toHaveBeenCalled();
    });
  });

  describe('getEpisodeTranslation', () => {
    it('should throw when arguments are missing', () => {
      expect(() => service.getEpisodeTranslation(mockShow, undefined, 1)).toThrow(
        'Argument is empty (getEpisodeTranslation)',
      );
    });

    it('should return undefined for en-US even when a translation is stored', () => {
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-3`]: { title: 'Stored episode' },
      });

      const translation = service.getEpisodeTranslation(mockShow, 1, 3);

      expect(translation).toBeUndefined();
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });

    it('should return the stored translation without fetching', () => {
      configSignal.set({ language: 'de-DE' });
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-3`]: { title: 'Stored episode' },
      });

      const translation = service.getEpisodeTranslation(mockShow, 1, 3);

      expect(translation).toEqual({ title: 'Stored episode' });
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });

    it('should return undefined when missing without fetching', () => {
      configSignal.set({ language: 'de-DE' });

      const translation = service.getEpisodeTranslation(mockShow, 1, 3);

      expect(translation).toBeUndefined();
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });
  });

  describe('ensureShowTranslation', () => {
    it('should throw when show is missing', () => {
      expect(() => service.ensureShowTranslation()).toThrow(
        'Show is empty (ensureShowTranslation)',
      );
    });

    it('should return the stored translation for en-US without fetching', async () => {
      showsTranslationsSignal.set({ [mockShow.ids.trakt]: { title: 'Stored title' } });

      const translation = await service.ensureShowTranslation(mockShow, { force: true });

      expect(translation).toEqual({ title: 'Stored title' });
      expect(fetchShowTranslationMock).not.toHaveBeenCalled();
    });

    it('should return the stored translation without fetching when not forced', async () => {
      configSignal.set({ language: 'de-DE' });
      showsTranslationsSignal.set({ [mockShow.ids.trakt]: { title: 'Stored title' } });

      const translation = await service.ensureShowTranslation(mockShow);

      expect(translation).toEqual({ title: 'Stored title' });
      expect(fetchShowTranslationMock).not.toHaveBeenCalled();
    });

    it('should fetch the show translation when missing', async () => {
      configSignal.set({ language: 'de-DE' });

      const translation = await service.ensureShowTranslation(mockShow);

      expect(fetchShowTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 'de'], {
        persist: false,
      });
      expect(translation).toEqual({ title: 'Fetched show title' });
    });

    it('should persist the fetched show translation when requested', async () => {
      configSignal.set({ language: 'de-DE' });

      await service.ensureShowTranslation(mockShow, { persist: true });

      expect(fetchShowTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 'de'], {
        persist: true,
      });
    });

    it('should refetch the show translation when forced', async () => {
      configSignal.set({ language: 'de-DE' });
      showsTranslationsSignal.set({ [mockShow.ids.trakt]: { title: 'Stored title' } });

      const translation = await service.ensureShowTranslation(mockShow, { force: true });

      expect(fetchShowTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 'de'], {
        persist: true,
      });
      expect(translation).toEqual({ title: 'Fetched show title' });
    });

    it('should use the requested language', async () => {
      await service.ensureShowTranslation(mockShow, { language: 'fr-FR' });

      expect(fetchShowTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 'fr'], {
        persist: false,
      });
    });
  });

  describe('ensureEpisodeTranslation', () => {
    it('should throw when arguments are missing', () => {
      expect(() => service.ensureEpisodeTranslation(mockShow, undefined, 1)).toThrow(
        'Argument is empty (ensureEpisodeTranslation)',
      );
    });

    it('should return undefined for en-US without fetching', async () => {
      const translation = await service.ensureEpisodeTranslation(mockShow, 1, 1, { force: true });

      expect(translation).toBeUndefined();
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });

    it('should return the stored translation without fetching when not forced', async () => {
      configSignal.set({ language: 'de-DE' });
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-3`]: { title: 'Stored episode' },
      });

      const translation = await service.ensureEpisodeTranslation(mockShow, 1, 3);

      expect(translation).toEqual({ title: 'Stored episode' });
      expect(fetchEpisodeTranslationMock).not.toHaveBeenCalled();
    });

    it('should fetch the episode translation when missing', async () => {
      configSignal.set({ language: 'de-DE' });

      const translation = await service.ensureEpisodeTranslation(mockShow, 1, 2);

      expect(fetchEpisodeTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 1, 2, 'de'], {
        persist: false,
      });
      expect(translation).toEqual({ title: 'Fetched episode title' });
    });

    it('should persist the fetched episode translation when requested', async () => {
      configSignal.set({ language: 'de-DE' });

      await service.ensureEpisodeTranslation(mockShow, 1, 2, { persist: true });

      expect(fetchEpisodeTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 1, 2, 'de'], {
        persist: true,
      });
    });

    it('should refetch the episode translation when forced', async () => {
      configSignal.set({ language: 'de-DE' });
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-3`]: { title: 'Stored episode' },
      });

      const translation = await service.ensureEpisodeTranslation(mockShow, 1, 3, { force: true });

      expect(fetchEpisodeTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 1, 3, 'de'], {
        persist: true,
      });
      expect(translation).toEqual({ title: 'Fetched episode title' });
    });

    it('should persist the refetch when cached even if persist is false', async () => {
      configSignal.set({ language: 'de-DE' });
      showsEpisodesTranslationsSignal.set({
        [`${mockShow.ids.trakt}-1-3`]: { title: 'Stored episode' },
      });

      await service.ensureEpisodeTranslation(mockShow, 1, 3, { force: true, persist: false });

      expect(fetchEpisodeTranslationMock).toHaveBeenCalledWith([mockShow.ids.trakt, 1, 3, 'de'], {
        persist: true,
      });
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
