import { TransitionGroupDirective } from './transition-group.directive';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

describe('TransitionGroupDirective', () => {
  let component: TestTransitionGroupComponent;
  let fixture: ComponentFixture<TestTransitionGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(TestTransitionGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  template: `<div tTransitionGroup>Transition Group</div>`,
  imports: [TransitionGroupDirective],
})
class TestTransitionGroupComponent {}
