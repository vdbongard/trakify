import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemComponent } from './list-item.component';
import { mockShow } from '@shared/mocks/mockShow';
import { mockListItems } from '@shared/mocks/mockListItems';

describe('ListItemComponent', () => {
  let component: ListItemComponent;
  let fixture: ComponentFixture<ListItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListItemComponent],
    });
    fixture = TestBed.createComponent(ListItemComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('show', mockShow);
    fixture.componentRef.setInput('listItems', mockListItems);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
