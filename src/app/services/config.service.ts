import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Configuration } from '../../types/interfaces/Configuration';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage, Theme } from '../../types/enum';
import { OAuthService } from 'angular-oauth2-oidc';
import { HttpGetOptions } from '../../types/interfaces/Http';
import { Config } from '../config';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config = new BehaviorSubject<Configuration>(this.getLocalConfig() || this.getDefaultConfig());
  isLoggedIn = new BehaviorSubject<boolean>(this.oauthService.hasValidAccessToken());
  traktBaseUrl = 'https://api.trakt.tv';
  traktOptions: HttpGetOptions = {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-version': '2',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-key': Config.traktClientId,
    },
  };
  tmdbBaseUrl = 'https://api.themoviedb.org/3';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tmdbOptions = { headers: { Authorization: `Bearer ${Config.tmdbToken}` } };

  constructor(private oauthService: OAuthService) {
    this.syncConfig();

    this.config.subscribe((config) => {
      if (config.theme === Theme.SYSTEM) this.setSystemTheme();
    });
  }

  getLocalConfig(): Configuration | undefined {
    return getLocalStorage(LocalStorage.CONFIG) as Configuration | undefined;
  }

  setLocalConfig(config: Configuration): void {
    setLocalStorage(LocalStorage.CONFIG, config);
  }

  getDefaultConfig(): Configuration {
    return {
      filters: [
        {
          name: 'No new episodes',
          value: false,
        },
        {
          name: 'Completed',
          value: false,
        },
        {
          name: 'Hidden',
          value: true,
        },
      ],
      sort: {
        values: ['Newest episode', 'Last watched'],
        by: 'Newest episode',
      },
      sortOptions: [
        {
          name: 'Favorites first',
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
