export function minutesToFutureTimestamp(milliseconds: number): number {
  const currentTime = new Date().getTime();
  const futureTime = currentTime + milliseconds;
  return Math.round(futureTime / 1000);
}
