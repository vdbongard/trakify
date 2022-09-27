import { Component, Input } from '@angular/core';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { SeasonProgress } from '@type/interfaces/Trakt';

@Component({
  selector: 't-season-header',
  templateUrl: './season-header.component.html',
  styleUrls: ['./season-header.component.scss'],
})
export class SeasonHeaderComponent {
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() seasonNumber?: string | null;
  @Input() seasonProgress?: SeasonProgress | null;
}
