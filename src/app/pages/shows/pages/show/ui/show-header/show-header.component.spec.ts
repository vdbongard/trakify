import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowHeaderComponent } from './show-header.component';

describe('ShowHeaderComponent', () => {
  let fixture: ComponentFixture<ShowHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(ShowHeaderComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render header skeleton when no data is set', () => {
    const header = fixture.nativeElement.querySelector('.header');
    const title = fixture.nativeElement.querySelector('h1.title');
    const posterPlaceholder = fixture.nativeElement.querySelector('.poster-thumbnail');

    expect(header).toBeTruthy();
    expect(title).toBeTruthy();
    expect(posterPlaceholder).toBeTruthy();
  });
});
