import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { AddListDialogComponent } from './add-list-dialog.component';

describe('ListDialogComponent', () => {
  let component: AddListDialogComponent;
  let fixture: ComponentFixture<AddListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddListDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
