import { AuthConfig } from 'angular-oauth2-oidc';
import { Config } from './config';

export const authCodeFlowConfig: AuthConfig = {
  loginUrl: 'https://api.trakt.tv/oauth/authorize',
  tokenEndpoint: 'https://api.trakt.tv/oauth/token',
  redirectUri: window.location.origin + '/redirect',
  clientId: Config.traktClientId,
  responseType: 'code',
  scope: '',
  oidc: false,
  showDebugInformation: true,
};
