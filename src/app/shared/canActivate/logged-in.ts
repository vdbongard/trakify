import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import * as Paths from '@shared/paths';

@Injectable()
export class LoggedIn implements CanActivate {
  constructor(private oauthService: OAuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    if (this.oauthService.hasValidAccessToken()) return true;
    await this.router.navigateByUrl(Paths.login({}));
    return false;
  }
}
