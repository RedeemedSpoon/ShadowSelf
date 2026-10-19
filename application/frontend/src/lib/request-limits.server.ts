export function createRequestLimiter(now = Date.now) {
  const windows = new Map<string, {count: number; expiresAt: number}>();
  let nextCleanup = 0;

  return (address: string, sensitive: boolean, onion = false) => {
    const current = now();

    if (current >= nextCleanup) {
      for (const [key, entry] of windows) {
        if (entry.expiresAt <= current) {
          windows.delete(key);
        }
      }

      nextCleanup = current + 1000;
    }

    const key = `${onion ? 'onion' : 'client'}:${sensitive ? 'auth' : 'request'}:${address}`;
    const maximum = onion ? (sensitive ? 600 : 6000) : sensitive ? 30 : 240;
    const previous = windows.get(key);
    const entry = previous && previous.expiresAt > current ? previous : {count: 0, expiresAt: current + 60_000};

    if (entry.count >= maximum || (!windows.has(key) && windows.size >= 10_000)) {
      return false;
    }

    entry.count++;
    windows.set(key, entry);

    return true;
  };
}
