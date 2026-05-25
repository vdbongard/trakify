import { SwipeDirective } from './swipe.directive';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

describe('SwipeDirective', () => {
  let component: TestSwipeComponent;
  let fixture: ComponentFixture<TestSwipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(TestSwipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit swipeLeft on left swipe', () => {
    document.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 50, clientY: 100 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('left');
  });

  it('should emit swipeRight on right swipe', () => {
    document.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 100 }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('right');
  });

  it('should emit swipeUp on up swipe', () => {
    document.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 50 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('up');
  });

  it('should emit swipeDown on down swipe', () => {
    document.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 50 }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('down');
  });

  it('should not emit swipe when delta is below threshold', () => {
    document.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 100 }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 60, clientY: 100 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});

@Component({
  template: `<div
    tSwipe
    (swipeLeft)="direction = 'left'"
    (swipeRight)="direction = 'right'"
    (swipeUp)="direction = 'up'"
    (swipeDown)="direction = 'down'"
  >
    {{ direction }}
  </div>`,
  imports: [SwipeDirective],
})
class TestSwipeComponent {
  direction = '';
}
