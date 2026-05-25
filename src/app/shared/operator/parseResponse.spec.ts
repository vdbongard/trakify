import { of } from 'rxjs';
import { parseResponse } from './parseResponse';
import { z } from 'zod';

describe('parseResponse', () => {
  it('should pass through value when no schema provided', () => {
    const values: unknown[] = [];
    const source$ = of({ id: 1 });

    source$.pipe(parseResponse()).subscribe((v) => values.push(v));

    expect(values).toEqual([{ id: 1 }]);
  });

  it('should pass through valid value matching schema', () => {
    const schema = z.object({ id: z.number() });
    const values: unknown[] = [];
    const source$ = of({ id: 1 });

    source$.pipe(parseResponse(schema)).subscribe((v) => values.push(v));

    expect(values).toEqual([{ id: 1 }]);
  });

  it('should log error for invalid value but not throw', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({ id: z.number() });
    const values: unknown[] = [];
    const source$ = of({ id: 'not-a-number' } as unknown as never);

    source$.pipe(parseResponse(schema)).subscribe((v) => values.push(v));

    expect(consoleSpy).toHaveBeenCalled();
    expect(values).toEqual([{ id: 'not-a-number' }]);
    consoleSpy.mockRestore();
  });
});
