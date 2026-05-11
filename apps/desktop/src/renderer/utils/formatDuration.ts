export function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) {
    return '0:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
