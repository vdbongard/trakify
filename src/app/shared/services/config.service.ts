import { Injectable } from '@angular/core';

import { defaultConfig } from '../default-config';

import { LocalStorage, Theme } from '@type/enum';

import type { Config } from '@type/interfaces/Config';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SyncDataService } from '@services/sync-data.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config = this.syncDataService.syncObjectWithDefault<Config>({
    localStorageKey: LocalStorage.CONFIG,
    default: defaultConfig(),
  });

  constructor(private snackBar: MatSnackBar, private syncDataService: SyncDataService) {
    this.config.$.subscribe((config) => {
      if (config.theme === Theme.SYSTEM) this.setSystemTheme();
    });
  }

  setTheme(theme: Theme): void {
    this.config.$.value.theme = theme;

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
    document.body.classList.remove(Theme.LIGHT);
    document.body.classList.remove(Theme.DARK);

    document.body.classList.add(theme);
  }

  async setLanguage(language: string): Promise<void> {
    this.config.$.value.language = language;
    await this.config.sync();
  }
}
