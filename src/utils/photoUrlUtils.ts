const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
];

export function extractGoogleDriveFileId(url: string): string | null {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Converte links do Google Drive para URL embutível em <img> e PDF.
 * Links uc?export=view e /file/d/... bloqueiam embed; thumbnail redireciona para googleusercontent.
 */
export function resolveEmbeddablePhotoUrl(url: string | null | undefined): string {
  if (!url) return '';

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return url;
}
