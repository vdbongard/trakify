import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { LocalStorage } from '@type/Enum';
import { login } from '@shared/paths';
import { LocalStorageService } from '@services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  oauthService = inject(OAuthService);
  router = inject(Router);
  localStorageService = inject(LocalStorageService);

  isLoggedIn = signal(this.oauthService.hasValidAccessToken());

  async logout(): Promise<void> {
    this.localStorageService.removeAllKeys({ exclude: [LocalStorage.CONFIG] });
    this.oauthService.logOut();
    this.isLoggedIn.set(false);
    await this.router.navigateByUrl(login({}));
  }
}
