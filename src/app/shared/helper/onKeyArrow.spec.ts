import { onKeyArrow } from './onKeyArrow';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

describe('onKeyArrow', () => {
  it('should trigger arrowLeft and arrowRight callbacks on window keyup events', () => {
    const arrowLeftSpy = vi.fn();
    const arrowRightSpy = vi.fn();

    TestBed.runInInjectionContext(() => {
      onKeyArrow({
        arrowLeft: arrowLeftSpy,
        arrowRight: arrowRightSpy,
      });

      // Dispatch ArrowLeft
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
      expect(arrowLeftSpy).toHaveBeenCalledTimes(1);
      expect(arrowRightSpy).not.toHaveBeenCalled();

      // Dispatch ArrowRight
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
      expect(arrowRightSpy).toHaveBeenCalledTimes(1);
    });
  });
});
