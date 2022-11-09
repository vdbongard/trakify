export function setTimeoutMin(callback: Function, timeStart: Date, minDurationMs: number): void {
  const duration = new Date().getTime() - timeStart.getTime();
  if (duration >= minDurationMs) {
    callback();
  } else {
    setTimeout(callback, minDurationMs - duration);
  }
}
