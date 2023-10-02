import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { LocalStorage } from '@type/Enum';
import { login } from '@shared/paths';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  oauthService = inject(OAuthService);
  router = inject(Router);

  isLoggedIn$ = new BehaviorSubject<boolean>(this.oauthService.hasValidAccessToken());
  isLoggedIn = toSignal(this.isLoggedIn$);

  async logout(): Promise<void> {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG].includes(key)) continue;
      localStorage.removeItem(key);
    }
    this.oauthService.logOut();
    this.isLoggedIn$.next(false);
    await this.router.navigateByUrl(login({}));
  }
}
