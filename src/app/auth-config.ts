import { AuthConfig } from 'angular-oauth2-oidc';

import { traktClientId } from './config';

export const authCodeFlowConfig: AuthConfig = {
  loginUrl: 'https://api.trakt.tv/oauth/authorize',
  tokenEndpoint: 'https://api.trakt.tv/oauth/token',
  redirectUri: document.baseURI + 'redirect',
  clientId: traktClientId,
  responseType: 'code',
  scope: '',
  oidc: false,
  showDebugInformation: true,
};
