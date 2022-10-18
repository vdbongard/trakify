import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EpisodeComponent } from './components/episode/episode.component';
import { ShowsComponent } from './components/shows/shows.component';
import { ShowItemComponent } from './components/show-item/show-item.component';
import { ListDialogComponent } from './components/list-dialog/list-dialog.component';
import { AddListDialogComponent } from './components/add-list-dialog/add-list-dialog.component';
import { LoadingComponent } from './components/loading/loading.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';

import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { A11yModule } from '@angular/cdk/a11y';

import { HideRippleOnScrollDirective } from './directives/hide-ripple-on-scroll.directive';
import { TransitionGroupItemDirective } from './directives/transition-group-item.directive';
import { TransitionGroupDirective } from './directives/transition-group.directive';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { RelativeDatePipe } from './pipes/relativeDate.pipe';
import { MinutesPipe } from './pipes/minutes.pipe';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { IsFavoritePipe } from './pipes/is-favorite.pipe';
import { FilterPipe } from './pipes/filter.pipe';
import { StartsWithPipe } from './pipes/starts-with.pipe';
import { IncludesPipe } from './pipes/includes.pipe';
import { SlicePipe } from './pipes/slice.pipe';
import { EpisodeLinkWithCounterPipe } from './pipes/episode-link-with-counter.pipe';
import { IsShowEndedPipe } from './pipes/is-show-ended.pipe';
import { IsInFuturePipe } from './pipes/is-in-future.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { ShowSlugPipe } from './pipes/show-slug.pipe';
import { IsErrorPipe } from './pipes/is-error.pipe';
import { SeasonLinkWithCounterPipe } from './pipes/season-link-with-counter.pipe';
import { EpisodeProgressPipe } from './pipes/episode-progress.pipe';

@NgModule({
  declarations: [
    EpisodeComponent,
    ShowsComponent,
    ShowItemComponent,
    ListDialogComponent,
    AddListDialogComponent,
    LoadingComponent,
    BreadcrumbComponent,
    HideRippleOnScrollDirective,
    RelativeDatePipe,
    TransitionGroupItemDirective,
    TransitionGroupDirective,
    MinutesPipe,
    ConfirmDialogComponent,
    IsFavoritePipe,
    FilterPipe,
    StartsWithPipe,
    IncludesPipe,
    SlicePipe,
    EpisodeLinkWithCounterPipe,
    IsShowEndedPipe,
    IsInFuturePipe,
    ShowSlugPipe,
    IsErrorPipe,
    SeasonLinkWithCounterPipe,
    EpisodeProgressPipe,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatListModule,
    MatRippleModule,
    MatProgressBarModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    A11yModule,
    NgOptimizedImage,
    NgGenericPipeModule,
  ],
  exports: [
    EpisodeComponent,
    ShowsComponent,
    LoadingComponent,
    BreadcrumbComponent,
    HideRippleOnScrollDirective,
    MinutesPipe,
    IsFavoritePipe,
    StartsWithPipe,
    IncludesPipe,
    EpisodeLinkWithCounterPipe,
    IsShowEndedPipe,
    NgGenericPipeModule,
    ShowSlugPipe,
    IsErrorPipe,
    SeasonLinkWithCounterPipe,
    EpisodeProgressPipe,
    IsInFuturePipe,
  ],
})
export class SharedModule {}
