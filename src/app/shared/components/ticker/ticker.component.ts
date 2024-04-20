import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  input,
} from '@angular/core';

@Component({
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerComponent {
  @HostBinding('class.ticker')
  tickerIf = input(true);

  @HostBinding('style.--indent.px')
  indent = 0;

  @HostBinding('style.transitionDuration.ms')
  get duration(): number {
    return -12 * this.indent;
  }

  @HostListener('mouseenter', ['$event.target'])
  onMouseEnter({ scrollWidth, clientWidth }: HTMLElement): void {
    this.indent = clientWidth - scrollWidth;
  }
}
