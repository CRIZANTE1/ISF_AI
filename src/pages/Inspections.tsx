import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Construction } from 'lucide-react';
import InspectionCategory from '../components/InspectionCategory';
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
  { name: 'Extintores', link: '/inspections/extintor', icon: <ExtinguisherIcon size={32} />, color: '#FC3D39' },
  { name: 'Mangueiras', link: '/inspections/mangueira', icon: <HoseIcon size={32} />, color: '#157EFB' },
  { name: 'Câmaras de Espuma', link: '/inspections/camara_espuma', icon: <FoamChamberIcon size={32} />, color: '#53D769' },
  { name: 'Canhões Monitores', link: '/inspections/canhao_monitor', icon: <CannonMonitorIcon size={32} />, color: '#FC3D39' },
  { name: 'Chuveiros/Lava-olhos', link: '/inspections/chuveiro_lavaolhos', icon: <EyewashIcon size={32} />, color: '#157EFB' },
  { name: 'Sistemas de Alarme', link: '/inspections/alarme', icon: <AlarmIcon size={32} />, color: '#FC3D39' },
];

const safetyItems = [
  { name: 'Medidores Multigás', link: '/inspections/multigas', icon: <MultigasIcon size={32} />, color: '#53D769' },
  { name: 'Conjuntos Autônomos (SCBA)', link: '/inspections/scba', icon: <SCBAIcon size={32} />, color: '#157EFB' },
  { name: 'Abrigos de Emergência', link: '/inspections/abrigo', icon: <ShelterIcon size={32} />, color: '#53D769' },
];

const Inspections = () => {
  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-10 flex items-center h-14 px-ios-4 frosted-glass border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <h1 className="text-xl font-bold text-white">Inspeções</h1>
      </header>
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
                    {item.icon}
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
                    {item.icon}
                  </div>
                  <span className="text-white font-semibold text-base flex-1">{item.name}</span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </InspectionCategory>
      </main>
    </div>
  );
};
export default Inspections;
