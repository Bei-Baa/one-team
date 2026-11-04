/**
 * Image URL normalization and avatar fallback helpers.
 * Handles legacy `/src/assets/images/...` paths in user/mock data,
 * converts them to valid public production assets `/assets/images/...`,
 * and generates SVG initials fallbacks when images are unavailable.
 */

/**
 * Normalizes an image or avatar URL.
 * Converts legacy development `/src/assets/images/...` paths to `/assets/images/...`.
 * Leaves valid URLs (http/https, data:, blob:, /assets/...) untouched.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Fix legacy /src/assets/images/ or src/assets/images/ paths
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/assets/images/');
  }
  if (trimmed.startsWith('src/assets/images/')) {
    return trimmed.replace('src/assets/images/', '/assets/images/');
  }

  // Handle /src/assets/ general static references if any
  if (trimmed.startsWith('/src/assets/')) {
    return trimmed.replace('/src/assets/', '/assets/');
  }
  if (trimmed.startsWith('src/assets/')) {
    return trimmed.replace('src/assets/', '/assets/');
  }

  return trimmed;
}

/**
 * Extracts initials from a user's full name (up to 2 characters).
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates an SVG Data URI avatar with user initials.
 * Safe fallback for missing images or offline states.
 */
export function generateInitialsAvatarSvg(name: string, bgColor = '#2563EB', textColor = '#FFFFFF'): string {
  const initials = getInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="${bgColor}" rx="50"/>
  <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="600" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
