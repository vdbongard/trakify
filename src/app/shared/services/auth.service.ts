import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { lastValueFrom, Subscription } from 'rxjs';
import { LocalStorage } from '@type/Enum';
import { authCodeFlowConfig } from '@shared/auth-config';

interface TraktTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  oauthService = inject(OAuthService);
  router = inject(Router);
  http = inject(HttpClient);

  isLoggedIn = signal(this.oauthService.hasValidAccessToken());

  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private eventsSubscription: Subscription | undefined;
  private readonly refreshMarginMs = 5 * 60 * 1000; // Refresh 5 minutes before expiration

  setupAutoRefresh(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = this.oauthService.events.subscribe((event) => {
      if (event.type === 'token_received') {
        this.isLoggedIn.set(true);
        this.armRefreshTimer();
      } else if (event.type === 'logout') {
        this.isLoggedIn.set(false);
        this.clearRefreshTimer();
      }
    });

    if (this.oauthService.hasValidAccessToken()) {
      this.armRefreshTimer();
    } else {
      void this.refresh();
    }
  }

  private armRefreshTimer(): void {
    this.clearRefreshTimer();
    const expiresAt = this.oauthService.getAccessTokenExpiration();
    if (!expiresAt) return;
    const delay = expiresAt - Date.now() - this.refreshMarginMs;
    this.refreshTimer = setTimeout(() => void this.refresh(), Math.max(delay, 0));
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private async refresh(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.isLoggedIn.set(this.oauthService.hasValidAccessToken());
      return;
    }
    try {
      const response = await this.refreshToken(refreshToken);
      this.storeTokens(response);
      this.isLoggedIn.set(true);
      this.armRefreshTimer();
    } catch {
      this.isLoggedIn.set(this.oauthService.hasValidAccessToken());
    }
  }

  private refreshToken(refreshToken: string): Promise<TraktTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: authCodeFlowConfig.clientId ?? '',
      redirect_uri: authCodeFlowConfig.redirectUri ?? '',
    });
    return lastValueFrom(
      this.http.post<TraktTokenResponse>(authCodeFlowConfig.tokenEndpoint ?? '', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
  }

  private storeTokens(response: TraktTokenResponse): void {
    const now = Date.now();
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('access_token_stored_at', String(now));
    localStorage.setItem('expires_at', String(now + response.expires_in * 1000));
    const scopes = (response.scope ?? '').split(' ').filter(Boolean);
    localStorage.setItem('granted_scopes', JSON.stringify(scopes));
  }

  async logout(): Promise<void> {
    for (const key of Object.values(LocalStorage)) {
      if ([LocalStorage.CONFIG].includes(key)) continue;
      localStorage.removeItem(key);
    }
    this.oauthService.logOut();
    this.isLoggedIn.set(false);
    await this.router.navigateByUrl('/login');
  }
}
