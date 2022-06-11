import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Config } from '../../types/interfaces/Config';
import { getLocalStorage, setLocalStorage } from '../helper/local-storage';
import { LocalStorage } from '../../types/enum';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config = new BehaviorSubject<Config>(this.getLocalConfig() || this.getDefaultConfig());

  constructor() {
    this.syncConfig();
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
          name: 'No new episodes',
          value: false,
        },
        {
          name: 'Completed',
          value: false,
        },
        {
          name: 'Hidden',
          value: false,
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
    };
  }

  syncConfig(): void {
    const config = this.config.value;
    this.setLocalConfig(config);
  }
}
