import { Component, ElementRef, inject, input, signal } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  host: {
    '[class.ticker]': 'tickerIf()',
    '[class.ticker-active]': 'tickerActive()',
    '[class.ticker-shifted]': 'tickerShifted()',
    '[style.--animated-text-width]': 'animatedTextWidth()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class TickerComponent {
  element = inject(ElementRef);

  tickerIf = input(true);

  tickerActive = signal(false);
  tickerShifted = signal(false);
  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();
    this.tickerActive.set(true);
    this.tickerShifted.set(true);
    this.element.nativeElement.style.setProperty('text-overflow', 'clip');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
      this.visibleEllipsisTimeoutId.set(undefined);
    }
  }

  onMouseLeave(): void {
    const host = this.element.nativeElement as HTMLElement;
    const text = host.querySelector<HTMLElement>('.ticker-text') ?? host;
    const transitionDuration = parseFloat(getComputedStyle(text).transitionDuration) || 0;

    this.tickerShifted.set(false);

    const timeoutId = window.setTimeout(() => {
      host.style.removeProperty('text-overflow');
      this.tickerActive.set(false);
      this.visibleEllipsisTimeoutId.set(undefined);
    }, transitionDuration * 1000);
    this.visibleEllipsisTimeoutId.set(timeoutId);
  }

  calculateAnimatedTextWidth(): void {
    const label = this.element.nativeElement;
    const hasOverflow = label.scrollWidth > label.clientWidth;

    if (!hasOverflow) {
      this.animatedTextWidth.set(0);
      return;
    }

    const offset = 1;
    this.animatedTextWidth.set(label.scrollWidth - label.clientWidth + offset);
  }
}
