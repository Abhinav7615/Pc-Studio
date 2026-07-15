export async function fetchWithRetry(input: RequestInfo, init?: RequestInit, retries = 2, backoff = 300): Promise<Response> {
  try {
    const res = await fetch(input, init);
    if (!res.ok && retries > 0 && (res.status === 404 || res.status === 500)) {
      // transient server compile/refresh issue — wait and retry
      console.warn(`[fetchWithRetry] transient ${res.status} for ${input}, retrying in ${backoff}ms (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(input, init, retries - 1, backoff * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[fetchWithRetry] network error for ${input}, retrying in ${backoff}ms (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(input, init, retries - 1, backoff * 2);
    }
    throw err;
  }
}

export default fetchWithRetry;
