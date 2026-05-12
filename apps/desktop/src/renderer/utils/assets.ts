export const DEFAULT_COVER_URL = './assets/covers/poster.png';

export function resolveAssetUrl(url: string | null | undefined, fallback = DEFAULT_COVER_URL) {
  if (!url) {
    return fallback;
  }

  if (url.startsWith('/assets/')) {
    return `.${url}`;
  }

  return url;
}

export function resolveLocalFileUrl(url: string | null | undefined) {
  if (!url?.startsWith('file:///')) {
    return url ?? null;
  }

  return `music-local:///${encodeURIComponent(url.replace('file:///', ''))}`;
}
