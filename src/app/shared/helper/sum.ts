export function sum(array: number[] | undefined): number {
  return array?.reduce((a, b) => a + b, 0) ?? 0;
}
