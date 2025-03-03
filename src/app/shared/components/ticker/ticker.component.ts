import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

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
    '[style.--animated-text-width]': 'animatedTextWidth()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(mouseenter)': 'onMouseEnter()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(mouseleave)': 'onMouseLeave($event)',
  },
})
export class TickerComponent {
  element = inject(ElementRef);

  tickerIf = input(true);

  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();
    this.element.nativeElement.style.setProperty('overflow', 'visible');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
    }
  }

  async onMouseLeave(event: MouseEvent): Promise<void> {
    const target = event.target as HTMLElement;
    const targetStyle = getComputedStyle(target);
    const transitionDuration = parseFloat(targetStyle.getPropertyValue('transition-duration'));

    const timeoutId = window.setTimeout(() => {
      this.element.nativeElement.style.setProperty('overflow', 'hidden');
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
