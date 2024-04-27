import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { login } from '@shared/paths';
import { LocalStorage } from '@type/Enum';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  oauthService = inject(OAuthService);
  router = inject(Router);

  isLoggedIn = signal(this.oauthService.hasValidAccessToken());

  async logout(): Promise<void> {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG].includes(key)) continue;
      localStorage.removeItem(key);
    }
    this.oauthService.logOut();
    this.isLoggedIn.set(false);
    await this.router.navigateByUrl(login({}));
  }
}
