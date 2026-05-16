export function formatDateShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTimeAgo(isoOrDate: string | Date) {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const diff = Date.now() - date.getTime();
  const min = Math.max(0, Math.round(diff / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

