import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { BreadcrumbPart } from '@type/Breadcrumb';
import { RouterModule } from '@angular/router';
import { TickerComponent } from '@shared/components/ticker/ticker.component';

@Component({
  selector: 't-breadcrumb',
  imports: [RouterModule, TickerComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  parts = input<BreadcrumbPart[]>([]);

  back = history.state?.back;
}
