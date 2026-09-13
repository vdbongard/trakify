export function getTraktSlug(value: string): string {
  return value
    .normalize('NFD') // Split accented letters, e.g. é -> e + combining accent
    .replace(/[\u0300-\u036f]/g, '') // Remove combining accents, e.g. e + accent -> e
    .toLowerCase() // Trakt slugs are lowercase
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces/punctuation runs with a hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens
}
