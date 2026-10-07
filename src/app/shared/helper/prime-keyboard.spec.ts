import { isIosDevice, primeKeyboard } from './prime-keyboard';

function mockNavigator(overrides: Partial<Navigator>): Navigator {
  return {
    maxTouchPoints: 0,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    platform: 'Win32',
    ...overrides,
  } as Navigator;
}

describe('isIosDevice', () => {
  it('returns false without touch support', () => {
    const doc = document;
    const nav = mockNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 0,
    });
    expect(isIosDevice(nav, doc)).toBe(false);
  });

  it('returns true for iPhone with touch', () => {
    const nav = mockNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    expect(isIosDevice(nav, document)).toBe(true);
  });

  it('returns true for iPadOS reporting as Mac with touch', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    expect(isIosDevice(nav, document)).toBe(true);
  });

  it('returns false for Mac desktop without touch', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    expect(isIosDevice(nav, document)).toBe(false);
  });
});

describe('primeKeyboard', () => {
  afterEach(() => {
    document.querySelectorAll('[data-ios-keyboard-prime]').forEach((el) => el.remove());
    vi.useRealTimers();
  });

  it('does nothing on non-touch devices', () => {
    const nav = mockNavigator({ maxTouchPoints: 0, platform: 'Win32' });
    primeKeyboard(document, nav);
    expect(document.querySelector('[data-ios-keyboard-prime]')).toBeNull();
  });

  it('focuses a temporary input synchronously on iPad', () => {
    const nav = mockNavigator({
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPad',
      maxTouchPoints: 5,
    });
    primeKeyboard(document, nav);
    const prime = document.querySelector('[data-ios-keyboard-prime]') as HTMLInputElement | null;
    expect(prime).toBeTruthy();
    expect(document.activeElement).toBe(prime);
  });

  it('removes the temporary input once the real search input takes focus', () => {
    vi.useFakeTimers();
    const nav = mockNavigator({
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPad',
      maxTouchPoints: 5,
    });
    primeKeyboard(document, nav);
    expect(document.querySelector('[data-ios-keyboard-prime]')).toBeTruthy();

    const realInput = document.createElement('input');
    document.body.appendChild(realInput);
    realInput.focus();
    try {
      expect(document.querySelector('[data-ios-keyboard-prime]')).toBeNull();
    } finally {
      realInput.remove();
    }
  });

  it('does not create duplicate temporary inputs', () => {
    const nav = mockNavigator({
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPad',
      maxTouchPoints: 5,
    });
    primeKeyboard(document, nav);
    primeKeyboard(document, nav);
    expect(document.querySelectorAll('[data-ios-keyboard-prime]').length).toBe(1);
  });
});
