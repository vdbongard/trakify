import { TestBed } from '@angular/core/testing';
import { ViewTransitionService } from './view-transition.service';

describe('ViewTransitionService', () => {
  let service: ViewTransitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewTransitionService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('is finished when the router ran no transition', async () => {
    await expect(service.whenFinished()).resolves.toBeUndefined();
  });

  it('waits for the transition the router started', async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => (finish = resolve));
    service.track({ finished } as ViewTransition);

    let transitionFinished = false;
    void service.whenFinished().then(() => (transitionFinished = true));
    await Promise.resolve();

    expect(transitionFinished).toBe(false);

    finish();
    await expect(service.whenFinished()).resolves.toBeUndefined();
  });

  it('is finished when the transition was skipped', async () => {
    service.track({
      finished: Promise.reject(new Error('skipped')),
    } as unknown as ViewTransition);

    await expect(service.whenFinished()).resolves.toBeUndefined();
  });
});
