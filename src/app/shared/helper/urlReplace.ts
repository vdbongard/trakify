export function urlReplace(url: string, args: unknown[]): string {
  let urlReplaced = url;

  args.forEach((arg) => {
    urlReplaced = urlReplaced.replace('%', arg as string);
  });

  urlReplaced = urlReplaced.replaceAll('%', '');

  return urlReplaced;
}
