import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import type { BreadcrumbPart } from '@type/Breadcrumb';

@Component({
  selector: 't-breadcrumb',
  standalone: true,
  imports: [RouterModule, TickerComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  parts = input<BreadcrumbPart[]>([]);

  back = history.state.back;
}
