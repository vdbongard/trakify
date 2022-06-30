import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { ErrorComponent } from './components/pages/error/error.component';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { RedirectComponent } from './components/pages/redirect/redirect.component';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { ShowComponent } from './components/pages/show/show/show.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { ShowsComponent } from './components/pages/shows/shows/shows.component';
import { SeasonItemComponent } from './components/pages/show/season-item/season-item.component';
import { SeasonComponent } from './components/pages/season/season/season.component';
import { EpisodeItemComponent } from './components/pages/season/episode-item/episode-item.component';
import { EpisodeComponent } from './components/pages/episode/episode/episode.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { LoginComponent } from './components/pages/login/login.component';
import { SharedModule } from './shared/shared.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AddShowComponent } from './components/pages/add-show/add-show.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SearchComponent } from './components/pages/search/search.component';
import { A11yModule } from '@angular/cdk/a11y';
import { MatTabsModule } from '@angular/material/tabs';
import { UpcomingComponent } from './components/pages/upcoming/upcoming.component';
import { WatchlistComponent } from './components/pages/watchlist/watchlist.component';
import { ListsComponent } from './components/pages/lists/lists.component';

export function storageFactory(): OAuthStorage {
  return localStorage;
}

@NgModule({
  declarations: [
    AppComponent,
    ErrorComponent,
    RedirectComponent,
    ShowComponent,
    ShowsComponent,
    SeasonItemComponent,
    SeasonComponent,
    EpisodeItemComponent,
    EpisodeComponent,
    LoginComponent,
    AddShowComponent,
    SearchComponent,
    UpcomingComponent,
    WatchlistComponent,
    ListsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['https://api.trakt.tv'],
        sendAccessToken: true,
      },
    }),
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatListModule,
    MatRippleModule,
    MatProgressBarModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    MatRadioModule,
    FormsModule,
    MatProgressSpinnerModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    SharedModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    A11yModule,
    MatTabsModule,
  ],
  providers: [{ provide: OAuthStorage, useFactory: storageFactory }],
  bootstrap: [AppComponent],
})
export class AppModule {}
