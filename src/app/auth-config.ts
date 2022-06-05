import { AuthConfig } from 'angular-oauth2-oidc';

export const authCodeFlowConfig: AuthConfig = {
  // Url of the Identity Provider
  issuer: 'https://api.trakt.tv',

  loginUrl: 'https://api.trakt.tv/oauth/authorize',

  tokenEndpoint: 'https://api.trakt.tv/oauth/token',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/redirect',

  // The SPA's id. The SPA is registered with this id at the auth-server
  // clientId: 'server.code',
  clientId: '85ac87a505a1a8f62d1e4284ea630f0632459afcd0a9e5c9244ad4674e90140e',

  responseType: 'code',

  scope: '',
  oidc: false,

  showDebugInformation: true,
};
