import { AuthConfig, OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { traktClientId } from './config';
import { EnvironmentProviders, inject, PLATFORM_ID, Provider } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export function authCodeFlowConfig(options: { baseURI: string }): AuthConfig {
  return {
    loginUrl: 'https://api.trakt.tv/oauth/authorize',
    tokenEndpoint: 'https://api.trakt.tv/oauth/token',
    redirectUri: options.baseURI + 'redirect',
    clientId: traktClientId,
    responseType: 'code',
    scope: '',
    oidc: false,
  };
}

export function provideOAuth(): (Provider | EnvironmentProviders)[] {
  return [
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['https://api.trakt.tv'],
        sendAccessToken: true,
      },
    }),
    {
      provide: OAuthStorage,
      useFactory: (): OAuthStorage => {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) {
          return {
            getItem: () => null,
            removeItem: () => {},
            setItem: () => {},
          } as OAuthStorage;
        }
        return localStorage;
      },
    },
  ];
}
