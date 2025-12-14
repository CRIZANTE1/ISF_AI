import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import ExtinguisherForm from '../components/forms/ExtinguisherForm';
import HoseForm from '../components/forms/HoseForm';
import ScbaForm from '../components/forms/ScbaForm';
import MultigasForm from '../components/forms/MultigasForm';
import FoamChamberForm from '../components/forms/FoamChamberForm';
import { saveNewExtinguisher } from '../utils/extinguisherOperations';
import { saveNewHose } from '../utils/hoseOperations';
import { saveNewSCBA } from '../utils/scbaOperations';
import { saveNewMultigasDetector } from '../utils/multigasOperations';
import { saveNewFoamChamber } from '../utils/foamChamberOperations';
import { saveNewCannonMonitor } from '../utils/cannonMonitorOperations';
import { saveNewEyewashStation } from '../utils/eyewashOperations';
import { saveNewAlarmSystem } from '../utils/alarmOperations';
import { saveNewShelter } from '../utils/shelterOperations';
import { generateAutoEquipmentId } from '../utils/equipmentIdGenerator';
import { getCustomEquipmentTypeById, saveCustomEquipment, getAllCustomEquipmentTypes } from '../utils/customEquipmentOperations';
import CustomEquipmentForm from '../components/forms/CustomEquipmentForm';
import { useState as useStateReact, useEffect } from 'react';
import { logger } from '../utils/logger';

const AddEquipmentPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { refreshCache } = useEquipmentCache();
  const { executeWithFeedback } = useErrorHandler();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isCustomType, setIsCustomType] = useStateReact(false);
  const [customTypeId, setCustomTypeId] = useStateReact<string | null>(null);
  const [customType, setCustomType] = useStateReact<any>(null);
  const [customEquipmentCount, setCustomEquipmentCount] = useStateReact<number | null>(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<any>();

  // Verifica se é tipo customizado e conta equipamentos existentes
  useEffect(() => {
    const checkCustomType = async () => {
      if (!type || !type.startsWith('custom-')) {
        setIsCustomType(false);
        setCustomEquipmentCount(null);
        return;
      }

      try {
        const slug = type.replace('custom-', '');
        const customTypes = await getAllCustomEquipmentTypes();
        const foundType = customTypes.find(t => t.slug === slug);
        
        if (foundType) {
          setIsCustomType(true);
          setCustomTypeId(foundType.id);
          setCustomType(foundType);
          
          // Conta equipamentos customizados do usuário para mostrar limite
          if (user && profile?.plan === 'trial') {
            try {
              const { supabase } = await import('../lib/supabase');
              const { count, error: countError } = await supabase
                .from('custom_equipment')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
              if (countError) {
                logger.warn('Erro ao contar equipamentos customizados', 'equipment', countError);
                setCustomEquipmentCount(null);
              } else {
                setCustomEquipmentCount(count || 0);
              }
            } catch (error) {
              logger.error('Erro ao contar equipamentos customizados', 'equipment', error);
              setCustomEquipmentCount(null);
            }
          } else {
            setCustomEquipmentCount(null);
          }
        } else {
          setIsCustomType(false);
          setCustomEquipmentCount(null);
        }
      } catch (error) {
        logger.error('Erro ao verificar tipo customizado', 'equipment', error);
        setIsCustomType(false);
        setCustomEquipmentCount(null);
      }
    };

    checkCustomType();
  }, [type, user, profile, setIsCustomType, setCustomTypeId, setCustomType, setCustomEquipmentCount]);

  const getEquipmentTypeName = (type: string) => {
    if (isCustomType && customType) {
      return customType.name;
    }

    const typeMap: Record<string, string> = {
      extintor: t('equipment.extinguisher'),
      mangueira: t('equipment.hose'),
      camara_espuma: t('equipment.foamChamber'),
      canhao_monitor: t('equipment.cannonMonitor'),
      chuveiro_lavaolhos: t('equipment.eyewash'),
      alarme: t('equipment.alarm'),
      multigas: t('equipment.multigas'),
      scba: t('equipment.scba'),
      abrigo: t('equipment.shelter'),
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  const equipmentTypeName = type ? getEquipmentTypeName(type) : t('equipment.title');

  const onSubmit = async (formData: any) => {
    if (!user || !type) return;
    setLoading(true);

    // data_cadastro não existe em todas as tabelas
    // Tabelas COM data_cadastro: multigas, camara_espuma, canhao_monitor, chuveiro_lavaolhos, alarme
    // Tabelas SEM data_cadastro: extintor, mangueira, scba, abrigo
    const dataToInsert: any = {
      ...formData,
      user_id: user.id,
    };

    // Adiciona data_cadastro apenas para tipos que suportam essa coluna
    const tablesWithDataCadastro = ['multigas', 'camara_espuma', 'canhao_monitor', 'chuveiro_lavaolhos', 'alarme'];
    if (tablesWithDataCadastro.includes(type)) {
      dataToInsert.data_cadastro = new Date().toISOString().split('T')[0];
    }

    let saveFunction: (data: any) => Promise<boolean>;
    let generatedId: string | null = null; // Armazena o ID gerado para mostrar na mensagem

    switch (type) {
      case 'extintor': {
        // Gera ID automático se não fornecido
        let numeroIdentificacao = formData.numero_identificacao?.trim() || formData.equipment_id?.trim();
        if (!numeroIdentificacao) {
          numeroIdentificacao = await generateAutoEquipmentId(type, user.id);
          generatedId = numeroIdentificacao;
        }
        
        // Extrai dados de specifications se existirem (compatibilidade com formulário antigo)
        const extinguisherData: any = {
          ...dataToInsert,
          numero_identificacao: numeroIdentificacao,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
        };
        
        // Se houver specifications, extrai os campos para o nível superior
        if (formData.specifications) {
          if (formData.specifications.tipo_agente) {
            extinguisherData.tipo_agente = formData.specifications.tipo_agente;
          }
          if (formData.specifications.capacidade !== undefined) {
            extinguisherData.capacidade = formData.specifications.capacidade;
          }
          // Remove specifications para não tentar salvar essa coluna inexistente
          delete extinguisherData.specifications;
        }
        
        saveFunction = () => saveNewExtinguisher(extinguisherData);
        break;
      }
      case 'mangueira': {
        let idMangueira = formData.id_mangueira?.trim() || formData.equipment_id?.trim();
        if (!idMangueira) {
          idMangueira = await generateAutoEquipmentId(type, user.id);
          generatedId = idMangueira;
        }
        saveFunction = () => saveNewHose({
          id_mangueira: idMangueira,
          ...dataToInsert,
        });
        break;
      }
      case 'scba': {
        let numeroSerie = formData.numero_serie_equipamento?.trim() || formData.equipment_id?.trim();
        if (!numeroSerie) {
          numeroSerie = await generateAutoEquipmentId(type, user.id);
          generatedId = numeroSerie;
        }
        saveFunction = () => saveNewSCBA({
          numero_serie_equipamento: numeroSerie,
          ...dataToInsert,
        });
        break;
      }
      case 'multigas': {
        let idEquipamentoMultigas = formData.id_equipamento?.trim() || formData.equipment_id?.trim();
        if (!idEquipamentoMultigas) {
          idEquipamentoMultigas = await generateAutoEquipmentId(type, user.id);
          generatedId = idEquipamentoMultigas;
        }
        saveFunction = () => saveNewMultigasDetector({
          id_equipamento: idEquipamentoMultigas,
          ...dataToInsert,
        });
        break;
      }
      case 'camara_espuma': {
        let idCamara = formData.id_camara?.trim() || formData.equipment_id?.trim();
        if (!idCamara) {
          idCamara = await generateAutoEquipmentId(type, user.id);
          generatedId = idCamara;
        }
        // Se numero_mcs for "outro", usa o valor de numero_mcs_custom
        let numeroMCS = formData.numero_mcs;
        if (numeroMCS === 'outro' && formData.numero_mcs_custom) {
          numeroMCS = formData.numero_mcs_custom.trim();
        }
        saveFunction = () => saveNewFoamChamber({
          id_camara: idCamara,
          localizacao: formData.localizacao,
          numero_mcs: numeroMCS || undefined,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          ...dataToInsert,
        });
        break;
      }
      case 'canhao_monitor': {
        let idEquipamentoCanhao = formData.id_equipamento?.trim() || formData.equipment_id?.trim();
        if (!idEquipamentoCanhao) {
          idEquipamentoCanhao = await generateAutoEquipmentId(type, user.id);
          generatedId = idEquipamentoCanhao;
        }
        saveFunction = () => saveNewCannonMonitor({
          id_equipamento: idEquipamentoCanhao,
          localizacao: formData.localizacao,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          ...dataToInsert,
        });
        break;
      }
      case 'chuveiro_lavaolhos': {
        let idEquipamentoChuveiro = formData.id_equipamento?.trim() || formData.equipment_id?.trim();
        if (!idEquipamentoChuveiro) {
          idEquipamentoChuveiro = await generateAutoEquipmentId(type, user.id);
          generatedId = idEquipamentoChuveiro;
        }
        saveFunction = () => saveNewEyewashStation({
          id_equipamento: idEquipamentoChuveiro,
          localizacao: formData.localizacao,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          ...dataToInsert,
        });
        break;
      }
      case 'alarme': {
        let idSistema = formData.id_sistema?.trim() || formData.equipment_id?.trim();
        if (!idSistema) {
          idSistema = await generateAutoEquipmentId(type, user.id);
          generatedId = idSistema;
        }
        saveFunction = () => saveNewAlarmSystem({
          id_sistema: idSistema,
          localizacao: formData.localizacao || '',
          ...dataToInsert,
        });
        break;
      }
      case 'abrigo': {
        let idAbrigo = formData.id_abrigo?.trim() || formData.equipment_id?.trim();
        if (!idAbrigo) {
          idAbrigo = await generateAutoEquipmentId(type, user.id);
          generatedId = idAbrigo;
        }
        saveFunction = () => saveNewShelter({
          id_abrigo: idAbrigo,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          ...dataToInsert,
        });
        break;
      }
      default:
        // Verifica se é tipo customizado
        if (isCustomType && customTypeId) {
          const idFieldName = customType?.id_field_name || 'id_equipamento';
          let equipmentId = formData[idFieldName]?.trim() || formData.equipment_id?.trim();
          
          if (!equipmentId) {
            // Gera ID automático para tipo customizado
            const prefix = customType?.slug?.toUpperCase().substring(0, 3) || 'CUS';
            const now = new Date();
            const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const randomPart = Math.floor(100 + Math.random() * 900);
            equipmentId = `${prefix}-${datePart}-${timePart}-${randomPart}`;
            generatedId = equipmentId;
          }

          const customEquipmentData: any = {
            equipment_type_id: customTypeId,
            id_equipamento: equipmentId,
            data_cadastro: customType?.has_data_cadastro ? new Date().toISOString().split('T')[0] : undefined,
            localizacao: customType?.requires_location ? formData.localizacao : undefined,
            latitude: customType?.requires_gps && formData.latitude ? Number(formData.latitude) : undefined,
            longitude: customType?.requires_gps && formData.longitude ? Number(formData.longitude) : undefined,
            custom_fields: formData.custom_fields || {},
          };

          saveFunction = () => saveCustomEquipment(customEquipmentData);
        } else {
          setLoading(false);
          return;
        }
        break;
    }

    // Monta mensagem de sucesso personalizada
    let successMessage = 'Equipamento cadastrado com sucesso!';
    if (generatedId) {
      successMessage = `Equipamento cadastrado com sucesso!\n\nID gerado automaticamente: ${generatedId}`;
    }

    const success = await executeWithFeedback(
      saveFunction,
      'equipment',
      successMessage,
      'Falha ao cadastrar equipamento. Verifique se o ID já existe.'
    );

    if (success) {
      // Atualiza o cache imediatamente para que o novo equipamento apareça na lista
      try {
        await refreshCache();
      } catch (error) {
        // Log do erro mas não impede a navegação
        logger.error('Erro ao atualizar cache', 'equipment', error);
      }
      navigate(`/inspections/${type}`);
    }
    
    setLoading(false);
  };

  const renderSpecificForm = () => {
    switch (type) {
      case 'extintor':
        return <ExtinguisherForm register={register} errors={errors} />;
      case 'mangueira':
        return <HoseForm register={register} />;
      case 'scba':
        return <ScbaForm register={register} />;
      case 'multigas':
        return <MultigasForm register={register} />;
      case 'camara_espuma':
        return <FoamChamberForm register={register} errors={errors} watch={watch} />;
      default:
        return null;
    }
  };

  const getEquipmentIdField = () => {
    if (isCustomType && customType) {
      return { name: customType.id_field_name || 'id_equipamento', label: customType.id_field_label || 'ID do Equipamento' };
    }

    switch (type) {
      case 'extintor':
        return { name: 'numero_identificacao', label: 'Nº Identificação' };
      case 'mangueira':
        return { name: 'id_mangueira', label: 'ID Mangueira' };
      case 'scba':
        return { name: 'numero_serie_equipamento', label: 'Nº Série Equipamento' };
      case 'multigas':
        return { name: 'id_equipamento', label: 'ID Equipamento' };
      case 'camara_espuma':
        return { name: 'id_camara', label: 'ID Câmara' };
      case 'canhao_monitor':
        return { name: 'id_equipamento', label: 'ID Equipamento' };
      case 'chuveiro_lavaolhos':
        return { name: 'id_equipamento', label: 'ID Equipamento' };
      case 'alarme':
        return { name: 'id_sistema', label: 'ID Sistema' };
      case 'abrigo':
        return { name: 'id_abrigo', label: 'ID Abrigo' };
      default:
        return { name: 'equipment_id', label: 'ID do Equipamento' };
    }
  };

  const idField = getEquipmentIdField();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'equipment.add', defaultValue: `Adicionar ${equipmentTypeName}` }} />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor={idField.name} className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {idField.label}
            </label>
            <input
              id={idField.name}
              {...register(idField.name)}
              placeholder={`Deixe vazio para gerar automaticamente`}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
            <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
              💡 <strong>Opcional:</strong> Se deixar vazio, um ID único será gerado automaticamente
            </p>
            {errors[idField.name as keyof typeof errors] && (
              <p className="text-sm text-status-error mt-1">
                {String(errors[idField.name as keyof typeof errors]?.message)}
              </p>
            )}
          </div>
          
          {/* Campo de localização removido para câmaras de espuma - já está no FoamChamberForm */}
          {/* Campo de localização para tipos padrão */}
          {(type === 'canhao_monitor' || type === 'chuveiro_lavaolhos' || type === 'alarme') && (
            <div className="mb-4">
              <label htmlFor="localizacao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>{t('equipment.location')}</label>
              <input
                id="localizacao"
                {...register('localizacao')}
                className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            </div>
          )}

          {/* Campo de localização para tipos customizados */}
          {isCustomType && customType?.requires_location && (
            <div className="mb-4">
              <label htmlFor="localizacao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>{t('equipment.location')}</label>
              <input
                id="localizacao"
                {...register('localizacao')}
                className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            </div>
          )}

          {/* Campos de GPS para tipos customizados */}
          {isCustomType && customType?.requires_gps && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                Coordenadas GPS <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="Ex: -23.5505"
                    {...register('latitude', { 
                      valueAsNumber: true,
                      min: { value: -90, message: 'Latitude deve estar entre -90 e 90' },
                      max: { value: 90, message: 'Latitude deve estar entre -90 e 90' }
                    })}
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none" 
                    style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="Ex: -46.6333"
                    {...register('longitude', { 
                      valueAsNumber: true,
                      min: { value: -180, message: 'Longitude deve estar entre -180 e 180' },
                      max: { value: 180, message: 'Longitude deve estar entre -180 e 180' }
                    })}
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none" 
                    style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                  />
                </div>
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
                💡 As coordenadas GPS são opcionais no cadastro. A captura automática por GPS ocorre apenas durante as inspeções.
              </p>
            </div>
          )}

          {/* Campos de coordenadas GPS para abrigos */}
          {type === 'abrigo' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                Coordenadas GPS <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="Ex: -23.5505"
                    {...register('latitude', { 
                      valueAsNumber: true,
                      min: { value: -90, message: 'Latitude deve estar entre -90 e 90' },
                      max: { value: 90, message: 'Latitude deve estar entre -90 e 90' }
                    })}
                    className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
                    style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="Ex: -46.6333"
                    {...register('longitude', { 
                      valueAsNumber: true,
                      min: { value: -180, message: 'Longitude deve estar entre -180 e 180' },
                      max: { value: 180, message: 'Longitude deve estar entre -180 e 180' }
                    })}
                    className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
                    style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                  />
                </div>
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
                💡 As coordenadas GPS são opcionais no cadastro. A captura automática por GPS ocorre apenas durante as inspeções.
              </p>
            </div>
          )}


          {type === 'alarme' && (
            <>
              <div className="mb-4">
                <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
                <input
                  id="marca"
                  {...register('marca')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="modelo" className="block text-sm font-medium mb-1">Modelo</label>
                <input
                  id="modelo"
                  {...register('modelo')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
            </>
          )}

          {type === 'abrigo' && (
            <>
              <div className="mb-4">
                <label htmlFor="cliente" className="block text-sm font-medium mb-1">{t('equipment.client', { defaultValue: 'Cliente' })}</label>
                <input
                  id="cliente"
                  {...register('cliente')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="local" className="block text-sm font-medium mb-1">{t('equipment.location')}</label>
                <input
                  id="local"
                  {...register('local')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
            </>
          )}

          {isCustomType && customTypeId ? (
            <>
              {profile?.plan === 'trial' && customEquipmentCount !== null && (
                <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(252, 61, 57, 0.1)', borderColor: '#FC3D39' }}>
                  <p className="text-sm" style={{ color: '#FFFFFF' }}>
                    <strong>Limite do Plano Trial:</strong> Você já criou {customEquipmentCount} de 3 equipamentos customizados permitidos.
                    {customEquipmentCount >= 3 && (
                      <span className="block mt-1 text-red-400">
                        Limite atingido! Faça upgrade para Premium para criar equipamentos ilimitados.
                      </span>
                    )}
                  </p>
                </div>
              )}
              <CustomEquipmentForm
                equipmentTypeId={customTypeId}
                register={register}
                errors={errors}
                watch={watch}
              />
            </>
          ) : (
            renderSpecificForm()
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : t('equipment.saveSuccess', { defaultValue: 'Salvar Equipamento' })}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddEquipmentPage;
