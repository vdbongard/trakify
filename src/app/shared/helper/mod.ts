export function mod(n: number | undefined, m: number | undefined): number {
  if (n === undefined || m === undefined) return 0;
  return ((n % m) + m) % m;
}
