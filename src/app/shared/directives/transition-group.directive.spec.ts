import { TransitionGroupDirective } from './transition-group.directive';
import { TransitionGroupItemDirective } from './transition-group-item.directive';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

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

  it('should apply move class to repositioned items', async () => {
    component.items.set([3, 2, 1]);
    fixture.detectChanges();

    const divs = fixture.nativeElement.querySelectorAll('.item') as NodeListOf<HTMLDivElement>;
    const someMoved = Array.from(divs).some((div) => div.classList.contains('move'));
    expect(someMoved).toBe(true);
  });
});

@Component({
  template: `
    <div tTransitionGroup style="display: flex; flex-direction: column;">
      @for (item of items(); track item) {
        <div tTransitionGroupItem class="item" style="height: 50px;">{{ item }}</div>
      }
    </div>
  `,
  imports: [TransitionGroupDirective, TransitionGroupItemDirective],
})
class TestTransitionGroupComponent {
  items = signal([1, 2, 3]);
}
