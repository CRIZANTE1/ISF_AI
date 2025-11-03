/**
 * Componente reutilizável para upload de fotos
 */

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      onChange(file);
      // Cria preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
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

      {preview || value ? (
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
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            {value?.name}
          </p>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
          style={{ borderColor: '#2A2A2A' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00C8FF'}
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

