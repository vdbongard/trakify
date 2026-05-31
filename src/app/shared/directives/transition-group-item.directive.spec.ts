import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TransitionGroupItemDirective } from '@shared/directives/transition-group-item.directive';

describe('TransitionGroupItemDirective', () => {
  let fixture: ComponentFixture<TestTransitionGroupItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(TestTransitionGroupItemComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should apply directive to the element', () => {
    const item = fixture.nativeElement.querySelector('div[tTransitionGroupItem]');

    expect(item).toBeTruthy();
    expect(item?.textContent?.trim()).toBe('Transition Group Item');
  });
});

@Component({
  template: `<div tTransitionGroupItem>Transition Group Item</div>`,
  imports: [TransitionGroupItemDirective],
})
class TestTransitionGroupItemComponent {}
