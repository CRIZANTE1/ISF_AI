import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import PageHeader from '../components/PageHeader';
import { parseQrCodeData } from '../utils/qrInspectionUtils';
import { getExtinguisherById } from '../utils/extinguisherOperations';
import { QrCode, Camera, Search, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';

type QrStep = 'start' | 'scan' | 'manual' | 'found' | 'not_found';

const QrInspectionPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  
  const [step, setStep] = useState<QrStep>('start');
  const [manualInput, setManualInput] = useState('');
  const [parsedId, setParsedId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          setScanning(false);
          setScanStatus('');
        })
        .catch((err) => {
          logger.error('Erro ao parar scanner', 'qr_generator', err);
          scannerRef.current = null;
          setScanning(false);
        });
    }
  }, []);

  const handleQrCodeDetected = useCallback(async (decodedText: string) => {
    // Para o scanner imediatamente para evitar múltiplas leituras
    stopScanner();
    
    setLoading(true);
    setScanStatus('QR Code detectado! Processando...');

    try {
      // Faz o parsing do QR code
      const extractedId = parseQrCodeData(decodedText);
      
      if (!extractedId) {
        handleError(new Error('ID inválido'), 'validation', 'Não foi possível extrair o ID do QR Code');
        setLoading(false);
        setStep('manual'); // Vai para modo manual para tentar novamente
        return;
      }
      
      setParsedId(extractedId);

      // Busca o extintor
      const extData = await getExtinguisherById(extractedId);
      
      if (extData) {
        setEquipment(extData);
        setStep('found');
      } else {
        setStep('not_found');
      }
    } catch (err: any) {
      // Se o erro for porque não encontrou (erro 406 ou similar), apenas mostra not_found
      if (err.code === 'PGRST116' || err.message?.includes('No rows')) {
        setStep('not_found');
      } else {
        handleError(err, 'equipment', 'Erro ao buscar equipamento');
        setStep('not_found');
      }
    } finally {
      setLoading(false);
      setScanStatus('');
    }
  }, [stopScanner, handleError, type]);

  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;

    try {
      setScanning(true);
      setCameraError(null);
      setScanStatus('Iniciando câmera...');

      const scanner = new Html5Qrcode('qr-reader', {
        verbose: false,
      });

      scannerRef.current = scanner;

      // Configurações otimizadas para mobile
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scanner.start(
        { facingMode: 'environment' }, // Câmera traseira no mobile
        config,
        (decodedText, result) => {
          // QR Code detectado!
          handleQrCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Ignora erros de leitura (normal durante a busca)
          // Apenas atualiza o status se for um erro crítico
          if (!errorMessage.includes('NotFoundException')) {
            // Não atualiza status para erros normais de "não encontrado"
            return;
          }
        }
      );

      setScanStatus('Câmera ativa - Aponte para o QR Code');
    } catch (err: any) {
      logger.error('Erro ao iniciar scanner', 'qr_generator', err);
      setScanning(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setCameraError('Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do dispositivo.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('camera')) {
        setCameraError('Câmera não encontrada. Verifique se o dispositivo possui uma câmera disponível.');
      } else {
        setCameraError('Erro ao acessar a câmera. Tente novamente ou use a opção de digitar manualmente.');
      }
    }
  }, [handleQrCodeDetected]);

  // Inicializar scanner quando entrar no modo scan
  useEffect(() => {
    if (step === 'scan' && !scannerRef.current) {
      startScanner();
    } else if (step !== 'scan' && scannerRef.current) {
      stopScanner();
    }

    // Cleanup ao desmontar
    return () => {
      stopScanner();
    };
  }, [step, startScanner, stopScanner]);

  const handleManualSearch = async () => {
    if (!manualInput.trim()) {
      handleError(new Error('Digite ou escaneie um ID'), 'validation', 'Campo obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Faz o parsing do QR code
      const extractedId = parseQrCodeData(manualInput.trim());
      
      if (!extractedId) {
        handleError(new Error('ID inválido'), 'validation', 'Não foi possível extrair o ID do QR Code');
        setLoading(false);
        return;
      }
      
      setParsedId(extractedId);

      // Busca o extintor
      const extData = await getExtinguisherById(extractedId);
      
      if (extData) {
        setEquipment(extData);
        setStep('found');
      } else {
        setStep('not_found');
      }
    } catch (err: any) {
      // Se o erro for porque não encontrou (erro 406 ou similar), apenas mostra not_found
      if (err.code === 'PGRST116' || err.message?.includes('No rows')) {
        setStep('not_found');
      } else {
        handleError(err, 'equipment', 'Erro ao buscar equipamento');
        setStep('not_found');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = () => {
    if (parsedId && type) {
      navigate(`/equipment/${type}/${parsedId}/inspections/new`);
    }
  };

  const handleReset = () => {
    stopScanner();
    setStep('start');
    setManualInput('');
    setParsedId(null);
    setEquipment(null);
    setCameraError(null);
    setScanStatus('');
  };

  // Renderização baseada no step
  if (step === 'start') {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
        <PageHeader title="Inspeção por QR Code" />
        <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-6">
                <div className="p-6 rounded-full bg-light-surface dark:bg-dark-surface" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)' }}>
                  <QrCode size={64} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
                Inspeção Rápida
              </h2>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8" style={{ color: '#B0B0B0' }}>
                Escaneie o QR Code do extintor ou digite o número do cilindro
              </p>
            </motion.div>

            <div className="space-y-4">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setStep('scan')}
                className="w-full p-6 rounded-lg border-2 border-dashed flex items-center justify-center space-x-3 hover:border-white/50 transition-colors"
                style={{ 
                  backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                  borderColor: '#2A2A2A',
                  color: '#FFFFFF'
                }}
              >
                <Camera size={24} />
                <span className="font-semibold">Escanear QR Code</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setStep('manual')}
                className="w-full p-6 rounded-lg border-2 border-dashed flex items-center justify-center space-x-3 hover:border-white/50 transition-colors"
                style={{ 
                  backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                  borderColor: '#2A2A2A',
                  color: '#FFFFFF'
                }}
              >
                <Search size={24} />
                <span className="font-semibold">Digitar Manualmente</span>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}
            >
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#B0B0B0' }}>
                <strong>Dica:</strong> O QR Code pode estar no formato industrial (ex: 2#7036#EXT#008851#47#31) 
                ou formato simples. O sistema extrairá automaticamente o número do cilindro.
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
        <PageHeader title="Escanear QR Code" />
        <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
          <div className="space-y-4">
            <p className="text-center text-light-text-secondary dark:text-dark-text-secondary mb-4" style={{ color: '#B0B0B0' }}>
              Aponte a câmera para o QR Code do extintor
            </p>
            
            {/* Scanner de QR Code */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2" style={{ borderColor: '#2A2A2A' }}>
              <div 
                id="qr-reader" 
                ref={scannerContainerRef}
                className="w-full h-full"
                style={{ minHeight: '300px' }}
              />
              
              {/* Overlay de status */}
              {scanStatus && (
                <div className="absolute bottom-4 left-0 right-0 px-4">
                  <div className="bg-black/70 rounded-lg px-4 py-2 text-center">
                    <p className="text-sm text-white">{scanStatus}</p>
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-white" size={32} />
                    <p className="text-sm text-white">Processando QR Code...</p>
                  </div>
                </div>
              )}

              {/* Erro de câmera */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4">
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <p className="text-sm text-white mb-4">{cameraError}</p>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        startScanner();
                      }}
                      className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center" style={{ color: '#B0B0B0' }}>
                <strong>Dica:</strong> Mantenha o QR Code dentro da área de leitura e aguarde a detecção automática.
              </p>
            </div>

            {/* Opção alternativa: digitar manualmente */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#2A2A2A' }}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ backgroundColor: '#000000', color: '#B0B0B0' }}>ou</span>
                </div>
              </div>
              
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="Digite o QR Code aqui"
                className="w-full p-4 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                style={{ 
                  backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                  borderColor: '#2A2A2A',
                  color: '#FFFFFF'
                }}
              />
              <button
                onClick={handleManualSearch}
                disabled={loading || !manualInput.trim()}
                className="w-full p-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
              >
                {loading ? 'Buscando...' : 'Buscar Manualmente'}
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full p-4 rounded-lg border flex items-center justify-center space-x-2"
              style={{ 
                backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                borderColor: '#2A2A2A',
                color: '#FFFFFF'
              }}
            >
              <X size={20} />
              <span>Cancelar</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'manual') {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
        <PageHeader title="Digitar ID" />
        <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                ID do Equipamento ou QR Code
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="Ex: 2#7036#EXT#008851#47#31 ou 8851"
                className="w-full p-4 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                style={{ 
                  backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                  borderColor: '#2A2A2A',
                  color: '#FFFFFF'
                }}
                autoFocus
              />
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2" style={{ color: '#B0B0B0' }}>
                Digite o QR Code completo ou apenas o número do cilindro
              </p>
            </div>

            <button
              onClick={handleManualSearch}
              disabled={loading || !manualInput.trim()}
              className="w-full p-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
            >
              {loading ? 'Buscando...' : 'Buscar Equipamento'}
            </button>

            <button
              onClick={handleReset}
              className="w-full p-4 rounded-lg border flex items-center justify-center space-x-2"
              style={{ 
                backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                borderColor: '#2A2A2A',
                color: '#FFFFFF'
              }}
            >
              <X size={20} />
              <span>Voltar</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'found' && equipment) {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
        <PageHeader title="Equipamento Encontrado" />
        <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-full bg-green-500/20">
                <CheckCircle2 size={64} className="text-green-500" />
              </div>
            </div>

            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
                Extintor {parsedId}
              </h3>
              
              <div className="space-y-2 text-sm">
                {equipment.tipo_agente && (
                  <div className="flex justify-between">
                    <span style={{ color: '#B0B0B0' }}>Tipo:</span>
                    <span style={{ color: '#FFFFFF' }}>{equipment.tipo_agente}</span>
                  </div>
                )}
                {equipment.capacidade && (
                  <div className="flex justify-between">
                    <span style={{ color: '#B0B0B0' }}>Capacidade:</span>
                    <span style={{ color: '#FFFFFF' }}>{equipment.capacidade}L</span>
                  </div>
                )}
                {equipment.localizacao && (
                  <div className="flex justify-between">
                    <span style={{ color: '#B0B0B0' }}>Localização:</span>
                    <span style={{ color: '#FFFFFF' }}>{equipment.localizacao}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleStartInspection}
              className="w-full p-4 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
            >
              Iniciar Inspeção
            </button>

            <button
              onClick={handleReset}
              className="w-full p-4 rounded-lg border flex items-center justify-center space-x-2"
              style={{ 
                backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                borderColor: '#2A2A2A',
                color: '#FFFFFF'
              }}
            >
              <X size={20} />
              <span>Escanear Outro</span>
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (step === 'not_found') {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
        <PageHeader title="Equipamento Não Encontrado" />
        <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-full bg-red-500/20">
                <AlertCircle size={64} className="text-red-500" />
              </div>
            </div>

            <div className="p-6 rounded-lg border text-center" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
                Equipamento não encontrado
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4" style={{ color: '#B0B0B0' }}>
                Nenhum extintor encontrado com o ID: <strong>{parsedId}</strong>
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#B0B0B0' }}>
                Verifique se o número está correto ou cadastre o equipamento primeiro.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleReset}
                className="w-full p-4 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
              >
                Tentar Novamente
              </button>
              
              {type && (
                <button
                  onClick={() => navigate(`/inspections/${type}/new`)}
                  className="w-full p-4 rounded-lg border flex items-center justify-center space-x-2"
                  style={{ 
                    backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                    borderColor: '#2A2A2A',
                    color: '#FFFFFF'
                  }}
                >
                  <span>Cadastrar Novo Equipamento</span>
                </button>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return null;
};

export default QrInspectionPage;

