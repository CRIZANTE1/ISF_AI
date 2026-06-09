import { useState, useEffect } from 'react';
import { Flame, Waves, Droplet, Target, Bell, Gauge, Shield, Home, Package, Container } from 'lucide-react';
import RadialOrbitalTimeline from '../components/ui/radial-orbital-timeline';
import { useTranslation } from '../hooks/useTranslation';
import { getAllCustomEquipmentTypes, type CustomEquipmentType } from '../utils/customEquipmentOperations';
import * as LucideIcons from 'lucide-react';

const Inspections = () => {
  const { t } = useTranslation();
  const [customTypes, setCustomTypes] = useState<CustomEquipmentType[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);

  useEffect(() => {
    const loadCustomTypes = async () => {
      try {
        const types = await getAllCustomEquipmentTypes();
        setCustomTypes(types);
      } catch (error) {
        // Erro silencioso - tipos customizados podem não existir ainda
      } finally {
        setLoadingCustom(false);
      }
    };
    loadCustomTypes();
  }, []);

  // Função para obter ícone por nome
  const getIconByName = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Package;
    return IconComponent;
  };

  const sciItems = [
    { name: t('inspection.extinguisher'), link: '/inspections/extintor', icon: Flame, color: '#FC3D39' },
    { name: t('inspection.hose'), link: '/inspections/mangueira', icon: Waves, color: '#157EFB' },
    { name: t('inspection.foamChamber'), link: '/inspections/camara_espuma', icon: Droplet, color: '#53D769' },
    { name: t('inspection.cannonMonitor'), link: '/inspections/canhao_monitor', icon: Target, color: '#FC3D39' },
    { name: t('inspection.eyewash'), link: '/inspections/chuveiro_lavaolhos', icon: Droplet, color: '#157EFB' },
    { name: t('inspection.alarm'), link: '/inspections/alarme', icon: Bell, color: '#FC3D39' },
    { name: t('inspection.waterReservoir'), link: '/inspections/reserva_tecnica', icon: Container, color: '#157EFB' },
  ];

  const safetyItems = [
    { name: t('inspection.multigas'), link: '/inspections/multigas', icon: Gauge, color: '#53D769' },
    { name: t('inspection.scba'), link: '/inspections/scba', icon: Shield, color: '#157EFB' },
    { name: t('inspection.shelter'), link: '/inspections/abrigo', icon: Home, color: '#53D769' },
  ];

  // Adiciona tipos customizados
  const customItems = customTypes.map(type => ({
    name: type.name,
    link: `/inspections/custom-${type.slug}`,
    icon: getIconByName(type.icon_name || 'Package'),
    color: '#9B59B6', // Cor padrão para tipos customizados
  }));

  // Combinar todos os itens para o seletor orbital
  const allItems = [...sciItems, ...safetyItems, ...customItems];
  
  const timelineData = allItems.map((item, index) => ({
    id: index + 1,
    title: item.name,
    category: index < sciItems.length ? t('inspection.sci') : t('inspection.safety'),
    icon: item.icon,
    link: item.link,
    color: item.color,
    energy: 100,
    relatedIds: index > 0 ? [index] : [],
  }));

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-ios-4 frosted-glass border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(28, 28, 30, 0.8)' }}>
        <h1 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{t('inspection.title')}</h1>
      </header>
      
      <div
        className="h-[calc(100vh-3.5rem)] relative"
        style={{ backgroundColor: '#000000', zIndex: 1 }}
        data-tour="inspections-orbital"
      >
        <RadialOrbitalTimeline timelineData={timelineData} />
      </div>
    </div>
  );
};

export default Inspections;
