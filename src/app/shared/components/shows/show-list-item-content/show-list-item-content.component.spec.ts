import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowListItemContentComponent } from './show-list-item-content.component';

describe('ShowListItemContentComponent', () => {
  let component: ShowListItemContentComponent;
  let fixture: ComponentFixture<ShowListItemContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowListItemContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowListItemContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
