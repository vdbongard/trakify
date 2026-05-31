import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TickerComponent } from './ticker.component';
import { vi } from 'vitest';

describe('TickerComponent', () => {
  let fixture: ComponentFixture<TickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TickerComponent);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should add the ticker class by default', () => {
    expect(fixture.nativeElement.classList.contains('ticker')).toBe(true);
  });

  it('should remove the ticker class when disabled', async () => {
    fixture.componentRef.setInput('tickerIf', false);

    await fixture.whenStable();

    expect(fixture.nativeElement.classList.contains('ticker')).toBe(false);
  });

  it('should calculate the animated width when text overflows', () => {
    defineElementWidth({ clientWidth: 100, scrollWidth: 140 });

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(fixture.nativeElement.style.getPropertyValue('--animated-text-width')).toBe('41');
  });

  it('should reset the animated width when text fits', () => {
    defineElementWidth({ clientWidth: 100, scrollWidth: 140 });
    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    defineElementWidth({ clientWidth: 140, scrollWidth: 140 });
    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(fixture.nativeElement.style.getPropertyValue('--animated-text-width')).toBe('0');
  });

  it('should make overflow visible on mouse enter', () => {
    defineElementWidth({ clientWidth: 100, scrollWidth: 140 });

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(fixture.nativeElement.style.overflow).toBe('visible');
    expect(fixture.nativeElement.style.getPropertyValue('--animated-text-width')).toBe('41');
  });

  it('should hide overflow after the leave transition duration', async () => {
    vi.useFakeTimers();
    fixture.nativeElement.style.transitionDuration = '0.2s';

    fixture.nativeElement.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(199);

    expect(fixture.nativeElement.style.overflow).toBe('');

    vi.advanceTimersByTime(1);

    expect(fixture.nativeElement.style.overflow).toBe('hidden');
  });

  function defineElementWidth({
    clientWidth,
    scrollWidth,
  }: {
    clientWidth: number;
    scrollWidth: number;
  }): void {
    Object.defineProperty(fixture.nativeElement, 'clientWidth', {
      configurable: true,
      value: clientWidth,
    });
    Object.defineProperty(fixture.nativeElement, 'scrollWidth', {
      configurable: true,
      value: scrollWidth,
    });
  }
});
