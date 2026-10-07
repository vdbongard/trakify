import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PrimeKeyboardDirective } from './prime-keyboard.directive';

describe('PrimeKeyboardDirective', () => {
  let fixture: ComponentFixture<TestPrimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    fixture = TestBed.createComponent(TestPrimeComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('[data-ios-keyboard-prime]').forEach((el) => el.remove());
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('primes keyboard on click without blocking navigation', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBe(true);
  });
});

@Component({
  template: `<button tPrimeKeyboard (click)="clicked = true">search</button>`,
  imports: [PrimeKeyboardDirective],
})
class TestPrimeComponent {
  clicked = false;
}
