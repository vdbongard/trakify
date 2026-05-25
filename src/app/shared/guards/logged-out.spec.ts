import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { loggedOut } from './logged-out';

describe('loggedOut guard', () => {
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockRouter = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
  });

  it('should return true when no access_token', async () => {
    const result = await TestBed.runInInjectionContext(() => loggedOut());
    expect(result).toBe(true);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should navigate to /shows/progress and return false when access_token exists', async () => {
    localStorage.setItem('access_token', 'test-token');
    const result = await TestBed.runInInjectionContext(() => loggedOut());
    expect(result).toBe(false);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/shows/progress');
  });

  afterEach(() => {
    localStorage.clear();
  });
});
