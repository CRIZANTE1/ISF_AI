/**
 * Componente reutilizável para upload de arquivos (fotos ou documentos)
 * Suporta captura direta pela câmera usando Capacitor Camera plugin
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, File, Camera } from 'lucide-react';
import { Spinner } from './ui/spinner';
import { compressImage, getImageInfo } from '../utils/imageCompression';
import { logger } from '../utils/logger';
import { Capacitor } from '@capacitor/core';
import InlineCamera from './InlineCamera';

interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

const FileUpload = ({
  value,
  onChange,
  label = 'Anexar Evidência',
  required = false,
  accept = 'image/*,application/pdf,.doc,.docx',
  maxSizeMB = 10,
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Restaura arquivo do sessionStorage se o app foi recarregado
  useEffect(() => {
    const storageKey = `fileUpload_${label}`;
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
  }, [label, onChange, value]);

  // Sincroniza preview quando value muda externamente (mas não durante compressão)
  useEffect(() => {
    if (isCompressing) return; // Não atualiza durante compressão
    
    if (value) {
      const fileIsImage = value.type.startsWith('image/');
      setIsImage(fileIsImage);
      
      if (fileIsImage && !preview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(value);
      } else if (!fileIsImage) {
        setPreview(null);
      }
      
      if (!originalSize) {
        setOriginalSize(value.size);
      }
      
      // Limpa o sessionStorage quando um novo arquivo é definido
      sessionStorage.removeItem(`fileUpload_${label}`);
    } else if (!isCompressing) {
      setPreview(null);
      setOriginalSize(null);
      setCompressedSize(null);
      setIsImage(false);
      // Limpa o sessionStorage quando o arquivo é removido
      sessionStorage.removeItem(`fileUpload_${label}`);
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
      sessionStorage.setItem(`fileUpload_${label}`, JSON.stringify(fileData));
    };
    reader.readAsDataURL(file);

    // Verifica tamanho do arquivo
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      sessionStorage.removeItem(`fileUpload_${label}`);
      return;
    }

    const fileIsImage = file.type.startsWith('image/');
    setIsImage(fileIsImage);
    
    // Chama onChange imediatamente para preservar o estado
    onChange(file);

    if (fileIsImage) {
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
          format: 'avif',
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
    } else {
      // Para arquivos não-imagem, apenas define o arquivo
      onChange(file);
      setPreview(null);
      setOriginalSize(file.size);
      setCompressedSize(null);
    }
    
    // Reset input após processamento para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setIsImage(false);
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
    
    // Verifica tamanho do arquivo
    if (capturedFile.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    // Processa a imagem capturada
    setIsImage(true);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      <label className="block text-sm font-medium mb-2 text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {isCompressing ? (
        <div className="w-full h-48 rounded-lg border border-[#2A2A2A] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" color="white" />
            <p className="text-xs text-[#8E8E93]">
              Comprimindo imagem...
            </p>
          </div>
        </div>
      ) : (preview || value) ? (
        <div className="relative">
          {isImage && preview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-[#2A2A2A]">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} color="#FFFFFF" />
              </button>
            </div>
          ) : (
            <div className="w-full p-4 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] flex items-center gap-3">
              <File size={32} color="#8E8E93" />
              <div className="flex-1">
                <p className="text-sm text-white">{value?.name}</p>
                {originalSize && (
                  <p className="text-xs text-[#8E8E93]">{formatFileSize(originalSize)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 text-red-500 hover:text-red-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
          {originalSize && compressedSize && isImage && (
            <div className="mt-1 flex justify-between items-center">
              <p className="text-xs text-[#8E8E93]">
                {value?.name}
              </p>
              <p className="text-xs" style={{ color: compressedSize < originalSize ? '#53D769' : '#B0B0B0' }}>
                {((1 - compressedSize / originalSize) * 100).toFixed(0)}% menor
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onClick={handleClick}
            className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors border-[#2A2A2A] hover:border-white"
          >
            <ImageIcon size={32} color="#8E8E93" className="mb-2" />
            <p className="text-sm text-[#8E8E93]">
              Selecionar da galeria ou anexar documento
            </p>
            <p className="text-xs text-[#8E8E93] mt-1">
              PNG, JPG, PDF ou DOC até {maxSizeMB}MB
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

export default FileUpload;

