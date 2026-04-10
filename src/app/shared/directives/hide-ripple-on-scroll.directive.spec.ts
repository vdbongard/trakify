import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { MatRipple } from '@angular/material/core';

describe('HideRippleOnScrollDirective', () => {
  let component: TestRippleComponent;
  let fixture: ComponentFixture<TestRippleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [MatRipple],
    }).compileComponents();

    fixture = TestBed.createComponent(TestRippleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  template: `<div tHideRippleOnScroll matRipple>Hide Ripple On Scroll</div>`,
  imports: [HideRippleOnScrollDirective, MatRipple],
})
class TestRippleComponent {}
