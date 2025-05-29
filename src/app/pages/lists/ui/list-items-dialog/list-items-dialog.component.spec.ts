import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemsDialogComponent } from './list-items-dialog.component';
import type { ListItemsDialogData } from '@type/Dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { mockListItems } from '@shared/mocks/mockListItems';
import { mockShow } from '@shared/mocks/mockShow';
import { mockList } from '@shared/mocks/mockList';

describe('ListItemsDialogComponent', () => {
  let component: ListItemsDialogComponent;
  let fixture: ComponentFixture<ListItemsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            listItems: mockListItems,
            list: mockList,
            shows: [mockShow],
          } as ListItemsDialogData,
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListItemsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
