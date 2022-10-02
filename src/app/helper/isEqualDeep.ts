export function isEqualDeep(a: unknown, b: unknown): boolean {
  let a2 = a;
  let b2 = b;
  if (Array.isArray(a) && Array.isArray(b)) {
    a2 = [...a].sort();
    b2 = [...b].sort();
  }
  return JSON.stringify(a2) === JSON.stringify(b2);
}
