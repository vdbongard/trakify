import { Component, HostBinding, HostListener, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
})
export class TickerComponent {
  @HostBinding('class.ticker')
  @Input()
  tickerIf = true;

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
