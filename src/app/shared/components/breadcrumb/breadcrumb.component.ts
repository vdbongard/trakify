import { Component, Input } from '@angular/core';

export interface BreadcrumbPart {
  name?: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  @Input() parts?: BreadcrumbPart[];
}
