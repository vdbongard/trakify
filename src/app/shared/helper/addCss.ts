export function addCss(css: string): HTMLStyleElement {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = css;
  document.head.appendChild(styleSheet);
  return styleSheet;
}
