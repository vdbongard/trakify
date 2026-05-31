import { TransitionGroupDirective } from './transition-group.directive';
import { TransitionGroupItemDirective } from './transition-group-item.directive';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

describe('TransitionGroupDirective', () => {
  let fixture: ComponentFixture<TestTransitionGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(TestTransitionGroupComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should apply move class to repositioned items', async () => {
    const reorderButton = fixture.nativeElement.querySelector('button.reorder') as
      | HTMLButtonElement
      | null;
    expect(reorderButton).toBeTruthy();

    reorderButton?.click();
    fixture.detectChanges();

    const divs = fixture.nativeElement.querySelectorAll('.item') as NodeListOf<HTMLDivElement>;
    const someMoved = Array.from(divs).some((div) => div.classList.contains('move'));
    expect(someMoved).toBe(true);
  });
});

@Component({
  template: `
    <button class="reorder" (click)="reorder()">Reorder</button>
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

  reorder(): void {
    this.items.set([3, 2, 1]);
  }
}
