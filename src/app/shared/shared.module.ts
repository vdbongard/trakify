import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeComponent } from './components/episode/episode.component';
import { MatButtonModule } from '@angular/material/button';
import { ShowsComponent } from './components/shows/shows.component';
import { MatListModule } from '@angular/material/list';
import { ShowItemComponent } from './components/show-item/show-item.component';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { HideSeason0Pipe } from './pipes/hide-season0.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { ListDialogComponent } from './components/list-dialog/list-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AddListDialogComponent } from './components/add-list-dialog/add-list-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { A11yModule } from '@angular/cdk/a11y';
import { ListItemsDialogComponent } from './components/list-items-dialog/list-items-dialog.component';
import { IsInListPipe } from './pipes/is-in-list.pipe';
import { MinutesPipe } from './pipes/minutes.pipe';
import { RelativeDatePipe } from './pipes/relativeDate.pipe';
import { LoadingComponent } from './components/loading/loading.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RippleDirective } from './directives/ripple.directive';
import { ImageFallbackDirective } from './directives/image-fallback.directive';

@NgModule({
  declarations: [
    EpisodeComponent,
    ShowsComponent,
    ShowItemComponent,
    HideSeason0Pipe,
    ListDialogComponent,
    AddListDialogComponent,
    ListItemsDialogComponent,
    IsInListPipe,
    MinutesPipe,
    RelativeDatePipe,
    LoadingComponent,
    BreadcrumbComponent,
    RippleDirective,
    ImageFallbackDirective,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    RouterModule,
    MatRippleModule,
    MatProgressBarModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    A11yModule,
    MatProgressSpinnerModule,
  ],
  exports: [
    EpisodeComponent,
    ShowsComponent,
    HideSeason0Pipe,
    MinutesPipe,
    LoadingComponent,
    BreadcrumbComponent,
    RippleDirective,
    ImageFallbackDirective,
  ],
})
export class SharedModule {}
