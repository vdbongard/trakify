import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private http: HttpClient, private oauthService: OAuthService) {}

  ngOnInit(): void {}

  login(): void {
    this.oauthService.initImplicitFlow();
  }
}
