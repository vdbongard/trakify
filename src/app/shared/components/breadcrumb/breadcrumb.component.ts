import { Component, Input } from '@angular/core';

import type { BreadcrumbPart } from '@type/interfaces/Breadcrumb';

@Component({
  selector: 't-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  @Input() parts?: BreadcrumbPart[];

  back = history.state.back;
}
