import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import PageHeader from '../components/PageHeader';
import InstructionsPanel from '../components/InstructionsPanel';
import { 
  getEquipmentIdentifier, 
  findEquipmentByIdentifier, 
  generateQrString,
  getEquipmentTypeName,
  getIdentifierFieldName
} from '../utils/qrGeneratorUtils';
import { ButtonSkeleton } from '../components/skeletons';
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
  const { cache } = useEquipmentCache();
  const [mode, setMode] = useState<GeneratorMode>('select');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('extintor');
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [locationCode, setLocationCode] = useState('7036');
  const [manualText, setManualText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedEquipment[]>([]);
  const [generatedQrs, setGeneratedQrs] = useState<Record<string, { data: string; qrString: string; type: string; identifier: string }>>({});
  const [loading, setLoading] = useState(false);

  const [customEquipment, setCustomEquipment] = useState<Record<string, any[]>>({});
  const [customTypes, setCustomTypes] = useState<Array<{ slug: string; name: string }>>([]);

  // Carrega equipamentos customizados
  useEffect(() => {
    const loadCustomEquipment = async () => {
      try {
        const { getAllCustomEquipmentTypes, getAllCustomEquipment } = await import('../utils/customEquipmentOperations');
        const customTypesList = await getAllCustomEquipmentTypes();
        const customEquipmentsMap: Record<string, any[]> = {};
        
        for (const customType of customTypesList) {
          const equipments = await getAllCustomEquipment(customType.id);
          customEquipmentsMap[`custom-${customType.slug}`] = equipments.map((eq: any) => ({
            ...eq,
            id_equipamento: eq.id_equipamento,
            equipment_id: eq.id_equipamento,
          }));
        }
        
        setCustomEquipment(customEquipmentsMap);
        setCustomTypes(customTypesList.map(t => ({ slug: t.slug, name: t.name })));
      } catch (error) {
        console.error('Erro ao carregar equipamentos customizados:', error);
      }
    };

    loadCustomEquipment();
  }, []);

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
    ...customEquipment,
  } as Record<string, any[]>), [cache, customEquipment]);

  // Função para buscar equipamentos por ID/série
  const handleSearch = useCallback(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SelectedEquipment[] = [];
    const searchLower = searchText.toLowerCase().trim();

    // Busca em todos os tipos
    const searchInList = (list: any[], type: string) => {
      for (const item of list) {
        const identifier = getEquipmentIdentifier(item, type);
        if (identifier && (identifier.toLowerCase().includes(searchLower) || identifier === searchText)) {
          const typeName = getEquipmentTypeName(type, t);
          const fieldName = getIdentifierFieldName(type);
          const equipmentId = `${type}_${identifier}`;
          
          if (!results.some(r => r.id === equipmentId)) {
            results.push({
              id: equipmentId,
              type,
              identifier: identifier,
              displayName: `${typeName} - ${fieldName}: ${identifier}`,
            });
          }
        }
      }
    };

    // Busca em todos os tipos padrão
    Object.entries(allEquipment).forEach(([key, list]) => {
      if (Array.isArray(list)) {
        if (key === 'extinguishers') searchInList(list, 'extintor');
        else if (key === 'hoses') searchInList(list, 'mangueira');
        else if (key === 'scbas') searchInList(list, 'scba');
        else if (key === 'multigasDetectors') searchInList(list, 'multigas');
        else if (key === 'foamChambers') searchInList(list, 'camara_espuma');
        else if (key === 'cannonMonitors') searchInList(list, 'canhao_monitor');
        else if (key === 'eyewashStations') searchInList(list, 'chuveiro_lavaolhos');
        else if (key === 'alarmSystems') searchInList(list, 'alarme');
        else if (key === 'shelters') searchInList(list, 'abrigo');
        else if (key.startsWith('custom-')) searchInList(list, key);
      }
    });

    setSearchResults(results);
  }, [searchText, allEquipment, t]);

  // Função para gerar QR codes dos equipamentos selecionados
  const handleGenerateQrCodes = useCallback(() => {
    if (selectedEquipment.length === 0) {
      handleError(new Error('Nenhum equipamento selecionado'), 'validation', t('qr.noEquipmentSelected', { defaultValue: 'Selecione pelo menos um equipamento' }));
      return;
    }

    const newQrs: Record<string, { data: string; qrString: string; type: string; identifier: string }> = {};

    selectedEquipment.forEach((eq) => {
      const found = findEquipmentByIdentifier(allEquipment as any, eq.identifier);
      if (found) {
        const qrString = generateQrString(
          found.equipment,
          found.type,
          locationCode,
          found.type === 'extintor'
        );
        if (qrString) {
          newQrs[eq.id] = {
            data: JSON.stringify(found.equipment),
            qrString,
            type: found.type,
            identifier: eq.identifier,
          };
        }
      }
    });

    setGeneratedQrs(newQrs);
  }, [selectedEquipment, allEquipment, locationCode, handleError, t]);

  // Função para gerar QR codes do modo manual
  const handleGenerateManual = useCallback(() => {
    if (!manualText.trim()) {
      handleError(new Error('Texto vazio'), 'validation', t('qr.emptyText', { defaultValue: 'Digite pelo menos um ID ou texto' }));
      return;
    }

    const lines = manualText.trim().split('\n').filter(line => line.trim());
    const newQrs: Record<string, { data: string; qrString: string; type: string; identifier: string }> = {};

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Tenta encontrar o equipamento
      const found = findEquipmentByIdentifier(allEquipment as any, trimmed);
      
      if (found) {
        // Equipamento encontrado - gera QR code apropriado
        const qrString = generateQrString(
          found.equipment,
          found.type,
          locationCode,
          found.type === 'extintor'
        );
        if (qrString) {
          newQrs[`manual_${trimmed}`] = {
            data: JSON.stringify(found.equipment),
            qrString,
            type: found.type,
            identifier: trimmed,
          };
        }
      } else {
        // Equipamento não encontrado - usa o texto como está
        newQrs[`manual_${trimmed}`] = {
          data: trimmed,
          qrString: trimmed,
          type: 'manual',
          identifier: trimmed,
        };
      }
    });

    setGeneratedQrs(newQrs);
  }, [manualText, allEquipment, locationCode, handleError, t]);

  // Função para baixar um QR code individual
  const downloadQrCode = useCallback(async (id: string, qrString: string) => {
    try {
      setLoading(true);
      const { Filesystem, Directory, Encoding, Share } = await loadCapacitorPlugins();
      
      // Cria um elemento SVG temporário para renderizar o QR code
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '512px';
      tempDiv.style.height = '512px';
      document.body.appendChild(tempDiv);

      // Renderiza o QRCodeSVG no elemento temporário
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      
      root.render(
        <QRCodeSVG
          value={qrString}
          size={512}
          level="H"
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      );

      // Aguarda um pouco para o SVG renderizar
      await new Promise(resolve => setTimeout(resolve, 100));

      // Obtém o SVG renderizado
      const svgElement = tempDiv.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG não foi renderizado');
      }

      // Converte SVG para imagem
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Cria canvas para converter para PNG
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }

          // Fundo branco
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 512, 512);
          
          // Desenha a imagem do SVG
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Erro ao gerar imagem'));
              return;
            }
            
            try {
              if (Capacitor.isNativePlatform() && Filesystem && Share) {
                // Salva na pasta Documents (acessível pelo usuário)
                const cleanId = id.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filename = `QR_${cleanId}_${Date.now()}.png`;
                
                // Converte blob para base64
                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve(base64String);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });

                // Tenta salvar sem encoding primeiro (recomendado para imagens)
                let fileUri;
                try {
                  fileUri = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: Directory.Documents,
                    // Não especificar encoding para dados binários (imagens)
                  });
                } catch (writeError: any) {
                  // Se falhar, tenta com encoding (algumas versões podem precisar)
                  logger.warn('Tentando salvar QR code com encoding alternativo', 'qr_generator', writeError);
                  fileUri = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8,
                  });
                }

                logger.info('QR code salvo com sucesso', 'qr_generator', { uri: fileUri.uri, filename });

                // Compartilha o arquivo (permite salvar em Downloads, Fotos, etc.)
                try {
                  await Share.share({
                    title: t('qr.shareQrCode', { defaultValue: 'Compartilhar QR Code' }),
                    text: `${t('qr.qrGeneratedFor', { defaultValue: 'QR Code gerado para' })} ${cleanId}\n\n${qrString}`,
                    url: fileUri.uri,
                    dialogTitle: t('qr.shareQrCode', { defaultValue: 'Salvar ou Compartilhar QR Code' }),
                  });
                } catch (shareError: any) {
                  // Se falhar, tenta obter o URI novamente
                  try {
                    const fileUriRetry = await Filesystem.getUri({
                      path: filename,
                      directory: Directory.Documents,
                    });
                    
                    await Share.share({
                      title: t('qr.shareQrCode', { defaultValue: 'Compartilhar QR Code' }),
                      text: `${t('qr.qrGeneratedFor', { defaultValue: 'QR Code gerado para' })} ${cleanId}\n\n${qrString}`,
                      url: fileUriRetry.uri,
                      dialogTitle: t('qr.shareQrCode', { defaultValue: 'Salvar ou Compartilhar QR Code' }),
                    });
                  } catch (shareError2: any) {
                    // Se ainda falhar, apenas loga (arquivo já foi salvo)
                    logger.warn('QR code salvo mas não foi possível compartilhar', 'qr_generator', { 
                      error: shareError2?.message || shareError?.message,
                      uri: fileUri.uri 
                    });
                    logger.info('QR code salvo em Documents', 'qr_generator', { filename, uri: fileUri.uri });
                  }
                }
              } else {
                // Download no navegador
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `qr_${id}_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          }, 'image/png');
        };
        img.onerror = reject;
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      });

      // Limpa o elemento temporário
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error) {
      logger.error('Erro ao baixar QR code', 'qr_generator', error);
      handleError(error as Error, 'equipment', t('qr.errorDownloadingQr', { defaultValue: 'Erro ao baixar QR Code. Tente novamente.' }));
    } finally {
      setLoading(false);
    }
  }, [handleError, t]);

  // Função para baixar todos os QR codes em ZIP
  const downloadAllQrCodes = useCallback(async () => {
    try {
      setLoading(true);
      // Implementação simplificada - baixa cada QR code individualmente
      // Para uma implementação completa de ZIP, seria necessário uma biblioteca como JSZip
      for (const [id, { qrString }] of Object.entries(generatedQrs)) {
        await downloadQrCode(id, qrString);
        // Pequeno delay entre downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      logger.error('Erro ao baixar todos os QR codes', 'qr_generator', error);
      handleError(error as Error, 'equipment', t('qr.errorDownloadingQr', { defaultValue: 'Erro ao baixar QR Code. Tente novamente.' }));
    } finally {
      setLoading(false);
    }
  }, [generatedQrs, downloadQrCode, handleError, t]);

  // Gera QR codes quando há equipamentos selecionados e o botão é clicado
  useEffect(() => {
    if (selectedEquipment.length > 0 && mode !== 'manual') {
      // Auto-gera quando há seleção (pode ser removido se preferir botão manual)
    }
  }, [selectedEquipment, mode]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#000000', zIndex: 10 }}>
      <PageHeader title={{ key: 'qr.generate', defaultValue: 'Gerador de QR Codes' }} />
      <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10 }}>
        <InstructionsPanel equipmentType="qr_generator" className="mb-6" />
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
                  {customTypes.map(customType => (
                    <option key={customType.slug} value={`custom-${customType.slug}`}>
                      {customType.name}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                let equipmentList: any[] = [];
                
                if (selectedEquipmentType.startsWith('custom-')) {
                  equipmentList = allEquipment[selectedEquipmentType] || [];
                } else {
                  equipmentList = allEquipment[
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
                }

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
                                    const fieldName = getIdentifierFieldName(selectedEquipmentType);
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
                        {/* Mostra campo de código apenas se houver extintores selecionados */}
                        {selectedEquipment.some(eq => eq.type === 'extintor') && (
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                              Código de Planta/Instalação <span className="text-xs text-gray-400">(obrigatório para formato industrial)</span>
                            </label>
                            <input
                              type="text"
                              value={locationCode}
                              onChange={(e) => setLocationCode(e.target.value)}
                              placeholder="Ex: 7036"
                              className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                              style={{
                                backgroundColor: 'rgba(26, 26, 26, 0.95)',
                                borderColor: '#2A2A2A',
                                color: '#FFFFFF',
                              }}
                            />
                            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(252, 61, 57, 0.1)', borderColor: '#FC3D39', borderWidth: '1px' }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                                ⚠️ Importante:
                              </p>
                              <p className="text-xs mb-2" style={{ color: '#B0B0B0' }}>
                                Este código <strong>NÃO é a localização física</strong> do equipamento (latitude/longitude ou nome do local). É um <strong>código numérico de identificação da planta/instalação</strong> usado especificamente no formato industrial do QR code.
                              </p>
                              <p className="text-xs font-semibold mt-3 mb-1" style={{ color: '#FFFFFF' }}>
                                📋 Formato Industrial para Extintores:
                              </p>
                              <p className="text-xs font-mono mb-2" style={{ color: '#B0B0B0' }}>
                                2#[código_planta]#[tipo]#[ID]#[capacidade]#31
                              </p>
                              <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                <strong>Exemplo:</strong> 2#7036#CO2#021769#10#31
                              </p>
                              <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
                                • <strong>Código de Planta:</strong> Identificador numérico da instalação/planta (ex: 7036)
                              </p>
                              <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                • <strong>Tipo:</strong> Primeiras 3 letras do agente extintor (CO2, ABC, PQS)
                              </p>
                              <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                • <strong>ID:</strong> Número de identificação do extintor (6 dígitos)
                              </p>
                              <p className="text-xs" style={{ color: '#B0B0B0' }}>
                                • <strong>Capacidade:</strong> Capacidade em litros
                              </p>
                              <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
                                <strong>Nota:</strong> A localização física (coordenadas ou nome) é armazenada separadamente no cadastro do equipamento.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                          <p className="text-sm mb-2" style={{ color: '#FFFFFF' }}>
                            <strong>{selectedEquipment.length}</strong> equipamento(s) selecionado(s)
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedEquipment([])}
                              className="text-xs underline flex-1"
                              style={{ color: '#FC3D39' }}
                            >
                              Limpar seleção
                            </button>
                            <button
                              onClick={handleGenerateQrCodes}
                              className="px-4 py-2 rounded-lg font-semibold"
                              style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                            >
                              {t('qr.generateQrCodes')}
                            </button>
                          </div>
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
                    {/* Mostra campo de código apenas se houver extintores selecionados */}
                    {selectedEquipment.some(eq => eq.type === 'extintor') && (
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                          Código de Planta/Instalação <span className="text-xs text-gray-400">(obrigatório para formato industrial)</span>
                        </label>
                        <input
                          type="text"
                          value={locationCode}
                          onChange={(e) => setLocationCode(e.target.value)}
                          placeholder="Ex: 7036"
                          className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                          style={{
                            backgroundColor: 'rgba(26, 26, 26, 0.95)',
                            borderColor: '#2A2A2A',
                            color: '#FFFFFF',
                          }}
                        />
                        <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(252, 61, 57, 0.1)', borderColor: '#FC3D39', borderWidth: '1px' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                            ⚠️ Importante:
                          </p>
                          <p className="text-xs mb-2" style={{ color: '#B0B0B0' }}>
                            Este código <strong>NÃO é a localização física</strong> do equipamento (latitude/longitude ou nome do local). É um <strong>código numérico de identificação da planta/instalação</strong> usado especificamente no formato industrial do QR code.
                          </p>
                          <p className="text-xs font-semibold mt-3 mb-1" style={{ color: '#FFFFFF' }}>
                            📋 Formato Industrial para Extintores:
                          </p>
                          <p className="text-xs font-mono mb-2" style={{ color: '#B0B0B0' }}>
                            2#[código_planta]#[tipo]#[ID]#[capacidade]#31
                          </p>
                          <p className="text-xs" style={{ color: '#B0B0B0' }}>
                            <strong>Exemplo:</strong> 2#7036#CO2#021769#10#31
                          </p>
                          <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
                            • <strong>Código de Planta:</strong> Identificador numérico da instalação/planta (ex: 7036)
                          </p>
                          <p className="text-xs" style={{ color: '#B0B0B0' }}>
                            • <strong>Tipo:</strong> Primeiras 3 letras do agente extintor (CO2, ABC, PQS)
                          </p>
                          <p className="text-xs" style={{ color: '#B0B0B0' }}>
                            • <strong>ID:</strong> Número de identificação do extintor (6 dígitos)
                          </p>
                          <p className="text-xs" style={{ color: '#B0B0B0' }}>
                            • <strong>Capacidade:</strong> Capacidade em litros
                          </p>
                          <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
                            <strong>Nota:</strong> A localização física (coordenadas ou nome) é armazenada separadamente no cadastro do equipamento.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A' }}>
                    <p className="text-sm mb-2" style={{ color: '#FFFFFF' }}>
                      <strong>{selectedEquipment.length}</strong> equipamento(s) selecionado(s)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedEquipment([])}
                        className="text-xs underline flex-1"
                        style={{ color: '#FC3D39' }}
                      >
                        Limpar seleção
                      </button>
                      <button
                        onClick={handleGenerateQrCodes}
                        className="px-4 py-2 rounded-lg font-semibold"
                        style={{ backgroundColor: '#FC3D39', color: '#FFFFFF' }}
                      >
                        {t('qr.generateQrCodes')}
                      </button>
                    </div>
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
                  Código de Planta/Instalação <span className="text-xs text-gray-400">(opcional - usado apenas para extintores encontrados)</span>
                </label>
                <input
                  type="text"
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value)}
                  placeholder="Ex: 7036"
                  className="w-full p-3 rounded-lg border bg-light-surface dark:bg-dark-surface text-white placeholder:text-gray-500"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: '#2A2A2A',
                    color: '#FFFFFF',
                  }}
                />
                <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(252, 61, 57, 0.1)', borderColor: '#FC3D39', borderWidth: '1px' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                    ⚠️ Importante:
                  </p>
                  <p className="text-xs mb-2" style={{ color: '#B0B0B0' }}>
                    Este código <strong>NÃO é a localização física</strong> (latitude/longitude ou nome do local). É um <strong>código numérico de identificação da planta/instalação</strong> usado apenas no formato industrial do QR code.
                  </p>
                  <p className="text-xs font-semibold mt-3 mb-1" style={{ color: '#FFFFFF' }}>
                    📋 Como funciona:
                  </p>
                  <p className="text-xs mb-2" style={{ color: '#B0B0B0' }}>
                    <strong>Para Extintores encontrados:</strong> O código será usado no formato industrial:
                  </p>
                  <p className="text-xs font-mono mb-2" style={{ color: '#B0B0B0' }}>
                    2#[código_planta]#[tipo]#[ID]#[capacidade]#31
                  </p>
                  <p className="text-xs" style={{ color: '#B0B0B0' }}>
                    <strong>Exemplo:</strong> 2#7036#CO2#021769#10#31
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
                    • <strong>Código de Planta:</strong> Identificador numérico da instalação/planta (ex: 7036)
                  </p>
                  <p className="text-xs" style={{ color: '#B0B0B0' }}>
                    • <strong>Tipo:</strong> Primeiras 3 letras do agente extintor (CO2, ABC, PQS)
                  </p>
                  <p className="text-xs" style={{ color: '#B0B0B0' }}>
                    • <strong>ID:</strong> Número de identificação do extintor (6 dígitos)
                  </p>
                  <p className="text-xs" style={{ color: '#B0B0B0' }}>
                    • <strong>Capacidade:</strong> Capacidade em litros
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#B0B0B0' }}>
                    <strong>Para outros equipamentos ou textos não encontrados:</strong> O QR code conterá apenas o ID/série ou texto digitado.
                  </p>
                </div>
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
                  <span>{loading ? <ButtonSkeleton width="w-24" className="inline-block" /> : t('qr.downloadAllZip')}</span>
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

