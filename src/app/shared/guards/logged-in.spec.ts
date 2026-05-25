import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { loggedIn } from './logged-in';

describe('loggedIn guard', () => {
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockRouter = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
  });

  it('should return true when access_token exists', async () => {
    localStorage.setItem('access_token', 'test-token');
    const result = await TestBed.runInInjectionContext(() => loggedIn());
    expect(result).toBe(true);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should navigate to /login and return false when no access_token', async () => {
    const result = await TestBed.runInInjectionContext(() => loggedIn());
    expect(result).toBe(false);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  afterEach(() => {
    localStorage.clear();
  });
});
