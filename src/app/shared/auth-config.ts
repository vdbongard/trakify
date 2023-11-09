import { AuthConfig } from 'angular-oauth2-oidc';
import { traktClientId } from './config';

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
