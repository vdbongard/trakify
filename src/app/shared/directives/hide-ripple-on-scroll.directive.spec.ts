import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { MatRipple } from '@angular/material/core';

describe('HideRippleOnScrollDirective', () => {
  let fixture: ComponentFixture<TestRippleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HideRippleOnScrollDirective, MatRipple],
    }).compileComponents();

    fixture = TestBed.createComponent(TestRippleComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show ripple on click', () => {
    const div = fixture.nativeElement.querySelector('div');

    div.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        button: 0,
        pointerType: 'mouse',
      }),
    );

    const ripple = fixture.nativeElement.querySelector('.mat-ripple-element');
    expect(ripple).toBeTruthy();
  });
});

@Component({
  template: `<div tHideRippleOnScroll matRipple>Hide Ripple On Scroll</div>`,
  imports: [HideRippleOnScrollDirective, MatRipple],
})
class TestRippleComponent {}
