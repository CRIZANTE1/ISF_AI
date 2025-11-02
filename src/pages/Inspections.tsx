import { Link } from 'react-router-dom';
import { Shield, Flame, Warehouse, SprayCan, LifeBuoy, Factory, Siren, Construction, Droplets, AlertTriangle, Home } from 'lucide-react';
import InspectionCategory from '../components/InspectionCategory';

const sciItems = [
  { name: 'Extintores', link: '/inspections/extintor', icon: <Flame size={20} /> },
  { name: 'Mangueiras', link: '/inspections/mangueira', icon: <Shield size={20} /> },
  { name: 'Câmaras de Espuma', link: '/inspections/camara_espuma', icon: <Factory size={20} /> },
  { name: 'Canhões Monitores', link: '/inspections/canhao_monitor', icon: <SprayCan size={20} /> },
  { name: 'Chuveiros/Lava-olhos', link: '/inspections/chuveiro_lavaolhos', icon: <Droplets size={20} /> },
  { name: 'Sistemas de Alarme', link: '/inspections/alarme', icon: <AlertTriangle size={20} /> },
];

const safetyItems = [
  { name: 'Medidores Multigás', link: '/inspections/multigas', icon: <Siren size={20} /> },
  { name: 'Conjuntos Autônomos (SCBA)', link: '/inspections/scba', icon: <LifeBuoy size={20} /> },
  { name: 'Abrigos de Emergência', link: '/inspections/abrigo', icon: <Home size={20} /> },
];

const Inspections = () => {
  return (
    <div>
      <header className="flex items-center h-14 px-4">
        <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Inspeções</h1>
      </header>
      <main className="flex flex-col">
        <InspectionCategory title="SCI - Sistema de Combate a Incêndio" icon={<Flame />}>
          {sciItems.map(item => (
            <Link key={item.name} to={item.link} className="flex items-center gap-4 p-3 rounded-lg hover:bg-light-background dark:hover:bg-dark-background">
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </InspectionCategory>
        <InspectionCategory title="Equipamentos de Segurança" icon={<Construction />}>
          {safetyItems.map(item => (
            <Link key={item.name} to={item.link} className="flex items-center gap-4 p-3 rounded-lg hover:bg-light-background dark:hover:bg-dark-background">
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </InspectionCategory>
      </main>
    </div>
  );
};
export default Inspections;
