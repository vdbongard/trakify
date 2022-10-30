import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import * as Paths from 'src/app/paths';

@Injectable()
export class CanActivateLoggedOut implements CanActivate {
  constructor(private oauthService: OAuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    if (!this.oauthService.hasValidAccessToken()) return true;
    await this.router.navigateByUrl(Paths.showsProgress({}));
    return false;
  }
}
