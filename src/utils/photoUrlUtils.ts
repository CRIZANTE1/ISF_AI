import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { logger } from './logger';

const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
];

const SUPABASE_STORAGE_PATH_PATTERN =
  /\/storage\/v1\/object\/(?:public|authenticated|sign\/[^/]+)\/([^/]+)\/(.+)$/;

export interface SupabaseStorageRef {
  bucket: string;
  path: string;
}

/**
 * Extrai bucket e path de URLs do Supabase Storage (public, authenticated ou signed).
 */
export function parseSupabaseStorageUrl(url: string): SupabaseStorageRef | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(SUPABASE_STORAGE_PATH_PATTERN);
    if (!match?.[1] || !match?.[2]) return null;

    return {
      bucket: decodeURIComponent(match[1]),
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function toAuthenticatedStorageUrl(url: string): string {
  return url.replace('/storage/v1/object/public/', '/storage/v1/object/authenticated/');
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function buildSupabaseFetchHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('../lib/supabase');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token ?? anonKey;
  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  };
}

async function downloadSupabaseStorageBlob(url: string): Promise<Blob | null> {
  const storageRef = parseSupabaseStorageUrl(url);
  if (!storageRef) return null;

  const { supabase } = await import('../lib/supabase');
  const { data, error } = await supabase.storage
    .from(storageRef.bucket)
    .download(storageRef.path);

  if (error || !data) {
    logger.warn('Download via SDK Supabase falhou', 'photo', {
      bucket: storageRef.bucket,
      path: storageRef.path,
      error,
    });
    return null;
  }

  return data;
}

async function fetchBlobViaHttp(url: string, headers?: Record<string, string>): Promise<Blob | null> {
  const response = await fetch(url, {
    headers,
    redirect: 'follow',
  });

  if (!response.ok) return null;

  const blob = await response.blob();
  if (!blob.size) return null;
  return blob;
}

async function fetchBlobViaCapacitorHttp(
  url: string,
  headers?: Record<string, string>
): Promise<Blob | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const response = await CapacitorHttp.get({
      url,
      headers,
      responseType: 'blob',
    });

    if (response.status < 200 || response.status >= 300) return null;

    const mimeType =
      (response.headers?.['content-type'] as string | undefined)?.split(';')[0]?.trim() ||
      'application/octet-stream';

    if (typeof response.data === 'string' && response.data.length > 0) {
      return base64ToBlob(response.data, mimeType);
    }

    return null;
  } catch (error) {
    logger.warn('CapacitorHttp falhou ao buscar foto', 'photo', { url, error });
    return null;
  }
}

/**
 * Baixa o blob de uma foto para embed em PDF (<img> / jsPDF).
 * Ordem: SDK Supabase → fetch autenticado → fetch público → CapacitorHttp (Android/iOS).
 */
export async function fetchPhotoBlobForEmbed(url: string): Promise<Blob | null> {
  const embeddableUrl = resolveEmbeddablePhotoUrl(url);
  if (!embeddableUrl) return null;

  const storageRef = parseSupabaseStorageUrl(embeddableUrl);
  const headers = storageRef ? await buildSupabaseFetchHeaders() : undefined;

  if (storageRef) {
    const sdkBlob = await downloadSupabaseStorageBlob(embeddableUrl);
    if (sdkBlob) return sdkBlob;

    const authenticatedUrl = toAuthenticatedStorageUrl(embeddableUrl);
    const authedBlob = await fetchBlobViaHttp(authenticatedUrl, headers);
    if (authedBlob) return authedBlob;
  }

  const directBlob = await fetchBlobViaHttp(embeddableUrl, headers);
  if (directBlob) return directBlob;

  if (headers) {
    const publicBlob = await fetchBlobViaHttp(embeddableUrl);
    if (publicBlob) return publicBlob;
  }

  return fetchBlobViaCapacitorHttp(embeddableUrl, headers);
}

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
