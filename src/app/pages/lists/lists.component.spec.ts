import { ComponentFixture, TestBed } from '@angular/core/testing';
import ListsComponent from './lists.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';

describe('ListsComponent', () => {
  let fixture: ComponentFixture<ListsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render loading state initially', () => {
    const loading = fixture.nativeElement.querySelector('t-loading');
    expect(loading).toBeTruthy();
  });

  it('should show no list added when lists empty', () => {
    const message = fixture.nativeElement.querySelector('h2');
    expect(message).toBeTruthy();
    expect(message.textContent.trim()).toBe('No list added.');
  });
});
