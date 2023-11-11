import { Component, Input } from '@angular/core';
import type { BreadcrumbPart } from '@type/Breadcrumb';
import { RouterModule } from '@angular/router';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { State } from '@type/State';

@Component({
  selector: 't-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  standalone: true,
  imports: [RouterModule, TickerComponent],
})
export class BreadcrumbComponent {
  @Input() parts?: BreadcrumbPart[];

  back = (history.state as State).back;
}
