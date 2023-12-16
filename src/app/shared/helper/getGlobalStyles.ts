export function getGlobalStyles(): CSSStyleSheet {
  // Global styles are added in the following order:
  // 1. Roboto font stylesheet
  // 2. Material icons stylesheet
  // 3. styles.css (global styles, compiled from src/styles.scss)
  const globalStyles = document.styleSheets[2];
  if (!globalStyles?.href?.endsWith('/styles.css')) {
    throw new Error('globalStyles not found');
  }
  return globalStyles;
}
