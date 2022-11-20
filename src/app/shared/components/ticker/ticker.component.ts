import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  Input,
} from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  template: '<ng-content></ng-content>',
  styles: [
    `
              :host.ticker {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: text-indent linear;
        
                &:hover {
                  text-indent: var(--indent);
                  text-overflow: clip;
                  user-select: none;
                }
              }
            `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
