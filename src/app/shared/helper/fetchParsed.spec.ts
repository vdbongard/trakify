import { of } from 'rxjs';
import { z } from 'zod';
import { fetchParsed } from './fetchParsed';

describe('fetchParsed', () => {
  it('resolves the validated response behind a promise seam', async () => {
    const promise = fetchParsed(of({ a: 1 }), z.object({ a: z.number() }));

    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toEqual({ a: 1 });
  });
});
