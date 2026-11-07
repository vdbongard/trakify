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

  /** True from the start of the slide until the slide back has finished. */
  tickerActive = signal(false);
  /** True while the text is slid to its end; drives the transform. */
  tickerShifted = signal(false);
  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();
    this.tickerActive.set(true);
    this.tickerShifted.set(true);
    // The ellipsis would sit on top of the text while it slides, so drop it until the text
    // has slid back into place.
    this.element.nativeElement.style.setProperty('text-overflow', 'clip');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
      this.visibleEllipsisTimeoutId.set(undefined);
    }
  }

  onMouseLeave(): void {
    const host = this.element.nativeElement as HTMLElement;
    // The slide lives on the inner text element, so that is where the duration is defined.
    const text = host.querySelector<HTMLElement>('.ticker-text') ?? host;
    const transitionDuration = parseFloat(getComputedStyle(text).transitionDuration) || 0;

    // Start the slide back right away, but keep the text block-level and the ellipsis off until
    // it has finished.
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

    const offset = 1; // Needed for end of text to be visible on hover
    this.animatedTextWidth.set(label.scrollWidth - label.clientWidth + offset);
  }
}
