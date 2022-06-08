import { AuthConfig } from 'angular-oauth2-oidc';
import { Config } from './config';

export const authCodeFlowConfig: AuthConfig = {
  // Url of the Identity Provider
  issuer: 'https://api.trakt.tv',

  loginUrl: 'https://api.trakt.tv/oauth/authorize',

  tokenEndpoint: 'https://api.trakt.tv/oauth/token',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/redirect',

  // The SPA's id. The SPA is registered with this id at the auth-server
  // clientId: 'server.code',
  clientId: Config.traktClientId,

  responseType: 'code',

  scope: '',
  oidc: false,

  showDebugInformation: true,
};
