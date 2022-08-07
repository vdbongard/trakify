import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EpisodeComponent } from './components/episode/episode.component';
import { ShowsComponent } from './components/shows/shows.component';
import { ShowItemComponent } from './components/show-item/show-item.component';
import { ListDialogComponent } from './components/list-dialog/list-dialog.component';
import { AddListDialogComponent } from './components/add-list-dialog/add-list-dialog.component';
import { ListItemsDialogComponent } from './components/list-items-dialog/list-items-dialog.component';
import { LoadingComponent } from './components/loading/loading.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';

import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { A11yModule } from '@angular/cdk/a11y';

import { IsInListPipe } from './pipes/is-in-list.pipe';
import { MinutesPipe } from './pipes/minutes.pipe';
import { RelativeDatePipe } from './pipes/relativeDate.pipe';
import { Season0AsSpecialsPipe } from './pipes/season0-as-specials.pipe';

import { RippleDirective } from './directives/ripple.directive';
import { ImageFallbackDirective } from './directives/image-fallback.directive';
import { TransitionGroupItemDirective } from './directives/transition-group-item.directive';
import { TransitionGroupDirective } from './directives/transition-group.directive';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    EpisodeComponent,
    ShowsComponent,
    ShowItemComponent,
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
    Season0AsSpecialsPipe,
    TransitionGroupItemDirective,
    TransitionGroupDirective,
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
    MinutesPipe,
    LoadingComponent,
    BreadcrumbComponent,
    RippleDirective,
    ImageFallbackDirective,
    Season0AsSpecialsPipe,
  ],
})
export class SharedModule {}
