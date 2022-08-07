import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemsDialogComponent } from './list-items-dialog.component';

describe('AddListItemsComponent', () => {
  let component: ListItemsDialogComponent;
  let fixture: ComponentFixture<ListItemsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListItemsDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListItemsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
