import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.ticker]': 'tickerIf()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[style.--indent.px]': 'indent',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[style.transitionDuration.ms]': 'duration',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(mouseenter)': 'onMouseEnter($event.target)',
  },
})
export class TickerComponent {
  tickerIf = input(true);

  indent = 0;

  get duration(): number {
    return -12 * this.indent;
  }

  onMouseEnter({ scrollWidth, clientWidth }: HTMLElement): void {
    this.indent = clientWidth - scrollWidth;
  }
}
