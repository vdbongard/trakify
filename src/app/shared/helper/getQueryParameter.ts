export function getQueryParameter(parameter: string): string | void {
  const query = window.location.search.substring(1);
  const parameters = query.split('&');
  for (let i = 0; i < parameters.length; i++) {
    const pair = parameters[i].split('=');
    if (decodeURIComponent(pair[0]) === parameter) {
      return decodeURIComponent(pair[1]);
    }
  }
}
