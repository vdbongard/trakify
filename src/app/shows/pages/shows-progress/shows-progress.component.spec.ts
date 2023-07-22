import { ComponentFixture, TestBed } from '@angular/core/testing';

import ShowsProgressComponent from './shows-progress.component';

describe('ShowsComponent', () => {
  let component: ShowsProgressComponent;
  let fixture: ComponentFixture<ShowsProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowsProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowsProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
