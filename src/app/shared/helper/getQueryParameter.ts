export function getQueryParameter(searchParameter: string): string | void {
  const query = window.location.hash.split('?')[1];
  if (!query) return;
  const parameters = query.split('&');
  for (const parameter of parameters) {
    const pair = parameter.split('=');
    if (decodeURIComponent(pair[0]) === searchParameter) {
      return decodeURIComponent(pair[1]);
    }
  }
}
