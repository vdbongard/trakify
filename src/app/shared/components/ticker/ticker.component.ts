import { Component, ElementRef, inject, input, signal } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  host: {
    '[class.ticker]': 'tickerIf()',
    '[style.--animated-text-width]': 'animatedTextWidth()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class TickerComponent {
  element = inject(ElementRef);

  tickerIf = input(true);

  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();
    // The ellipsis would sit on top of the text while it slides, so drop it until the text
    // has slid back into place.
    this.element.nativeElement.style.setProperty('text-overflow', 'clip');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
    }
  }

  onMouseLeave(): void {
    const host = this.element.nativeElement as HTMLElement;
    // The slide lives on the inner text element, so that is where the duration is defined.
    const text = host.querySelector<HTMLElement>('.ticker-text') ?? host;
    const transitionDuration = parseFloat(getComputedStyle(text).transitionDuration) || 0;

    const timeoutId = window.setTimeout(() => {
      host.style.removeProperty('text-overflow');
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

    const offset = 1; // Needed for end of text to be visible on hover
    this.animatedTextWidth.set(label.scrollWidth - label.clientWidth + offset);
  }
}
