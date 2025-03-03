import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemMenuComponent } from './show-item-menu.component';

describe('ShowItemMenuComponent', () => {
  let component: ShowItemMenuComponent;
  let fixture: ComponentFixture<ShowItemMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowItemMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowItemMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
