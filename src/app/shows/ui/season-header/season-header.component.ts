import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { Season, SeasonProgress } from '@type/interfaces/Trakt';

@Component({
  selector: 't-season-header',
  templateUrl: './season-header.component.html',
  styleUrls: ['./season-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonHeaderComponent {
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() seasonNumber?: string | null;
  @Input() showSlug?: string | null;
  @Input() seasonProgress?: SeasonProgress | null;
  @Input() seasons?: Season[] | null;

  back = history.state.back;
}