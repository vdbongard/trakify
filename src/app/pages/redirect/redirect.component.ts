import { ChangeDetectionStrategy, Component, type OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { onError } from '@helper/error';
import { AuthService } from '@services/auth.service';
import { SyncService } from '@services/sync.service';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 't-redirect',
  standalone: true,
  templateUrl: './redirect.component.html',
  styleUrl: './redirect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
