import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import PageHeader from '../components/PageHeader';
import { buildIndustrialQrString, type ExtinguisherQrData } from '../utils/qrInspectionUtils';
import { Download, FileText, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { QRCodeSVG } from 'qrcode.react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { logger } from '../utils/logger';

// Função para carregar plugins do Capacitor dinamicamente (opcionais)
// Nota: Para usar no Android, instale: npm install @capacitor/filesystem @capacitor/share
// Esta função tenta carregar os plugins apenas quando necessário e falha silenciosamente se não estiverem instalados
const loadCapacitorPlugins = async () => {
  let Filesystem: any = null;
  let Directory: any = null;
  let Encoding: any = null;
  let Share: any = null;

  // Verifica se estamos em ambiente nativo
  if (Capacitor.isNativePlatform()) {
    // Tenta importar dinamicamente usando eval para evitar análise estática do Vite
    try {
      // eslint-disable-next-line no-eval
      const filesystemModule = await eval('import("@capacitor/filesystem")').catch(() => null);
      if (filesystemModule) {
        Filesystem = filesystemModule.Filesystem;
        Directory = filesystemModule.Directory;
        Encoding = filesystemModule.Encoding;
      }
    } catch (e) {
      // Plugin não instalado - continuará usando fallback web
    }

    try {
      // eslint-disable-next-line no-eval
      const shareModule = await eval('import("@capacitor/share")').catch(() => null);
      if (shareModule) {
        Share = shareModule.Share;
      }
    } catch (e) {
      // Plugin não instalado - continuará usando fallback web
    }
  }

  return { Filesystem, Directory, Encoding, Share };
};

// Componente para QR Code usando biblioteca local (funciona offline)
const QRCodeDisplay = ({ value, size = 200 }: { value: string; size?: number }) => {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <QRCodeSVG
        value={value}
        size={size}
        level="H" // Alta correção de erro
        includeMargin={true}
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    </div>
  );
};

type GeneratorMode = 'integrated' | 'manual';

const QrGeneratorPage = () => {
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();
  const { cache } = useEquipmentCache();
  const [mode, setMode] = useState<GeneratorMode>('integrated');
  const [selectedExtinguishers, setSelectedExtinguishers] = useState<string[]>([]);
  const [locationCode, setLocationCode] = useState('7036');
  const [manualText, setManualText] = useState('');
  const [generatedQrs, setGeneratedQrs] = useState<Record<string, { data: string; qrString: string }>>({});
  const [loading, setLoading] = useState(false);

  const extinguishers = cache.extinguishers || [];

  useEffect(() => {
    if (mode === 'integrated' && selectedExtinguishers.length > 0) {
      generateIntegratedQrs();
    }
  }, [selectedExtinguishers, locationCode, mode]);

  const generateIntegratedQrs = () => {
    const newQrs: Record<string, { data: string; qrString: string }> = {};
    
    selectedExtinguishers.forEach((id) => {
      const extinguisher = extinguishers.find((ext: any) => ext.numero_identificacao === id);
      if (extinguisher) {
        const qrData: ExtinguisherQrData = {
          numero_identificacao: extinguisher.numero_identificacao,
          tipo_agente: extinguisher.tipo_agente,
          capacidade: extinguisher.capacidade,
          localizacao: extinguisher.localizacao,
        };
        
        const qrString = buildIndustrialQrString(qrData, locationCode);
        newQrs[id] = {
          data: qrString,
          qrString: qrString,
        };
      }
    });
    
    setGeneratedQrs(newQrs);
  };

  const handleGenerateManual = () => {
    if (!manualText.trim()) return;
    
    const items = manualText.split('\n').filter(line => line.trim());
    const newQrs: Record<string, { data: string; qrString: string }> = {};
    
    items.forEach((item, index) => {
      const trimmed = item.trim();
      if (trimmed) {
        newQrs[`manual_${index}`] = {
          data: trimmed,
          qrString: trimmed,
        };
      }
    });
    
    setGeneratedQrs(newQrs);
  };

  const downloadQrCode = async (id: string, qrString: string) => {
    try {
      // Cria um elemento temporário para renderizar o QR Code
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '500px';
      tempDiv.style.height = '500px';
      document.body.appendChild(tempDiv);
      
      // Renderiza o QR Code no elemento temporário
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      root.render(
        <QRCodeSVG
          value={qrString}
          size={500}
          level="H"
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      );
      
      // Aguarda um pouco para garantir que o SVG foi renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obtém o SVG renderizado
      const svgElement = tempDiv.querySelector('svg');
      if (!svgElement) {
        throw new Error('Erro ao gerar QR Code');
      }
      
      // Converte SVG para PNG usando canvas
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }
      
      // Preenche fundo branco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 500, 500);
      
      // Converte SVG para imagem
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.onerror = reject;
        img.src = url;
      });
      
      // Limpa elemento temporário
      document.body.removeChild(tempDiv);
      
      // Converte canvas para blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Erro ao gerar imagem');
        }
        
        const isNative = Capacitor.isNativePlatform();
        const fileName = `qrcode_${id}.png`;
        
        if (isNative) {
          // Tenta carregar plugins do Capacitor
          try {
            const { Filesystem, Directory, Encoding, Share } = await loadCapacitorPlugins();
            
            if (Filesystem && Share) {
              // No Android/iOS, usa Filesystem do Capacitor (se disponível)
              try {
                const arrayBuffer = await blob.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                
                const result = await Filesystem.writeFile({
                  path: fileName,
                  data: base64,
                  directory: Directory.Documents,
                  encoding: Encoding.UTF8,
                });
                
                // Tenta compartilhar o arquivo
                try {
                  await Share.share({
                    title: `QR Code ${id}`,
                    text: `QR Code gerado para ${id}`,
                    url: result.uri,
                    dialogTitle: 'Compartilhar QR Code',
                  });
                  return; // Sucesso, não precisa continuar
                } catch (shareError) {
                  // Se não conseguir compartilhar, apenas mostra mensagem
                  // QR Code salvo com sucesso (feedback já dado pelo toast)
                  return;
                }
              } catch (fsError) {
                // Fallback para método web (erro já tratado silenciosamente)
              }
            }
          } catch (pluginError) {
            // Plugins não disponíveis, usa fallback (comportamento esperado)
          }
        }
        
        // No navegador ou se plugins não estiverem instalados, usa método tradicional
        downloadQrCodeWeb(blob, fileName);
      }, 'image/png');
    } catch (error) {
      handleError(error, 'storage', 'Erro ao baixar QR Code. Tente novamente.');
    }
  };

  const downloadQrCodeWeb = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadAllQrCodes = async () => {
    if (Object.keys(generatedQrs).length === 0) return;
    
    setLoading(true);
    try {
      // Baixa cada QR Code individualmente
      // Nota: Para download em ZIP, instale jszip: npm install jszip
      for (const [id, { qrString }] of Object.entries(generatedQrs)) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay para evitar bloqueio
          await downloadQrCode(id, qrString);
        } catch (error) {
          logger.error('Erro ao baixar QR Code', 'qr_generator', { id, error });
        }
      }
    } catch (error) {
      logger.error('Erro ao baixar QR Codes', 'qr_generator', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
      <PageHeader title={{ key: 'qr.generate', defaultValue: 'Gerador de QR Codes' }} />
      <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
        <div className="space-y-6">
          {/* Tabs para escolher modo */}
          <div className="flex space-x-2 border-b" style={{ borderColor: '#2A2A2A' }}>
            <button
              onClick={() => {
                setMode('integrated');
                setGeneratedQrs({});
              }}
              className={`px-4 py-2 font-semibold transition-colors ${
                mode === 'integrated'
                  ? 'border-b-2'
                  : ''
              }`}
              style={{
                color: mode === 'integrated' ? '#FC3D39' : '#B0B0B0',
                borderColor: mode === 'integrated' ? '#FC3D39' : 'transparent',
              }}
            >
              <Package size={20} className="inline mr-2" />
              Gerar para Itens Cadastrados
            </button>
            <button
              onClick={() => {
                setMode('manual');
                setGeneratedQrs({});
              }}
              className={`px-4 py-2 font-semibold transition-colors ${
                mode === 'manual'
                  ? 'border-b-2'
                  : ''
              }`}
              style={{
                color: mode === 'manual' ? '#FC3D39' : '#B0B0B0',
                borderColor: mode === 'manual' ? '#FC3D39' : 'transparent',
              }}
            >
              <FileText size={20} className="inline mr-2" />
              Gerar a partir de Texto
            </button>
          </div>

          {/* Modo Integrado */}
          {mode === 'integrated' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}>
                <p className="text-sm" style={{ color: '#B0B0B0' }}>
                  Selecione um ou mais extintores do seu inventário para gerar QR Codes no formato industrial padrão.
                </p>
              </div>

              {extinguishers.length === 0 ? (
                <div className="p-6 rounded-lg border text-center" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                  <p className="mb-4" style={{ color: '#FFFFFF' }}>
                    Nenhum extintor cadastrado.
                  </p>
                  <button
                    onClick={() => navigate('/inspections/extintor/new')}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                  >
                    Cadastrar Extintor
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Código de Local/Planta
                    </label>
                    <input
                      type="text"
                      value={locationCode}
                      onChange={(e) => setLocationCode(e.target.value)}
                      placeholder="7036"
                      className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                      style={{
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        borderColor: '#2A2A2A',
                        color: '#FFFFFF',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Selecione os Extintores
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto p-2 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                      {extinguishers.map((ext: any) => (
                        <label
                          key={ext.numero_identificacao}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-white/5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedExtinguishers.includes(ext.numero_identificacao)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExtinguishers([...selectedExtinguishers, ext.numero_identificacao]);
                              } else {
                                setSelectedExtinguishers(selectedExtinguishers.filter(id => id !== ext.numero_identificacao));
                              }
                            }}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: '#FC3D39' }}
                          />
                          <div className="flex-1">
                            <p className="font-semibold" style={{ color: '#FFFFFF' }}>
                              {ext.numero_identificacao}
                            </p>
                            {ext.tipo_agente && (
                              <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                {ext.tipo_agente} - {ext.capacidade}L
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedExtinguishers.length > 0 && (
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                      <p className="text-sm mb-2" style={{ color: '#FFFFFF' }}>
                        <strong>{selectedExtinguishers.length}</strong> extintor(es) selecionado(s)
                      </p>
                      <button
                        onClick={() => setSelectedExtinguishers([])}
                        className="text-xs underline"
                        style={{ color: '#FC3D39' }}
                      >
                        Limpar seleção
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Modo Manual */}
          {mode === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}>
                <p className="text-sm" style={{ color: '#B0B0B0' }}>
                  Use esta opção para gerar QR Codes com texto simples. Útil para IDs provisórios ou outros fins.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Insira os IDs (um por linha)
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="ID-PROVISORIO-01&#10;ID-PROVISORIO-02&#10;..."
                  rows={8}
                  className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500 font-mono text-sm"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: '#2A2A2A',
                    color: '#FFFFFF',
                  }}
                />
              </div>

              <button
                onClick={handleGenerateManual}
                disabled={!manualText.trim()}
                className="w-full p-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
              >
                Gerar QR Codes
              </button>
            </motion.div>
          )}

          {/* Preview dos QR Codes Gerados */}
          {Object.keys(generatedQrs).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                  QR Codes Gerados
                </h3>
                <button
                  onClick={downloadAllQrCodes}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50"
                  style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                >
                  <Download size={18} />
                  <span>{loading ? 'Gerando...' : 'Baixar Todos (ZIP)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(generatedQrs).map(([id, { qrString }]) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-lg border"
                    style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}
                  >
                    <div className="text-center mb-3">
                      <p className="font-semibold mb-2" style={{ color: '#FFFFFF' }}>
                        ID: {id.replace('manual_', '')}
                      </p>
                      <QRCodeDisplay value={qrString} size={180} />
                    </div>
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-black/50">
                        <p className="text-xs font-mono break-all" style={{ color: '#B0B0B0' }}>
                          {qrString}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadQrCode(id, qrString)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                        style={{ backgroundColor: '#2A2A2A', color: '#FFFFFF' }}
                      >
                        <Download size={16} />
                        <span>Baixar PNG</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QrGeneratorPage;

