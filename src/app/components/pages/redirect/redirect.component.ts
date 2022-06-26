import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { ConfigService } from '../../../services/config.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
})
export class RedirectComponent implements OnInit {
  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.oauthService.tryLoginCodeFlow();

    if (this.oauthService.hasValidAccessToken()) {
      this.authService.isLoggedIn.next(true);
      await this.router.navigateByUrl('/');
    } else {
      console.error('Something went wrong when logging in to Trakt.');
    }
  }
}
