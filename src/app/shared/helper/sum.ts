export function sum(array: number[] | undefined): number {
  if (!array) return 0;

  let total = 0;
  for (const value of array) {
    total += value;
  }
  return total;
}
