export function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`megsy_cache_${key}`);
    if (!cached) return null;
    const { data, expiry } = JSON.parse(cached);
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(`megsy_cache_${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000) {
  try {
    localStorage.setItem(
      `megsy_cache_${key}`,
      JSON.stringify({ data, expiry: Date.now() + ttlMs })
    );
  } catch {
    /* storage full — silently fail */
  }
}

export function clearCache(key: string) {
  try {
    localStorage.removeItem(`megsy_cache_${key}`);
  } catch {
    /* silently fail */
  }
}
