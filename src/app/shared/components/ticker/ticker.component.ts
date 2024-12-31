import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

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
    '[style.--animated-text-width]': 'animatedTextWidth',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(mouseenter)': 'onMouseEnter()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class TickerComponent {
  element = inject(ElementRef);

  tickerIf = input(true);

  animatedTextWidth = 0;

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();
    this.element.nativeElement.style.setProperty('overflow', 'visible');
  }

  onMouseLeave(): void {
    this.element.nativeElement.style.setProperty('overflow', 'hidden');
  }

  calculateAnimatedTextWidth(): void {
    const label = this.element.nativeElement;
    const hasOverflow = label.scrollWidth > label.clientWidth;

    if (!hasOverflow) {
      this.animatedTextWidth = 0;
      return;
    }

    const offset = 1; // Needed for end of text to be visible on hover
    this.animatedTextWidth = label.scrollWidth - label.clientWidth + offset;
  }
}
