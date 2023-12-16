import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowListItemComponent } from './show-list-item.component';

describe('ShowListItemComponent', () => {
  let component: ShowListItemComponent;
  let fixture: ComponentFixture<ShowListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
