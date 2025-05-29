import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TransitionGroupItemDirective } from '@shared/directives/transition-group-item.directive';

describe('TransitionGroupItemDirective', () => {
  let component: TestTransitionGroupItemComponent;
  let fixture: ComponentFixture<TestTransitionGroupItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(TestTransitionGroupItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  template: `<div tTransitionGroupItem>Transition Group Item</div>`,
  imports: [TransitionGroupItemDirective],
})
class TestTransitionGroupItemComponent {}
