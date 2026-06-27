/**
 * Componente de imagem com progressive loading (blur-up)
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
import LazyImage from './LazyImage';
import { ImageSkeleton } from './skeletons';
import { resolveEmbeddablePhotoUrl } from '../utils/photoUrlUtils';

interface ProgressiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  placeholder?: string;
  thumbnail?: string;
  blurDataURL?: string; // Base64 de uma versão muito pequena e borrada
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Cria uma versão borrada de uma imagem (para blur-up effect)
 */
async function createBlurDataURL(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Cria uma versão muito pequena (20px) para o blur
        const size = 20;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        // Aplica blur usando CSS filter (simulado)
        const dataURL = canvas.toDataURL('image/jpeg', 0.1);
        resolve(dataURL);
      } catch (error) {
        // Se falhar (CORS, etc), retorna um placeholder simples
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMUEwQTE5Ii8+PC9zdmc+');
      }
    };
    img.onerror = () => {
      // Se falhar ao carregar, retorna um placeholder
      resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMUEwQTE5Ii8+PC9zdmc+');
    };
    img.src = src;
  });
}

const ProgressiveImage = ({
  src,
  alt,
  placeholder,
  thumbnail,
  blurDataURL,
  onError,
  onLoad,
  className = '',
  ...props
}: ProgressiveImageProps) => {
  const embeddableSrc = resolveEmbeddablePhotoUrl(src);
  const embeddableThumbnail = thumbnail ? resolveEmbeddablePhotoUrl(thumbnail) : undefined;
  const [blurSrc, setBlurSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Se não há blurDataURL fornecido, tenta criar um
    if (!blurDataURL && !blurSrc && (embeddableThumbnail || embeddableSrc)) {
      const source = embeddableThumbnail || embeddableSrc;
      createBlurDataURL(source)
        .then(setBlurSrc)
        .catch(() => {
          if (embeddableThumbnail) setBlurSrc(embeddableThumbnail);
        });
    } else if (blurDataURL) {
      setBlurSrc(blurDataURL);
    } else if (embeddableThumbnail) {
      setBlurSrc(embeddableThumbnail);
    }
  }, [blurDataURL, embeddableThumbnail, embeddableSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ position: 'relative' }}>
      {/* Imagem borrada de fundo (blur-up) */}
      {blurSrc && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${blurSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // Evita bordas brancas no blur
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}

      {/* Placeholder enquanto carrega */}
      {!blurSrc && !isLoaded && !hasError && placeholder && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          <ImageSkeleton className="h-full w-full" />
        </div>
      )}

      {/* Imagem principal */}
      <LazyImage
        src={embeddableSrc}
        alt={alt}
        placeholder={embeddableThumbnail || blurSrc || placeholder}
        onLoad={handleLoad}
        onError={handleError}
        className={`relative transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 1 }}
        {...props}
      />
    </div>
  );
};

export default ProgressiveImage;

