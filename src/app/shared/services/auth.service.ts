import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';

import { LocalStorage } from 'src/types/enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn$ = new BehaviorSubject<boolean>(this.oauthService.hasValidAccessToken());

  constructor(private oauthService: OAuthService, private router: Router) {}

  async logout(): Promise<void> {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG].includes(key)) continue;
      localStorage.removeItem(key);
    }
    this.oauthService.logOut();
    this.isLoggedIn$.next(false);
    await this.router.navigateByUrl('/login');
  }
}
