import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemMenuComponent } from './show-item-menu.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { mockShow } from '@shared/mocks/mockShow';

describe('ShowItemMenuComponent', () => {
  let component: ShowItemMenuComponent;
  let fixture: ComponentFixture<ShowItemMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideOAuthClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowItemMenuComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('show', mockShow);
    fixture.componentRef.setInput('isFavorite', false);
    fixture.componentRef.setInput('isHidden', false);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
