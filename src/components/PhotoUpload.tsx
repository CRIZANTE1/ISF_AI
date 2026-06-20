/**
 * Componente reutilizável para upload de fotos
 * Suporta captura direta pela câmera usando Capacitor Camera plugin
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { ImageSkeleton } from './skeletons';
import { compressImage, getImageInfo } from '../utils/imageCompression';
import { logger } from '../utils/logger';
import { Capacitor } from '@capacitor/core';
import InlineCamera from './InlineCamera';

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
  const [showCamera, setShowCamera] = useState(false);

  // Restaura arquivo do sessionStorage se o app foi recarregado
  useEffect(() => {
    const storageKey = `photoUpload_${label}`;
    const savedFileData = sessionStorage.getItem(storageKey);
    
    if (savedFileData && !value) {
      try {
        const fileData = JSON.parse(savedFileData);
        // Verifica se o arquivo foi salvo há menos de 5 minutos
        if (Date.now() - fileData.timestamp < 5 * 60 * 1000) {
          // Converte base64 de volta para File
          const byteString = atob(fileData.data.split(',')[1]);
          const mimeString = fileData.data.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const restoredFile = new File([blob], fileData.name, { type: fileData.type });
          
          // Restaura o arquivo
          onChange(restoredFile);
        } else {
          // Remove arquivo antigo
          sessionStorage.removeItem(storageKey);
        }
      } catch (error) {
        logger.error('Erro ao restaurar arquivo do sessionStorage', 'storage', error);
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [label, value, onChange]);

  // Sincroniza preview quando value muda externamente (mas não durante compressão)
  useEffect(() => {
    if (isCompressing) return; // Não atualiza durante compressão
    
    if (value && !preview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else if (!value && !isCompressing) {
      setPreview(null);
      setOriginalSize(null);
      setCompressedSize(null);
      // Limpa o sessionStorage quando o arquivo é removido
      sessionStorage.removeItem(`photoUpload_${label}`);
    } else if (value) {
      // Limpa o sessionStorage quando um novo arquivo é definido
      sessionStorage.removeItem(`photoUpload_${label}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isCompressing]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      // Reset input se nenhum arquivo foi selecionado
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Salva o arquivo imediatamente no estado para preservar mesmo se o app recarregar
    // Converte para base64 e salva no sessionStorage como backup
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`photoUpload_${label}`, JSON.stringify(fileData));
    };
    reader.readAsDataURL(file);

    setIsCompressing(true);
    setOriginalSize(file.size);
    
    // Chama onChange imediatamente para preservar o estado
    onChange(file);

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
    } finally {
      // Reset input após processamento para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleTakePhoto = () => {
    // Usa câmera inline que não sai do app
    setShowCamera(true);
  };

  const handleCameraCapture = async (capturedFile: File) => {
    setShowCamera(false);
    
    // Processa a imagem capturada
    setIsCompressing(true);
    setOriginalSize(capturedFile.size);
    
    // Chama onChange imediatamente com o arquivo original
    onChange(capturedFile);

    // Processa a imagem (comprime) em background
    try {
      const info = await getImageInfo(capturedFile);
      const compressedBlob = await compressImage(capturedFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        format: 'avif',
        maxSizeMB: 2,
        preferModernFormats: true,
      });

      setCompressedSize(compressedBlob.size);

      const compressedFile = new File(
        [compressedBlob],
        capturedFile.name.replace(/\.[^/.]+$/, '.webp'),
        { type: compressedBlob.type }
      );

      // Atualiza com arquivo comprimido
      onChange(compressedFile);

      // Cria preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      logger.error('Erro ao comprimir imagem da câmera', 'storage', error);
      // Em caso de erro, mantém o arquivo original que já foi definido
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(capturedFile);
    }
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  return (
    <>
      {showCamera && (
        <InlineCamera
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
        />
      )}
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
        <div className="w-full h-48 rounded-lg border border-light-border dark:border-dark-border overflow-hidden" style={{ borderColor: '#2A2A2A' }}>
          <ImageSkeleton className="h-full w-full rounded-lg" />
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
        <div className="space-y-3">
          <div
            onClick={handleClick}
            className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: '#2A2A2A' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}
          >
            <ImageIcon size={32} color="#B0B0B0" className="mb-2" />
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Selecionar da galeria
            </p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
              PNG, JPG ou JPEG até 5MB
            </p>
          </div>
          <button
            type="button"
            onClick={handleTakePhoto}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
            style={{ backgroundColor: '#157EFB', color: '#FFFFFF' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0D6EFD'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#157EFB'}
          >
            <Camera size={20} />
            <span>Tirar foto com a câmera</span>
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default PhotoUpload;

