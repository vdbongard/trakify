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
});

@Component({
  template: `<div tSwipe (swipeLeft)="next($event)" (swipeRight)="previous($event)">Swipe Me</div>`,
  imports: [SwipeDirective],
})
class TestSwipeComponent {
  next(event: Event): void {
    console.log('Swiped left', event);
  }

  previous(event: Event): void {
    console.log('Swiped right', event);
  }
}
