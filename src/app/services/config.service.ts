import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Config } from '../../types/interfaces/Config';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { Filter, LocalStorage, Sort, SortOptions, Theme } from '../../types/enum';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config$ = new BehaviorSubject<Config>(this.getLocalConfig() || this.getDefaultConfig());

  constructor() {
    this.config$.subscribe((config) => {
      if (config.theme === Theme.SYSTEM) this.setSystemTheme();
    });
  }

  getLocalConfig(): Config | undefined {
    return getLocalStorage(LocalStorage.CONFIG) as Config | undefined;
  }

  setLocalConfig(config: Config): void {
    setLocalStorage(LocalStorage.CONFIG, config);
  }

  getDefaultConfig(): Config {
    return {
      filters: [
        {
          name: Filter.NO_NEW_EPISODES,
          value: false,
        },
        {
          name: Filter.COMPLETED,
          value: false,
        },
        {
          name: Filter.HIDDEN,
          value: true,
        },
      ],
      sort: {
        values: [Sort.NEWEST_EPISODE, Sort.LAST_WATCHED],
        by: Sort.NEWEST_EPISODE,
      },
      sortOptions: [
        {
          name: SortOptions.FAVORITES_FIRST,
          value: false,
        },
      ],
      theme: Theme.DARK,
    };
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
}
