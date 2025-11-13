import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Construction } from 'lucide-react';
import InspectionCategory from '../components/InspectionCategory';
import RadialOrbitalTimeline from '../components/ui/radial-orbital-timeline';
import {
  ExtinguisherIcon,
  HoseIcon,
  FoamChamberIcon,
  CannonMonitorIcon,
  EyewashIcon,
  AlarmIcon,
  MultigasIcon,
  SCBAIcon,
  ShelterIcon,
} from '../components/EquipmentIcons';

const sciItems = [
  { name: 'Extintores', link: '/inspections/extintor', icon: ExtinguisherIcon, color: '#FC3D39' },
  { name: 'Mangueiras', link: '/inspections/mangueira', icon: HoseIcon, color: '#157EFB' },
  { name: 'Câmaras de Espuma', link: '/inspections/camara_espuma', icon: FoamChamberIcon, color: '#53D769' },
  { name: 'Canhões Monitores', link: '/inspections/canhao_monitor', icon: CannonMonitorIcon, color: '#FC3D39' },
  { name: 'Chuveiros/Lava-olhos', link: '/inspections/chuveiro_lavaolhos', icon: EyewashIcon, color: '#157EFB' },
  { name: 'Sistemas de Alarme', link: '/inspections/alarme', icon: AlarmIcon, color: '#FC3D39' },
];

const safetyItems = [
  { name: 'Medidores Multigás', link: '/inspections/multigas', icon: MultigasIcon, color: '#53D769' },
  { name: 'Conjuntos Autônomos (SCBA)', link: '/inspections/scba', icon: SCBAIcon, color: '#157EFB' },
  { name: 'Abrigos de Emergência', link: '/inspections/abrigo', icon: ShelterIcon, color: '#53D769' },
];

const Inspections = () => {
  const [viewMode, setViewMode] = useState<'list' | 'orbital'>('orbital');

  // Combinar todos os itens para o seletor orbital
  const allItems = [...sciItems, ...safetyItems];
  
  const timelineData = allItems.map((item, index) => ({
    id: index + 1,
    title: item.name,
    category: index < sciItems.length ? 'SCI' : 'Segurança',
    icon: item.icon,
    link: item.link,
    color: item.color,
    energy: 100,
    relatedIds: index > 0 ? [index] : [],
  }));

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-ios-4 frosted-glass border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <h1 className="text-xl font-bold text-white">Inspeções</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`
              px-3 py-1 rounded-lg text-sm transition-colors
              ${viewMode === 'list' 
                ? 'bg-white text-black' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
              }
            `}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('orbital')}
            className={`
              px-3 py-1 rounded-lg text-sm transition-colors
              ${viewMode === 'orbital' 
                ? 'bg-white text-black' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
              }
            `}
          >
            Orbital
          </button>
        </div>
      </header>
      
      {viewMode === 'orbital' ? (
        <div className="h-[calc(100vh-3.5rem)]">
          <RadialOrbitalTimeline timelineData={timelineData} />
        </div>
      ) : (
        <main className="flex flex-col px-ios-4 py-ios-6">
          <InspectionCategory title="SCI - Sistema de Combate a Incêndio" icon={<Flame size={20} style={{ color: '#FC3D39' }} />}>
            {sciItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={item.link}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="apple-card flex items-center gap-4 p-ios-4 mb-ios-3 cursor-pointer group"
                    style={{
                      backgroundColor: item.color,
                      borderRadius: '24px',
                      boxShadow: `0 2px 8px ${item.color}40`,
                    }}
                  >
                    <div className="flex-shrink-0">
                      <item.icon size={32} />
                    </div>
                    <span className="text-white font-semibold text-base flex-1">{item.name}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </InspectionCategory>
          
          <InspectionCategory title="Equipamentos de Segurança" icon={<Construction size={20} style={{ color: '#157EFB' }} />}>
            {safetyItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (sciItems.length + index) * 0.1 }}
              >
                <Link to={item.link}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="apple-card flex items-center gap-4 p-ios-4 mb-ios-3 cursor-pointer group"
                    style={{
                      backgroundColor: item.color,
                      borderRadius: '24px',
                      boxShadow: `0 2px 8px ${item.color}40`,
                    }}
                  >
                    <div className="flex-shrink-0">
                      <item.icon size={32} />
                    </div>
                    <span className="text-white font-semibold text-base flex-1">{item.name}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </InspectionCategory>
        </main>
      )}
    </div>
  );
};

export default Inspections;
