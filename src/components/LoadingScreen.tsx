import { Spinner } from './ui/spinner';
import { useTranslation } from '../hooks/useTranslation';
import { cn } from '../utils/cn';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'slate' | 'blue' | 'red' | 'green' | 'white';
  className?: string;
}

/**
 * Componente padronizado para telas de carregamento
 * 
 * @param message - Mensagem personalizada (opcional, usa tradução padrão se não fornecido)
 * @param fullScreen - Se true, ocupa toda a tela
 * @param size - Tamanho do spinner (sm, md, lg, xl)
 * @param color - Cor do spinner (slate, blue, red, green, white)
 * @param className - Classes CSS adicionais
 */
export const LoadingScreen = ({
  message,
  fullScreen = false,
  size = 'lg',
  color = 'white',
  className,
}: LoadingScreenProps) => {
  const { t } = useTranslation();
  const loadingMessage = message || t('common.loading');

  if (fullScreen) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          'bg-black',
          className
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <Spinner size={size} color={color} />
          <p className="text-white/60 text-sm">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'bg-black/50',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} color={color} />
        {loadingMessage && (
          <p className="text-white/60 text-sm">{loadingMessage}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;

