import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import PageHeader from '../components/PageHeader';
import { buildIndustrialQrString, type ExtinguisherQrData } from '../utils/qrInspectionUtils';
import { 
  getEquipmentIdentifier, 
  findEquipmentByIdentifier, 
  generateQrString,
  getEquipmentTypeName,
  getIdentifierFieldName
} from '../utils/qrGeneratorUtils';
import { Download, FileText, Package, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { QRCodeSVG } from 'qrcode.react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { logger } from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';

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
    // Tenta importar dinamicamente usando import() padrão (mais seguro que eval)
    try {
      const filesystemModule = await import('@capacitor/filesystem').catch(() => null);
      if (filesystemModule) {
        Filesystem = filesystemModule.Filesystem;
        Directory = filesystemModule.Directory;
        Encoding = filesystemModule.Encoding;
      }
    } catch (e) {
      // Plugin não instalado - continuará usando fallback web
    }

    try {
      const shareModule = await import('@capacitor/share').catch(() => null);
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

type GeneratorMode = 'search' | 'manual' | 'select';

interface SelectedEquipment {
  id: string;
  type: string;
  identifier: string;
  displayName: string;
}

const QrGeneratorPage = () => {
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cache, getAllEquipment } = useEquipmentCache();
  const [mode, setMode] = useState<GeneratorMode>('select');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('extintor');
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [locationCode, setLocationCode] = useState('7036');
  const [manualText, setManualText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedEquipment[]>([]);
  const [generatedQrs, setGeneratedQrs] = useState<Record<string, { data: string; qrString: string; type: string; identifier: string }>>({});
  const [loading, setLoading] = useState(false);

  // Todos os equipamentos disponíveis
  const allEquipment = useMemo(() => ({
    extinguishers: cache.extinguishers || [],
    hoses: cache.hoses || [],
    scbas: cache.scbas || [],
    multigasDetectors: cache.multigasDetectors || [],
    foamChambers: cache.foamChambers || [],
    cannonMonitors: cache.cannonMonitors || [],
    eyewashStations: cache.eyewashStations || [],
    alarmSystems: cache.alarmSystems || [],
    shelters: cache.shelters || [],
  }), [cache]);

  // Buscar equipamentos por ID ou número de série
  const handleSearch = () => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTerm = searchText.trim().toLowerCase();
    const results: SelectedEquipment[] = [];

    // Busca em todos os tipos de equipamentos
    const types = [
      { list: allEquipment.extinguishers, type: 'extintor' },
      { list: allEquipment.hoses, type: 'mangueira' },
      { list: allEquipment.scbas, type: 'scba' },
      { list: allEquipment.multigasDetectors, type: 'multigas' },
      { list: allEquipment.foamChambers, type: 'camara_espuma' },
      { list: allEquipment.cannonMonitors, type: 'canhao_monitor' },
      { list: allEquipment.eyewashStations, type: 'chuveiro_lavaolhos' },
      { list: allEquipment.alarmSystems, type: 'alarme' },
      { list: allEquipment.shelters, type: 'abrigo' },
    ];

    types.forEach(({ list, type }) => {
      list.forEach((equipment: any) => {
        const identifier = getEquipmentIdentifier(equipment, type);
        if (identifier && identifier.toString().toLowerCase().includes(searchTerm)) {
          const typeName = getEquipmentTypeName(type, t);
          const fieldName = getIdentifierFieldName(type, t);
          results.push({
            id: `${type}_${identifier}`,
            type,
            identifier: identifier.toString(),
            displayName: `${typeName} - ${fieldName}: ${identifier}`,
          });
        }
      });
    });

    setSearchResults(results);
  };

  useEffect(() => {
    if (mode === 'search' && searchText) {
      handleSearch();
    } else if (mode === 'search' && !searchText) {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, allEquipment, mode]);

  // Gerar QR codes para equipamentos selecionados
  useEffect(() => {
    if (selectedEquipment.length > 0) {
      generateQrCodes();
    }
  }, [selectedEquipment, locationCode]);

  const generateQrCodes = () => {
    const newQrs: Record<string, { data: string; qrString: string; type: string; identifier: string }> = {};
    
    selectedEquipment.forEach(({ id, type, identifier }) => {
      // Busca o equipamento completo
      const found = findEquipmentByIdentifier(allEquipment, identifier);
      
      if (found) {
        // Formato industrial é sempre usado quando disponível (extintores)
        // Para outros tipos, usa o ID/série diretamente
        const qrString = generateQrString(
          found.equipment,
          type,
          locationCode,
          type === 'extintor' // Sempre usa formato industrial para extintores
        );
        
        if (qrString) {
          newQrs[id] = {
            data: qrString,
            qrString: qrString,
            type,
            identifier,
          };
        }
      }
    });
    
    setGeneratedQrs(newQrs);
  };

  const handleGenerateManual = () => {
    if (!manualText.trim()) return;
    
    const items = manualText.split('\n').filter(line => line.trim());
    const newQrs: Record<string, { data: string; qrString: string; type: string; identifier: string }> = {};
    
    items.forEach((item, index) => {
      const trimmed = item.trim();
      if (trimmed) {
        // Tenta encontrar o equipamento pelo ID/série digitado
        const found = findEquipmentByIdentifier(allEquipment, trimmed);
        
        if (found) {
          // Se encontrou, gera QR code do equipamento
          // Formato industrial é sempre usado para extintores
          const qrString = generateQrString(
            found.equipment,
            found.type,
            locationCode,
            found.type === 'extintor' // Sempre usa formato industrial para extintores
          );
          newQrs[`manual_${index}`] = {
            data: qrString || trimmed,
            qrString: qrString || trimmed,
            type: found.type,
            identifier: getEquipmentIdentifier(found.equipment, found.type) || trimmed,
          };
        } else {
          // Se não encontrou, usa o texto como está
          newQrs[`manual_${index}`] = {
            data: trimmed,
            qrString: trimmed,
            type: 'manual',
            identifier: trimmed,
          };
        }
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
        throw new Error(t('qr.errorGeneratingQr'));
      }
      
      // Converte SVG para PNG usando canvas
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error(t('qr.errorCreatingCanvas'));
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
          throw new Error(t('qr.errorGeneratingImage'));
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
                    text: `${t('qr.qrGeneratedFor')} ${id}`,
                    url: result.uri,
                    dialogTitle: t('qr.shareQrCode'),
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
      handleError(error, 'storage', t('qr.errorDownloadingQr'));
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
          <div className="flex space-x-2 border-b overflow-x-auto" style={{ borderColor: '#2A2A2A' }}>
            <button
              onClick={() => {
                setMode('select');
                setGeneratedQrs({});
                setSelectedEquipment([]);
              }}
              className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                mode === 'select'
                  ? 'border-b-2'
                  : ''
              }`}
              style={{
                color: mode === 'select' ? '#FC3D39' : '#B0B0B0',
                borderColor: mode === 'select' ? '#FC3D39' : 'transparent',
              }}
            >
              <Package size={20} className="inline mr-2" />
              Selecionar Equipamentos
            </button>
            <button
              onClick={() => {
                setMode('search');
                setGeneratedQrs({});
                setSelectedEquipment([]);
              }}
              className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                mode === 'search'
                  ? 'border-b-2'
                  : ''
              }`}
              style={{
                color: mode === 'search' ? '#FC3D39' : '#B0B0B0',
                borderColor: mode === 'search' ? '#FC3D39' : 'transparent',
              }}
            >
              <Search size={20} className="inline mr-2" />
              Buscar por ID/Série
            </button>
            <button
              onClick={() => {
                setMode('manual');
                setGeneratedQrs({});
                setSelectedEquipment([]);
              }}
              className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
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
              {t('qr.generateFromText')}
            </button>
          </div>

          {/* Modo Seleção por Tipo */}
          {mode === 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}>
                <p className="text-sm" style={{ color: '#B0B0B0' }}>
                  Selecione o tipo de equipamento e escolha os itens para gerar QR codes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Tipo de Equipamento
                </label>
                <select
                  value={selectedEquipmentType}
                  onChange={(e) => {
                    setSelectedEquipmentType(e.target.value);
                    setSelectedEquipment([]);
                  }}
                  className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: '#2A2A2A',
                    color: '#FFFFFF',
                  }}
                >
                  <option value="extintor">{t('equipment.extinguisher')}</option>
                  <option value="mangueira">{t('equipment.hose')}</option>
                  <option value="scba">{t('equipment.scba')}</option>
                  <option value="multigas">{t('equipment.multigas')}</option>
                  <option value="camara_espuma">{t('equipment.foamChamber')}</option>
                  <option value="canhao_monitor">{t('equipment.cannonMonitor')}</option>
                  <option value="chuveiro_lavaolhos">{t('equipment.eyewash')}</option>
                  <option value="alarme">{t('equipment.alarm')}</option>
                  <option value="abrigo">{t('equipment.shelter')}</option>
                </select>
              </div>

              {(() => {
                const equipmentList = allEquipment[
                  selectedEquipmentType === 'extintor' ? 'extinguishers' :
                  selectedEquipmentType === 'mangueira' ? 'hoses' :
                  selectedEquipmentType === 'scba' ? 'scbas' :
                  selectedEquipmentType === 'multigas' ? 'multigasDetectors' :
                  selectedEquipmentType === 'camara_espuma' ? 'foamChambers' :
                  selectedEquipmentType === 'canhao_monitor' ? 'cannonMonitors' :
                  selectedEquipmentType === 'chuveiro_lavaolhos' ? 'eyewashStations' :
                  selectedEquipmentType === 'alarme' ? 'alarmSystems' :
                  'shelters'
                ] as any[];

                if (equipmentList.length === 0) {
                  return (
                    <div className="p-6 rounded-lg border text-center" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                      <p className="mb-4" style={{ color: '#FFFFFF' }}>
                        Nenhum {getEquipmentTypeName(selectedEquipmentType, t).toLowerCase()} cadastrado.
                      </p>
                      <button
                        onClick={() => navigate(`/inspections/${selectedEquipmentType}/new`)}
                        className="px-4 py-2 rounded-lg font-semibold"
                        style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                      >
                        Cadastrar {getEquipmentTypeName(selectedEquipmentType, t)}
                      </button>
                    </div>
                  );
                }

                return (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                        {getEquipmentTypeName(selectedEquipmentType, t)} ({equipmentList.length} disponível(is))
                      </label>
                      <div className="space-y-2 max-h-96 overflow-y-auto p-2 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                        {equipmentList.map((equipment: any) => {
                          const identifier = getEquipmentIdentifier(equipment, selectedEquipmentType);
                          const equipmentId = `${selectedEquipmentType}_${identifier}`;
                          const isSelected = selectedEquipment.some(eq => eq.id === equipmentId);
                          
                          return (
                            <label
                              key={equipmentId}
                              className="flex items-center space-x-3 p-3 rounded hover:bg-white/5 cursor-pointer border"
                              style={{ 
                                borderColor: isSelected ? '#FC3D39' : 'transparent',
                                backgroundColor: isSelected ? 'rgba(252, 61, 57, 0.1)' : 'transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const typeName = getEquipmentTypeName(selectedEquipmentType, t);
                                    const fieldName = getIdentifierFieldName(selectedEquipmentType, t);
                                    setSelectedEquipment([...selectedEquipment, {
                                      id: equipmentId,
                                      type: selectedEquipmentType,
                                      identifier: identifier || '',
                                      displayName: `${typeName} - ${fieldName}: ${identifier}`,
                                    }]);
                                  } else {
                                    setSelectedEquipment(selectedEquipment.filter(eq => eq.id !== equipmentId));
                                  }
                                }}
                                className="w-5 h-5 rounded"
                                style={{ accentColor: '#FC3D39' }}
                              />
                              <div className="flex-1">
                                <p className="font-semibold" style={{ color: '#FFFFFF' }}>
                                  {identifier}
                                </p>
                                {equipment.localizacao && (
                                  <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                    📍 {equipment.localizacao}
                                  </p>
                                )}
                                {selectedEquipmentType === 'extintor' && equipment.tipo_agente && (
                                  <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                    {equipment.tipo_agente} - {equipment.capacidade}L
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {selectedEquipment.length > 0 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                            {t('qr.locationCode')} <span className="text-xs text-gray-400">(obrigatório para formato industrial)</span>
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
                          <p className="text-xs mt-1" style={{ color: '#B0B0B0' }}>
                            Extintores serão gerados no formato industrial: 2#[código]#EXT#[ID]#[capacidade]#31
                          </p>
                        </div>

                        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                          <p className="text-sm mb-2" style={{ color: '#FFFFFF' }}>
                            <strong>{selectedEquipment.length}</strong> equipamento(s) selecionado(s)
                          </p>
                          <button
                            onClick={() => setSelectedEquipment([])}
                            className="text-xs underline"
                            style={{ color: '#FC3D39' }}
                          >
                            Limpar seleção
                          </button>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* Modo Busca */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}>
                <p className="text-sm" style={{ color: '#B0B0B0' }}>
                  Busque equipamentos por ID ou número de série. Todos os tipos de equipamentos são suportados.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Buscar por ID ou Número de Série
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Digite ID ou número de série..."
                    className="flex-1 p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                    style={{
                      backgroundColor: 'rgba(26, 26, 26, 0.95)',
                      borderColor: '#2A2A2A',
                      color: '#FFFFFF',
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-3 rounded-lg font-semibold"
                    style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                    Resultados da Busca ({searchResults.length})
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto p-2 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                    {searchResults.map((result) => (
                      <label
                        key={result.id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEquipment.some(eq => eq.id === result.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEquipment([...selectedEquipment, result]);
                            } else {
                              setSelectedEquipment(selectedEquipment.filter(eq => eq.id !== result.id));
                            }
                          }}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: '#FC3D39' }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>
                            {result.displayName}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedEquipment.length > 0 && (
                <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                        {t('qr.locationCode')} <span className="text-xs text-gray-400">(obrigatório para formato industrial)</span>
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
                      <p className="text-xs mt-1" style={{ color: '#B0B0B0' }}>
                        Extintores serão gerados no formato industrial: 2#[código]#EXT#[ID]#[capacidade]#31
                      </p>
                    </div>

                  <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                    <p className="text-sm mb-2" style={{ color: '#FFFFFF' }}>
                      <strong>{selectedEquipment.length}</strong> equipamento(s) selecionado(s)
                    </p>
                    <button
                      onClick={() => setSelectedEquipment([])}
                      className="text-xs underline"
                      style={{ color: '#FC3D39' }}
                    >
                      Limpar seleção
                    </button>
                  </div>
                </>
              )}

              {searchText && searchResults.length === 0 && (
                <div className="p-4 rounded-lg border text-center" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                  <p style={{ color: '#B0B0B0' }}>
                    Nenhum equipamento encontrado com "{searchText}"
                  </p>
                </div>
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
                  {t('qr.manualDescription')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  {t('qr.enterIdsOnePerLine')}
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Digite IDs ou números de série, um por linha&#10;Exemplo:&#10;8851&#10;MANG-001&#10;SCBA-123"
                  rows={8}
                  className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500 font-mono text-sm"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: '#2A2A2A',
                    color: '#FFFFFF',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  {t('qr.locationCode')} <span className="text-xs text-gray-400">(obrigatório para formato industrial)</span>
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
                <p className="text-xs mt-1" style={{ color: '#B0B0B0' }}>
                  Extintores encontrados serão gerados no formato industrial: 2#[código]#EXT#[ID]#[capacidade]#31
                </p>
              </div>

              <button
                onClick={handleGenerateManual}
                disabled={!manualText.trim()}
                className="w-full p-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
              >
                {t('qr.generateQrCodes')}
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
                  {t('qr.qrCodesGenerated')}
                </h3>
                <button
                  onClick={downloadAllQrCodes}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50"
                  style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                >
                  <Download size={18} />
                  <span>{loading ? t('qr.generating') : t('qr.downloadAllZip')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(generatedQrs).map(([id, { qrString, type, identifier }]) => {
                  const typeName = getEquipmentTypeName(type, t);
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg border"
                      style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}
                    >
                      <div className="text-center mb-3">
                        <p className="text-xs mb-1" style={{ color: '#B0B0B0' }}>
                          {typeName}
                        </p>
                        <p className="font-semibold mb-2" style={{ color: '#FFFFFF' }}>
                          {id.startsWith('manual_') ? id.replace('manual_', '') : identifier}
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
                          <span>{t('qr.downloadPng')}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QrGeneratorPage;

