export function sum(array: number[]): number {
  return array.reduce((a, b) => a + b, 0);
}

export function sumBoolean(array: boolean[]): number {
  return array.reduce((a, b) => (b ? a + 1 : a), 0);
}
