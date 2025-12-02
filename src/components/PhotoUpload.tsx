/**
 * Componente reutilizável para upload de fotos
 */

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Spinner } from './ui/spinner';
import { compressImage, getImageInfo } from '../utils/imageCompression';
import { logger } from '../utils/logger';

interface PhotoUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  required?: boolean;
  accept?: string;
}

const PhotoUpload = ({
  value,
  onChange,
  label = 'Foto de Evidência',
  required = false,
  accept = 'image/*',
}: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setIsCompressing(true);
    setOriginalSize(file.size);

    try {
      // Obtém informações da imagem
      const info = await getImageInfo(file);
      
      // Comprime a imagem (com suporte a AVIF e cache)
      const compressedBlob = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        format: 'avif', // Tenta AVIF primeiro, fallback para WebP
        maxSizeMB: 2,
        preferModernFormats: true,
      });

      setCompressedSize(compressedBlob.size);

      // Converte blob para File
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '.webp'),
        { type: compressedBlob.type }
      );

      onChange(compressedFile);

      // Cria preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      logger.error('Erro ao comprimir imagem', 'storage', error);
      // Em caso de erro, usa o arquivo original
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-status-error ml-1">*</span>}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {isCompressing ? (
        <div className="w-full h-48 rounded-lg border border-light-border dark:border-dark-border flex items-center justify-center" style={{ borderColor: '#2A2A2A' }}>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" color="white" />
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Comprimindo imagem...
            </p>
          </div>
        </div>
      ) : (preview || value) ? (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
            <img
              src={preview || (value ? URL.createObjectURL(value) : '')}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-status-error text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={16} color="#FFFFFF" />
            </button>
          </div>
          <div className="mt-1 flex justify-between items-center">
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {value?.name}
            </p>
            {originalSize && compressedSize && (
              <p className="text-xs" style={{ color: compressedSize < originalSize ? '#53D769' : '#B0B0B0' }}>
                {((1 - compressedSize / originalSize) * 100).toFixed(0)}% menor
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
          style={{ borderColor: '#2A2A2A' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}
        >
          <ImageIcon size={48} color="#B0B0B0" className="mb-2" />
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Clique para selecionar uma foto
          </p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            PNG, JPG ou JPEG até 5MB
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;

