/**
 * Componente reutilizável para upload de arquivos (fotos ou documentos)
 */

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, File, Loader2 } from 'lucide-react';
import { compressImage, getImageInfo } from '../utils/imageCompression';
import { logger } from '../utils/logger';

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    // Verifica tamanho do arquivo
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    const fileIsImage = file.type.startsWith('image/');
    setIsImage(fileIsImage);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
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
            <Loader2 size={24} className="animate-spin text-white" />
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
        <div
          onClick={handleClick}
          className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors border-[#2A2A2A] hover:border-white"
        >
          <ImageIcon size={48} color="#8E8E93" className="mb-2" />
          <p className="text-sm text-[#8E8E93]">
            Clique para selecionar uma foto ou anexo
          </p>
          <p className="text-xs text-[#8E8E93] mt-1">
            PNG, JPG, PDF ou DOC até {maxSizeMB}MB
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

