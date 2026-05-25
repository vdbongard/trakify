import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { SyncDataService } from '@services/sync-data.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { Theme } from '@type/Enum';
import type { Config } from '@type/Config';
import { LanguageShort } from '@type/Config';

describe('ConfigService', () => {
  let service: ConfigService;
  let mockConfig: WritableSignal<Config>;

  beforeEach(() => {
    const defaultConfig: Config = {
      theme: Theme.SYSTEM,
      language: LanguageShort.EN_US,
    } as Config;

    mockConfig = signal({ ...defaultConfig }) as WritableSignal<Config>;

    const mockSyncDataService = {
      syncObjectWithDefault: vi.fn().mockReturnValue({
        s: mockConfig,
        sync: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SyncDataService, useValue: mockSyncDataService },
      ],
    });

    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update theme', () => {
    const addSpy = vi.spyOn(document.documentElement.classList, 'add');
    const removeSpy = vi.spyOn(document.documentElement.classList, 'remove');

    service.setTheme(Theme.DARK);

    expect(service.config.s().theme).toBe(Theme.DARK);
    expect(addSpy).toHaveBeenCalledWith(Theme.DARK);
    expect(removeSpy).toHaveBeenCalledWith(Theme.LIGHT);
    expect(removeSpy).toHaveBeenCalledWith(Theme.DARK);
  });

  it('should update language', () => {
    const syncSpy = vi.spyOn(service.config, 'sync');

    service.setLanguage(LanguageShort.DE_DE);

    expect(service.config.s().language).toBe(LanguageShort.DE_DE);
    expect(syncSpy).toHaveBeenCalled();
  });
});
