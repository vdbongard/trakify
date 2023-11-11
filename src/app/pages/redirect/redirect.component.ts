import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '@services/auth.service';
import { onError } from '@helper/error';
import { SyncService } from '@services/sync.service';

@Component({
  selector: 't-redirect',
  templateUrl: './redirect.component.html',
  styleUrl: './redirect.component.scss',
  standalone: true,
})
export default class RedirectComponent implements OnInit {
  oauthService = inject(OAuthService);
  router = inject(Router);
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  syncService = inject(SyncService);

  async ngOnInit(): Promise<void> {
    try {
      await this.oauthService.tryLoginCodeFlow();

      if (this.oauthService.hasValidAccessToken()) {
        this.authService.isLoggedIn.set(true);
        await this.router.navigate(['']);
        await this.syncService.syncNew();
      } else {
        onError(Error('Something went wrong'), this.snackBar);
      }
    } catch (e) {
      onError(Error('Something went wrong'), this.snackBar);
    }
  }
}
