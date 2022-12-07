import { Component, Input } from '@angular/core';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { Season, SeasonProgress } from '@type/interfaces/Trakt';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SeasonTitlePipe } from '../../utils/pipes/season-title.pipe';
import { SeasonLinkWithCounterPipe } from '@shared/pipes/season-link-with-counter.pipe';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 't-season-header',
  templateUrl: './season-header.component.html',
  styleUrls: ['./season-header.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    RouterLink,
    SeasonTitlePipe,
    SeasonLinkWithCounterPipe,
    MatProgressBarModule,
    MatIconModule,
  ],
})
export class SeasonHeaderComponent {
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() seasonNumber?: string | null;
  @Input() showSlug?: string | null;
  @Input() seasonProgress?: SeasonProgress | null;
  @Input() seasons?: Season[] | null;

  back = history.state.back;
}
