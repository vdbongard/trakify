import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;

  constructor(private oauthService: OAuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.oauthService.hasValidAccessToken();
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
