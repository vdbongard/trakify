import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Config } from '../../types/interfaces/Config';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { Filter, LocalStorage, Sort, SortOptions, Theme } from '../../types/enum';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config = new BehaviorSubject<Config>(this.getLocalConfig() || this.getDefaultConfig());
  isLoggedIn = new BehaviorSubject<boolean>(this.oauthService.hasValidAccessToken());

  constructor(private oauthService: OAuthService) {
    this.syncConfig();

    this.config.subscribe((config) => {
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

  syncConfig(withPublish = true): void {
    const config = this.config.value;
    this.setLocalConfig(config);
    if (withPublish) {
      this.config.next(config);
    }
  }

  setTheme(theme: Theme, withPublish = true): void {
    this.config.value.theme = theme;
    this.syncConfig(withPublish);

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
