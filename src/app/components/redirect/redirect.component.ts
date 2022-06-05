import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
})
export class RedirectComponent implements OnInit {
  constructor(private oauthService: OAuthService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.oauthService.tryLoginCodeFlow();

    if (this.oauthService.hasValidAccessToken()) {
      await this.router.navigateByUrl('/');
    } else {
      console.error('Something went wrong when logging in to Trakt.');
    }
  }
}
