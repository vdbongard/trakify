import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { LocalStorage } from '@type/Enum';
import { login } from '@shared/paths';

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
