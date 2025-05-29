import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowListItemComponent } from './show-list-item.component';
import { mockShow } from '@shared/mocks/mockShow';

describe('ShowListItemComponent', () => {
  let component: ShowListItemComponent;
  let fixture: ComponentFixture<ShowListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(ShowListItemComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('show', mockShow);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
