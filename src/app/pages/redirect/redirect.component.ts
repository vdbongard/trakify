import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '@services/auth.service';
import { onError } from '@helper/error';

@Component({
  selector: 't-redirect',
  standalone: true,
  templateUrl: './redirect.component.html',
  styleUrl: './redirect.component.scss',
})
export default class RedirectComponent implements OnInit {
  oauthService = inject(OAuthService);
  router = inject(Router);
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    try {
      await this.oauthService.tryLoginCodeFlow();

      if (this.oauthService.hasValidAccessToken()) {
        this.authService.isLoggedIn.set(true);
        await this.router.navigate(['']);
        // The SyncService subscribes to isLoggedIn and runs the sync itself; calling
        // syncNew() here too would run two full syncs back-to-back.
      } else {
        onError(Error('Something went wrong'), this.snackBar);
      }
    } catch {
      onError(Error('Something went wrong'), this.snackBar);
    }
  }
}
