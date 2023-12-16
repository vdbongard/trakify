export function getGlobalStyles(): CSSStyleSheet {
  // Global styles are added in the following order:
  // 1. Roboto font stylesheet
  // 2. Material icons stylesheet
  // 3. styles.css (global styles, compiled from src/styles.scss)
  const globalStyles = document.styleSheets[2];
  if (globalStyles?.href !== `${document.baseURI}styles.css`) {
    throw new Error('styles.css not found');
  }
  return globalStyles;
}

export function addRule(css: string): number {
  return getGlobalStyles().insertRule(css);
}

export function removeRule(index: number | undefined): void {
  if (index === undefined) return;
  setTimeout(() => getGlobalStyles().deleteRule(index), 1);
}
