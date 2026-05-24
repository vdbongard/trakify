import { addCss } from './addCss';

describe('addCss', () => {
  it('should create style element, append it to head and return it', () => {
    const cssText = '.test-class { color: red; }';
    const styleElement = addCss(cssText);

    expect(styleElement).toBeTruthy();
    expect(styleElement.tagName).toBe('STYLE');
    expect(styleElement.innerText).toBe(cssText);
    expect(document.head.contains(styleElement)).toBe(true);

    // Clean up
    styleElement.remove();
  });
});
