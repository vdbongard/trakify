import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Config } from '../../../types/interfaces/Config';
import { LocalStorage, Theme } from '../../../types/enum';
import { syncObjectWithDefault } from '../helper/sync';
import { SyncOptions } from '../../../types/interfaces/Sync';
import { defaultConfig } from '../../default-config';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config$: BehaviorSubject<Config>;
  syncConfig: (options?: SyncOptions) => Observable<void>;

  constructor() {
    const [config$, syncConfig] = syncObjectWithDefault<Config>({
      localStorageKey: LocalStorage.CONFIG,
      default: defaultConfig(),
    });
    this.config$ = config$;
    this.syncConfig = syncConfig;

    this.config$.subscribe((config) => {
      if (config.theme === Theme.SYSTEM) this.setSystemTheme();
    });
  }

  setTheme(theme: Theme): void {
    this.config$.value.theme = theme;

    if (theme !== Theme.SYSTEM) {
      this.changeTheme(theme);
    }
  }

  setSystemTheme(): void {
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? this.changeTheme(Theme.DARK)
      : this.changeTheme(Theme.LIGHT);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      event.matches ? this.changeTheme(Theme.DARK) : this.changeTheme(Theme.LIGHT);
    });
  }

  changeTheme(theme: Theme): void {
    document.body.classList.remove(Theme.LIGHT);
    document.body.classList.remove(Theme.DARK);

    document.body.classList.add(theme);
  }

  async setLanguage(language: string): Promise<void> {
    this.config$.value.language = language;
    await this.syncConfig();
  }
}
