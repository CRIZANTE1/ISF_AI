/**
 * Componente de câmera inline que não sai do app
 * Usa getUserMedia para captura direta sem abrir app nativo
 */

import { useState, useRef, useEffect } from 'react';
import { X, SwitchCamera } from 'lucide-react';
import { Spinner } from './ui/spinner';
import { logger } from '../utils/logger';
import { useHaptics } from '../hooks/useHaptics';

interface InlineCameraProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const InlineCamera = ({ onCapture, onCancel }: InlineCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const haptics = useHaptics();

  // Esconde o BottomNav quando a câmera está aberta e bloqueia scroll
  useEffect(() => {
    // Pequeno delay para garantir sincronia com a renderização
    setTimeout(() => window.dispatchEvent(new CustomEvent('camera-opened')), 50);
    
    // Trava o scroll da página enquanto a câmera está aberta
    document.body.style.overflow = 'hidden';

    return () => {
      window.dispatchEvent(new CustomEvent('camera-closed'));
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Lógica de inicialização da câmera
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      setIsLoading(true);
      setError(null);

      // Para qualquer stream anterior antes de iniciar um novo
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Nota: O play() é chamado automaticamente via onLoadedMetadata
        }
      } catch (err: any) {
        logger.error('Erro ao acessar câmera', 'camera', err);
        if (mounted) {
          setIsLoading(false);
          if (err.name === 'NotAllowedError') {
            setError('Permissão negada. Verifique as configurações do navegador.');
          } else {
            setError('Não foi possível iniciar a câmera.');
          }
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleVideoLoaded = () => {
    setIsLoading(false);
    videoRef.current?.play().catch(e => logger.warn("Autoplay bloqueado pelo navegador", e));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      haptics.light(); // Feedback tátil ao capturar foto
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Se for selfie (user), espelha a imagem para ficar natural
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `capture_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (err) {
      logger.error('Erro ao capturar', 'camera', err);
      setError('Erro ao processar imagem.');
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Tela de Erro
  if (error) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-6">
        <div className="bg-zinc-900 rounded-xl p-6 max-w-sm w-full border border-zinc-800 text-center">
          <p className="text-white mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-zinc-700 text-white rounded-lg font-medium"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => setFacingMode('environment')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização Principal
  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      style={{ zIndex: 99999 }} // Garante que fique acima de tudo
    >
      {/* Área do Vídeo */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-zinc-900/50 backdrop-blur-sm">
            <Spinner size="lg" color="white" />
            <p className="text-white font-medium">Iniciando câmera...</p>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          onLoadedMetadata={handleVideoLoaded}
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        
        <canvas ref={canvasRef} className="hidden" />

        {/* Grid (Regra dos terços) - Opcional, ajuda a ver que o vídeo está ativo */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
          <div className="w-full h-full border-2 border-white/20 relative">
             <div className="absolute top-1/3 left-0 w-full h-px bg-white/20"></div>
             <div className="absolute top-2/3 left-0 w-full h-px bg-white/20"></div>
             <div className="absolute left-1/3 top-0 h-full w-px bg-white/20"></div>
             <div className="absolute left-2/3 top-0 h-full w-px bg-white/20"></div>
          </div>
        </div>
      </div>

      {/* Controles da Câmera */}
      {/* pb-[env...] garante que não cole na barra de home do iPhone */}
      <div className="relative z-30 bg-black/90 backdrop-blur-md pt-6 pb-[env(safe-area-inset-bottom,24px)] px-6 border-t border-white/10">
        <div className="flex items-center justify-between max-w-md mx-auto mb-2">
          {/* Botão Cancelar */}
          <button
            type="button"
            onClick={onCancel}
            className="p-4 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition active:scale-95"
          >
            <X size={24} />
          </button>

          {/* Botão Capturar */}
          <button
            type="button"
            onClick={capturePhoto}
            disabled={isLoading}
            className={`
              relative w-20 h-20 rounded-full border-4 border-white 
              flex items-center justify-center
              transition-all duration-200
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:bg-white/10'}
            `}
          >
            <div className="w-16 h-16 bg-white rounded-full" />
          </button>

          {/* Botão Alternar Câmera */}
          <button
            type="button"
            onClick={switchCamera}
            disabled={isLoading}
            className="p-4 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition active:scale-95"
          >
            <SwitchCamera size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InlineCamera;


