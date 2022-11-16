import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { NgForOf, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TickerComponent } from '@shared/components/ticker/ticker.component';

@Component({
  selector: 't-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, NgForOf, RouterModule, TickerComponent],
})
export class BreadcrumbComponent {
  @Input() parts?: BreadcrumbPart[];

  back = history.state.back;
}
