export function setTimeoutMin(callback: () => void, timeStart: Date, minDurationMs: number): void {
  const duration = new Date().getTime() - timeStart.getTime();
  if (duration >= minDurationMs) {
    callback();
  } else {
    setTimeout(callback, minDurationMs - duration);
  }
}
