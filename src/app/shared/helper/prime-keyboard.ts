const PRIME_ATTR = 'data-ios-keyboard-prime';
const CLEANUP_DELAY_MS = 1500;

export function isIosDevice(
  navigatorRef: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined,
): boolean {
  if (!navigatorRef || !doc) return false;
  const hasTouch = (navigatorRef.maxTouchPoints ?? 0) > 0 || 'ontouchend' in doc;
  if (!hasTouch) return false;
  const ua = navigatorRef.userAgent ?? '';
  const platform = navigatorRef.platform ?? '';
  if (/iPad|iPhone|iPod/.test(ua) || /iPad|iPhone|iPod/.test(platform)) return true;
  return /Mac/.test(ua) || /Mac/.test(platform);
}

export function primeKeyboard(
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined,
  navigatorRef: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
): void {
  if (!doc || !doc.body) return;
  if (!isIosDevice(navigatorRef, doc)) return;
  if (doc.querySelector(`[${PRIME_ATTR}]`)) return;

  const input = doc.createElement('input');
  input.setAttribute(PRIME_ATTR, 'true');
  input.setAttribute('aria-hidden', 'true');
  input.setAttribute('tabindex', '-1');
  input.setAttribute('autocomplete', 'off');
  input.style.cssText =
    'position:fixed;top:0;left:0;width:4px;height:4px;opacity:0.01;' +
    'font-size:16px;border:0;padding:0;margin:0;pointer-events:none;';
  doc.body.appendChild(input);
  input.focus({ preventScroll: true });

  const cleanup = (event?: FocusEvent): void => {
    if (event && event.target === input) return;
    input.remove();
    doc.removeEventListener('focusin', cleanup);
  };
  doc.addEventListener('focusin', cleanup);

  window.setTimeout(() => {
    if (input.isConnected) {
      input.remove();
      doc.removeEventListener('focusin', cleanup);
    }
  }, CLEANUP_DELAY_MS);
}
