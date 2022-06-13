import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Subscription } from 'rxjs';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  subscriptions: Subscription[] = [];

  constructor(private oauthService: OAuthService, private configService: ConfigService) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.configService.isLoggedIn.subscribe((isLoggedIn) => (this.isLoggedIn = isLoggedIn)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async login(): Promise<void> {
    this.oauthService.initCodeFlow();
  }
}
