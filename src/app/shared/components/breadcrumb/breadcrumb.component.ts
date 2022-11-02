import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { NgForOf, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 't-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, NgForOf, RouterModule],
})
export class BreadcrumbComponent {
  @Input() parts?: BreadcrumbPart[];

  back = history.state.back;
}
