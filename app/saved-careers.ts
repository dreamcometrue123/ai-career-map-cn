const key = 'ai-career-saved';
const eventName = 'career-bookmarks-changed';
let fallback = '[]';
let storageFailed = false;
export function savedSnapshot() {
  if (storageFailed) return fallback;
  try { return localStorage.getItem(key) || '[]'; }
  catch { return fallback; }
}
export const serverSnapshot = () => '[]';
export function subscribeSaved(notify: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) notify(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(eventName, notify);
  return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(eventName, notify); };
}
export function writeSaved(ids: number[]) {
  fallback = JSON.stringify(ids);
  try { localStorage.setItem(key, fallback); storageFailed = false; }
  catch { storageFailed = true; }
  window.dispatchEvent(new Event(eventName));
  return !storageFailed;
}
