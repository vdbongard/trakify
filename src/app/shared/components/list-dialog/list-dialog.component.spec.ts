import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDialogComponent } from './list-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ListsDialogData } from '@type/Dialog';
import { List } from '@type/TraktList';

describe('ListDialogComponent', () => {
  let component: ListDialogComponent;
  let fixture: ComponentFixture<ListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: vi.fn(),
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            lists: [
              { name: 'Watchlist', ids: { trakt: 1 } } as List,
              { name: 'Favorites', ids: { trakt: 2 } } as List,
              { name: 'Completed', ids: { trakt: 3 } } as List,
            ],
            listIds: [1, 2, 3],
            showId: 12345,
          } as ListsDialogData,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
