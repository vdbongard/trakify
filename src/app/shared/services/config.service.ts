import { Injectable, effect, inject } from '@angular/core';
import { SyncDataService } from '@services/sync-data.service';
import type { Config } from '@type/Config';
import type { LanguageShort } from '@type/Config';
import { LocalStorage, Theme } from '@type/Enum';
import { defaultConfig } from '../default-config';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  syncDataService = inject(SyncDataService);

  config = this.syncDataService.syncObjectWithDefault<Config>({
    localStorageKey: LocalStorage.CONFIG,
    default: defaultConfig(),
  });

  constructor() {
    effect(() => {
      if (this.config.s().theme === Theme.SYSTEM) {
        this.setSystemTheme();
      }
    });
  }

  setTheme(theme: Theme): void {
    this.config.s().theme = theme;

    if (theme !== Theme.SYSTEM) {
      this.changeTheme(theme);
    }
  }

  private setSystemTheme(): void {
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? this.changeTheme(Theme.DARK)
      : this.changeTheme(Theme.LIGHT);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      event.matches ? this.changeTheme(Theme.DARK) : this.changeTheme(Theme.LIGHT);
    });
  }

  private changeTheme(theme: Theme): void {
    document.documentElement.classList.remove(Theme.LIGHT);
    document.documentElement.classList.remove(Theme.DARK);

    document.documentElement.classList.add(theme);
  }

  setLanguage(language: LanguageShort): void {
    this.config.s().language = language;
    this.config.sync();
  }
}
