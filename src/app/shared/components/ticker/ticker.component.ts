import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    const hasOverflow = scrollWidth > clientWidth;

    if (!hasOverflow) {
      return;
    }

    const offset = 1; // needed for end of text to be visible on hover
    this.indent = clientWidth - scrollWidth - offset;
  }
}
