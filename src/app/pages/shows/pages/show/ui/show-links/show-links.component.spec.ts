import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLinksComponent } from './show-links.component';

describe('ShowLinksComponent', () => {
  let component: ShowLinksComponent;
  let fixture: ComponentFixture<ShowLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowLinksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
