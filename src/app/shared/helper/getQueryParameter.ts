export function getQueryParameter(parameter: string): string | void {
  const query = location.hash.split('?')[1];
  if (!query) return;
  const parameters = query.split('&');
  for (let i = 0; i < parameters.length; i++) {
    const pair = parameters[i].split('=');
    if (decodeURIComponent(pair[0]) === parameter) {
      return decodeURIComponent(pair[1]);
    }
  }
}
