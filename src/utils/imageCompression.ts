/**
 * Utilitários para compressão e otimização de imagens
 */

import { getCachedImage, cacheImage } from './imageCache';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
  format?: 'jpeg' | 'webp' | 'avif' | 'png';
  maxSizeMB?: number; // Tamanho máximo em MB
  preferModernFormats?: boolean; // Tenta usar AVIF/WebP primeiro
}

const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'preferModernFormats'>> & { preferModernFormats: boolean } = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'webp',
  maxSizeMB: 2,
  preferModernFormats: true,
};

/**
 * Verifica se o navegador suporta WebP
 */
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Verifica se o navegador suporta AVIF
 */
let avifSupported: boolean | null = null;
let avifCheckPromise: Promise<boolean> | null = null;

export function supportsAVIF(): Promise<boolean> {
  if (avifSupported !== null) {
    return Promise.resolve(avifSupported);
  }

  if (avifCheckPromise) {
    return avifCheckPromise;
  }

  avifCheckPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      avifSupported = true;
      resolve(true);
    };
    img.onerror = () => {
      avifSupported = false;
      resolve(false);
    };
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });

  return avifCheckPromise;
}

/**
 * Redimensiona uma imagem mantendo a proporção
 */
function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = width * ratio;
    height = height * ratio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Converte um File para Blob comprimido
 * Usa cache quando disponível
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Verifica cache primeiro
  try {
    const cached = await getCachedImage(file);
    if (cached) {
      return cached;
    }
  } catch (error) {
    // Se o cache falhar, continua com a compressão normal
    console.warn('Erro ao verificar cache:', error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onload = async () => {
          try {
            // Redimensiona se necessário
            const { width, height } = resizeImage(img, opts.maxWidth, opts.maxHeight);

            // Cria canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Não foi possível criar contexto do canvas'));
              return;
            }

            // Desenha imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);

            // Determina o formato a usar (com suporte a AVIF)
            let mimeType = 'image/jpeg';
            let quality = opts.quality;

            // Determina o formato a usar
            // Nota: canvas.toBlob não suporta AVIF nativamente,
            // então usamos WebP como melhor alternativa quando AVIF é solicitado
            if (opts.preferModernFormats) {
              // Tenta WebP primeiro (melhor suporte)
              if (supportsWebP() && (opts.format === 'webp' || opts.format === 'avif')) {
                mimeType = 'image/webp';
              } else if (opts.format === 'png' || file.type === 'image/png') {
                mimeType = 'image/png';
                quality = undefined;
              }
            } else {
              // Comportamento original
              if (opts.format === 'webp' && supportsWebP()) {
                mimeType = 'image/webp';
              } else if (opts.format === 'avif') {
                // AVIF não é suportado nativamente pelo canvas, usa WebP como fallback
                if (supportsWebP()) {
                  mimeType = 'image/webp';
                }
              } else if (opts.format === 'png' || file.type === 'image/png') {
                mimeType = 'image/png';
                quality = undefined; // PNG não usa quality
              }
            }

            // Converte para blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Falha ao comprimir imagem'));
                  return;
                }

                // Verifica tamanho máximo
                const sizeMB = blob.size / (1024 * 1024);
                if (sizeMB > opts.maxSizeMB) {
                  // Tenta comprimir mais
                  const newQuality = Math.max(0.1, opts.quality - 0.2);
                  compressImage(file, { ...opts, quality: newQuality })
                    .then(async (compressedBlob) => {
                      // Salva no cache
                      try {
                        await cacheImage(file, compressedBlob);
                      } catch (error) {
                        // Não falha se o cache não funcionar
                        console.warn('Erro ao salvar no cache:', error);
                      }
                      resolve(compressedBlob);
                    })
                    .catch(reject);
                } else {
                  // Salva no cache
                  cacheImage(file, blob).catch(() => {
                    // Não falha se o cache não funcionar
                  });
                  resolve(blob);
                }
              },
              mimeType,
              quality
            );
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Cria um thumbnail de uma imagem
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg',
  });
}

/**
 * Obtém informações sobre uma imagem
 */
export function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
        });
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converte Blob para File
 */
export function blobToFile(blob: Blob, fileName: string, mimeType: string): File {
  return new File([blob], fileName, { type: mimeType });
}

