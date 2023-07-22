import { ComponentFixture, TestBed } from '@angular/core/testing';

import ShowsWithSearchComponent from './shows-with-search.component';

describe('AddShowComponent', () => {
  let component: ShowsWithSearchComponent;
  let fixture: ComponentFixture<ShowsWithSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowsWithSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowsWithSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
