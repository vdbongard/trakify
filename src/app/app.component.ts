import { Component } from '@angular/core';
import { authCodeFlowConfig } from './auth-config';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'series-tracker';

  constructor(private oauthService: OAuthService) {
    this.oauthService.configure(authCodeFlowConfig);
  }
}
