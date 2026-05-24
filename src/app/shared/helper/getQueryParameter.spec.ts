import { getQueryParameter } from './getQueryParameter';

describe('getQueryParameter', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('should parse query parameters correctly from hash location url', () => {
    window.location.hash = '#/route?token=abc&session=123';

    expect(getQueryParameter('token')).toBe('abc');
    expect(getQueryParameter('session')).toBe('123');
    expect(getQueryParameter('invalid')).toBeUndefined();
  });

  it('should return undefined if there are no query parameters in the hash', () => {
    window.location.hash = '#/route';

    expect(getQueryParameter('token')).toBeUndefined();
  });
});
