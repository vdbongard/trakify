import { Component, ElementRef, inject, input, OnDestroy, signal } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  host: {
    '[class.ticker]': 'tickerIf()',
    '[class.sliding]': 'sliding()',
    '[class.hovered]': 'hovered()',
    '[style.--animated-text-width]': 'animatedTextWidth()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class TickerComponent implements OnDestroy {
  element = inject(ElementRef);

  tickerIf = input(true);

  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  /** True from the first frame of the slide until the slide back has finished. Keeps the text
   *  block-level, because a transform does nothing to an inline box. */
  sliding = signal(false);
  /** True while the pointer is on the element; drives the transform. Set one frame after
   *  `sliding`, so the `display` change and the transform land in separate style passes. */
  hovered = signal(false);

  private frameId = 0;

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    const timeoutId = this.visibleEllipsisTimeoutId();
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();

    // A false hover on touch gets no slide, and with reduced motion the text would jump straight
    // to its end position (the global rule zeroes the duration) instead of sliding — so neither
    // gets one. The ellipsis is left alone in both cases.
    if (!this.slidesOnHover()) return;

    // The ellipsis would sit on top of the text while it slides, so drop it until the text
    // has slid back into place.
    this.element.nativeElement.style.setProperty('text-overflow', 'clip');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
      this.visibleEllipsisTimeoutId.set(undefined);
    }

    // Two frames: the first makes the text block-level, the second starts the transform. A
    // transform set in the same style pass as the `display` change does not animate.
    this.sliding.set(true);
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(() => this.hovered.set(true));
  }

  onMouseLeave(): void {
    const host = this.element.nativeElement as HTMLElement;
    // The slide lives on the inner text element, so that is where the duration is defined.
    const text = host.querySelector<HTMLElement>('.ticker-text') ?? host;
    const transitionDuration = parseFloat(getComputedStyle(text).transitionDuration) || 0;

    cancelAnimationFrame(this.frameId);
    this.hovered.set(false);

    // Keep the ellipsis off, and the text block-level, until the slide back has finished.
    const timeoutId = window.setTimeout(() => {
      host.style.removeProperty('text-overflow');
      this.sliding.set(false);
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

  private slidesOnHover(): boolean {
    return (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}
