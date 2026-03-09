export function estimateReadingTime(content = '') {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return minutes < 1 ? '< 1 min' : `~${minutes} min`;
}
