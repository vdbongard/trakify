import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onError } from '../../shared/helper/error';

@Component({
  selector: 't-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
})
export class RedirectComponent implements OnInit {
  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    await this.oauthService.tryLoginCodeFlow();

    if (this.oauthService.hasValidAccessToken()) {
      this.authService.isLoggedIn$.next(true);
      await this.router.navigateByUrl('/');
    } else {
      onError(Error('Something went wrong when logging in to Trakt.'), this.snackBar);
    }
  }
}
