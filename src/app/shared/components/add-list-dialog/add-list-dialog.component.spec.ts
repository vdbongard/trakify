import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddListDialogComponent } from './add-list-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('ListDialogComponent', () => {
  let component: AddListDialogComponent;
  let fixture: ComponentFixture<AddListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
