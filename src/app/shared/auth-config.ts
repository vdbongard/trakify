import { AuthConfig } from 'angular-oauth2-oidc';
import { traktClientId } from './config';

export function authCodeFlowConfigFactory(baseURI: string): AuthConfig {
  return {
    loginUrl: 'https://api.trakt.tv/oauth/authorize',
    tokenEndpoint: 'https://api.trakt.tv/oauth/token',
    redirectUri: baseURI + 'redirect',
    clientId: traktClientId,
    responseType: 'code',
    scope: '',
    oidc: false,
  };
}
