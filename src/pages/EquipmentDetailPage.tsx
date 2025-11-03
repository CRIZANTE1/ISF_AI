import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit } from 'lucide-react';
import { getExtinguisherById } from '../utils/extinguisherOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors, getMultigasDetectorById } from '../utils/multigasOperations';
import { getAllShelters } from '../utils/shelterOperations';
import { getAllHoses } from '../utils/hoseOperations';

type EquipmentInfo = {
  id: string;
  name: string;
  location?: string;
  [key: string]: any;
};

type InspectionInfo = {
  id: number;
  data_inspecao: string;
  status_geral?: string;
  status?: string;
  notes?: string;
  observacoes_gerais?: string;
  plano_de_acao?: string;
  link_foto_nao_conformidade?: string;
};

const EquipmentDetailPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [inspections, setInspections] = useState<InspectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for deletion modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'equipment' | 'inspection'; id: number | string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDetails = async () => {
    if (!id || !type) return;
    
    // Verificar autenticação antes de buscar
    const { data: { session } } = await supabase.auth.getSession();
    console.log('EquipmentDetailPage - User ID:', session?.user?.id, 'Procurando:', type, id);
    
    if (!session?.user) {
      console.error('Usuário não autenticado');
      setError('Você precisa estar autenticado para acessar este equipamento.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let equipmentData: EquipmentInfo | null = null;
      let inspectionsData: InspectionInfo[] = [];

      switch (type) {
        case 'extintor': {
          const extData = await getExtinguisherById(id);
          if (extData) {
            equipmentData = {
              id: extData.numero_identificacao,
              name: extData.numero_identificacao,
              location: extData.local_id || undefined,
              ...extData,
            };
            // Buscar inspeções de extintores
            const { data, error: inspError } = await supabase
              .from('extintores')
              .select('*')
              .eq('numero_identificacao', id)
              .single();
            if (data && !inspError) {
              // Para extintores, as inspeções estão na própria tabela como histórico
              inspectionsData = [];
            }
          }
          break;
        }
        case 'chuveiro_lavaolhos': {
          const stations = await getAllEyewashStations();
          const station = stations.find(e => e.id_equipamento === id);
          if (station) {
            equipmentData = {
              id: station.id_equipamento,
              name: station.id_equipamento,
              location: station.localizacao,
              ...station,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_chuveiros_lava_olhos')
              .select('*')
              .eq('id_equipamento', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral,
                observacoes_gerais: insp.plano_de_acao,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          }
          break;
        }
        case 'camara_espuma': {
          const chambers = await getAllFoamChambers();
          const chamber = chambers.find(e => e.id_camara === id);
          if (chamber) {
            equipmentData = {
              id: chamber.id_camara,
              name: chamber.id_camara,
              location: chamber.localizacao,
              ...chamber,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_camaras_espuma')
              .select('*')
              .eq('id_camara', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          }
          break;
        }
        case 'alarme': {
          const systems = await getAllAlarmSystems();
          const system = systems.find(e => e.id_sistema === id);
          if (system) {
            equipmentData = {
              id: system.id_sistema,
              name: system.id_sistema,
              location: system.localizacao,
              ...system,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_alarmes')
              .select('*')
              .eq('id_sistema', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          }
          break;
        }
        case 'canhao_monitor': {
          const monitors = await getAllCannonMonitors();
          const monitor = monitors.find(e => e.id_equipamento === id);
          if (monitor) {
            equipmentData = {
              id: monitor.id_equipamento,
              name: monitor.id_equipamento,
              location: monitor.localizacao,
              ...monitor,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_canhoes_monitores')
              .select('*')
              .eq('id_equipamento', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          }
          break;
        }
        case 'scba': {
          const scbas = await getAllSCBAs();
          const scba = scbas.find(e => e.numero_serie_equipamento === id);
          if (scba) {
            equipmentData = {
              id: scba.numero_serie_equipamento,
              name: scba.numero_serie_equipamento,
              location: undefined, // conjuntos_autonomos não tem coluna localizacao
              ...scba,
            };
            const { data: inspData, error: inspError } = await supabase
              .from('inspecoes_scba')
              .select('*')
              .eq('numero_serie_equipamento', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && inspData) {
              inspectionsData = inspData.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          } else {
            console.log('SCBA não encontrado:', id, 'Total de SCBAs:', scbas.length, 'IDs encontrados:', scbas.map(s => s.numero_serie_equipamento));
          }
          break;
        }
        case 'multigas': {
          // Buscar diretamente por ID usando a função específica
          console.log('Buscando MULT-001 no EquipmentDetailPage, id:', id);
          const detector = await getMultigasDetectorById(id);
          if (detector) {
            console.log('Detector encontrado no EquipmentDetailPage:', detector);
            equipmentData = {
              id: detector.id_equipamento,
              name: detector.id_equipamento,
              location: undefined, // inventario_multigas não tem coluna localizacao
              ...detector,
            };
            const { data: inspData, error: inspError } = await supabase
              .from('inspecoes_multigas')
              .select('*')
              .eq('id_equipamento', id)
              .order('data_teste', { ascending: false });
            if (!inspError && inspData) {
              inspectionsData = inspData.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_teste || '',
                status_geral: insp.resultado_teste || '',
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          } else {
            console.error('Multigas não encontrado no EquipmentDetailPage:', id);
            // Fallback: tentar buscar todos para debug
            const allDetectors = await getAllMultigasDetectors();
            console.log('Total de detectores disponíveis:', allDetectors.length, 'IDs:', allDetectors.map(d => d.id_equipamento));
            
            // Tentar buscar diretamente via Supabase sem usar a função wrapper
            const { data: directData, error: directError } = await supabase
              .from('inventario_multigas')
              .select('*')
              .eq('id_equipamento', id)
              .maybeSingle();
            
            console.log('Tentativa direta Supabase - data:', directData, 'error:', directError);
            
            if (directData) {
              equipmentData = {
                id: directData.id_equipamento,
                name: directData.id_equipamento,
                location: undefined,
                ...directData,
              };
            }
          }
          break;
        }
        case 'abrigo': {
          const shelters = await getAllShelters();
          const shelter = shelters.find(e => e.id_abrigo === id);
          if (shelter) {
            equipmentData = {
              id: shelter.id_abrigo,
              name: shelter.id_abrigo,
              location: shelter.local, // abrigos tem coluna 'local' não 'localizacao'
              ...shelter,
            };
            const { data: inspData, error: inspError } = await supabase
              .from('inspecoes_abrigos')
              .select('*')
              .eq('id_abrigo', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && inspData) {
              inspectionsData = inspData.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
              }));
            }
          } else {
            console.log('Abrigo não encontrado:', id, 'Total de abrigos:', shelters.length, 'IDs encontrados:', shelters.map(s => s.id_abrigo));
          }
          break;
        }
        case 'mangueira': {
          const hoses = await getAllHoses();
          const hose = hoses.find(e => e.id_mangueira === id);
          if (hose) {
            equipmentData = {
              id: hose.id_mangueira,
              name: hose.id_mangueira,
              location: hose.localizacao,
              ...hose,
            };
            inspectionsData = [];
          }
          break;
        }
      }

      if (!equipmentData) {
        setError(`Equipamento não encontrado. Verifique se o ID '${id}' está correto.`);
      } else {
        setEquipment(equipmentData);
        setInspections(inspectionsData);
      }
    } catch (err: any) {
      setError('Falha ao buscar detalhes do equipamento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, type]);

  const handleDeleteClick = (deleteType: 'equipment' | 'inspection', deleteId: number | string) => {
    setItemToDelete({ type: deleteType, id: deleteId });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !type) return;
    setIsDeleting(true);
    setError(null);

    try {
      if (itemToDelete.type === 'equipment') {
        // Determinar qual tabela usar baseado no tipo
        let tableName = '';
        let idColumn = '';
        
        switch (type) {
          case 'extintor':
            tableName = 'extintores';
            idColumn = 'numero_identificacao';
            break;
          case 'chuveiro_lavaolhos':
            tableName = 'inventario_chuveiros_lava_olhos';
            idColumn = 'id_equipamento';
            break;
          case 'camara_espuma':
            tableName = 'inventario_camaras_espuma';
            idColumn = 'id_camara';
            break;
          case 'alarme':
            tableName = 'inventario_alarmes';
            idColumn = 'id_sistema';
            break;
          case 'canhao_monitor':
            tableName = 'inventario_canhoes_monitores';
            idColumn = 'id_equipamento';
            break;
          case 'scba':
            tableName = 'conjuntos_autonomos';
            idColumn = 'numero_serie_equipamento';
            break;
          case 'multigas':
            tableName = 'inventario_multigas';
            idColumn = 'id_equipamento';
            break;
          case 'abrigo':
            tableName = 'abrigos';
            idColumn = 'id_abrigo';
            break;
          case 'mangueira':
            tableName = 'mangueiras';
            idColumn = 'id_mangueira';
            break;
        }

        if (tableName && idColumn) {
          const { error } = await supabase
            .from(tableName as any)
            .delete()
            .eq(idColumn, itemToDelete.id);
          if (error) throw error;
          navigate(`/inspections/${type}`);
        }
      } else {
        // Deletar inspeção baseado no tipo
        let tableName = '';
        
        switch (type) {
          case 'chuveiro_lavaolhos':
            tableName = 'inspecoes_chuveiros_lava_olhos';
            break;
          case 'camara_espuma':
            tableName = 'inspecoes_camaras_espuma';
            break;
          case 'alarme':
            tableName = 'inspecoes_alarmes';
            break;
          case 'canhao_monitor':
            tableName = 'inspecoes_canhoes_monitores';
            break;
          case 'scba':
            tableName = 'inspecoes_scba';
            break;
          case 'multigas':
            tableName = 'inspecoes_multigas';
            break;
          case 'abrigo':
            tableName = 'inspecoes_abrigos';
            break;
        }

        if (tableName) {
          const { error } = await supabase
            .from(tableName as any)
            .delete()
            .eq('id', itemToDelete.id);
          if (error) throw error;
          setInspections(inspections.filter(insp => insp.id !== itemToDelete.id));
        }
      }
    } catch (err) {
      setError(`Falha ao excluir o item. Tente novamente.`);
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return 'bg-gray-200 dark:bg-gray-700';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('aprovado') || statusLower === 'ok') return 'bg-status-success/20 text-status-success';
    if (statusLower.includes('reprovado') || statusLower.includes('nao conforme')) return 'bg-status-error/20 text-status-error';
    if (statusLower.includes('pendente')) return 'bg-status-warning/20 text-status-warning';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  const modalTitle = itemToDelete?.type === 'equipment' ? 'Excluir Equipamento' : 'Excluir Inspeção';
  const modalMessage = `Você tem certeza que deseja excluir este item? Esta ação é irreversível e todos os dados associados serão perdidos.`;

  return (
    <div className="min-h-screen">
      <PageHeader title={loading ? 'Carregando...' : equipment?.name ?? 'Detalhes'}>
        {!loading && equipment && (
          <div className="flex items-center gap-2">
            <Link to={`/equipment/${type}/${id}/edit`} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-accent-cyan transition-colors">
              <Edit size={20} />
            </Link>
            <button onClick={() => handleDeleteClick('equipment', id)} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </PageHeader>
      <main className="p-4">
        {loading && <Skeleton className="h-48 w-full" />}
        {error && <p className="mb-4 text-center text-status-error">{error}</p>}
        {!loading && equipment && (
          <>
            <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border mb-6">
              <h2 className="font-bold text-lg mb-2">Detalhes</h2>
              <p><span className="font-semibold">ID:</span> {equipment.name}</p>
              {equipment.location && (
                <p><span className="font-semibold">Localização:</span> {equipment.location}</p>
              )}
            </div>

            <div className="mb-6">
              <Link
                to={`/equipment/${type}/${id}/inspections/new`}
                className="w-full text-center block p-3 bg-accent-cyan text-white font-bold rounded-lg hover:bg-accent-cyan hover:opacity-90 transition-colors"
              >
                Registrar Nova Inspeção
              </Link>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-2">Histórico de Inspeções</h2>
              {inspections.length > 0 ? (
                <ul className="space-y-3">
                  {inspections.map(insp => (
                    <li key={insp.id} className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold">{format(new Date(insp.data_inspecao), "dd/MM/yyyy", { locale: ptBR })}</p>
                          {insp.status_geral && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(insp.status_geral)}`}>
                              {insp.status_geral}
                            </span>
                          )}
                        </div>
                        {insp.plano_de_acao && (
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            {insp.plano_de_acao}
                          </p>
                        )}
                        {insp.link_foto_nao_conformidade && (
                          <a href={insp.link_foto_nao_conformidade} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-cyan mt-1 block">
                            Ver foto de evidência
                          </a>
                        )}
                      </div>
                      <button onClick={() => handleDeleteClick('inspection', insp.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors flex-shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-4">Nenhuma inspeção registrada.</p>
              )}
            </div>
          </>
        )}
      </main>
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={modalTitle}
        message={modalMessage}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EquipmentDetailPage;
