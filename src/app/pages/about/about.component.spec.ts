import { ComponentFixture, TestBed } from '@angular/core/testing';
import AboutComponent from './about.component';
import { page } from 'vitest/browser';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent.trim()).toBe('About');
  });

  it('should render donate button with PayPal link', () => {
    const donate = fixture.nativeElement.querySelector('.donate-button') as HTMLAnchorElement;
    expect(donate).toBeTruthy();
    expect(donate.textContent.trim()).toBe('Donate');
    expect(donate.href).toBe('https://www.paypal.com/donate/?hosted_button_id=NZVDE9956NGDN');
  });

  it('should render external link to source code', async () => {
    await expect
      .element(page.getByText('GitHub', { exact: true }))
      .toHaveAttribute('href', 'https://github.com/vdbongard/trakify');
  });
});
