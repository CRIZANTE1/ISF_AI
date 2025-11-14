import { Flame, Waves, Droplet, Target, Bell, Gauge, Shield, Home } from 'lucide-react';
import RadialOrbitalTimeline from '../components/ui/radial-orbital-timeline';

const sciItems = [
  { name: 'Extintores', link: '/inspections/extintor', icon: Flame, color: '#FC3D39' },
  { name: 'Mangueiras', link: '/inspections/mangueira', icon: Waves, color: '#157EFB' },
  { name: 'Câmaras de Espuma', link: '/inspections/camara_espuma', icon: Droplet, color: '#53D769' },
  { name: 'Canhões Monitores', link: '/inspections/canhao_monitor', icon: Target, color: '#FC3D39' },
  { name: 'Chuveiros/Lava-olhos', link: '/inspections/chuveiro_lavaolhos', icon: Droplet, color: '#157EFB' },
  { name: 'Sistemas de Alarme', link: '/inspections/alarme', icon: Bell, color: '#FC3D39' },
];

const safetyItems = [
  { name: 'Medidores Multigás', link: '/inspections/multigas', icon: Gauge, color: '#53D769' },
  { name: 'Conjuntos Autônomos (SCBA)', link: '/inspections/scba', icon: Shield, color: '#157EFB' },
  { name: 'Abrigos de Emergência', link: '/inspections/abrigo', icon: Home, color: '#53D769' },
];

const Inspections = () => {
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
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-ios-4 frosted-glass border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(28, 28, 30, 0.8)' }}>
        <h1 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Inspeções</h1>
      </header>
      
      <div className="h-[calc(100vh-3.5rem)] relative" style={{ backgroundColor: '#000000', zIndex: 1 }}>
        <RadialOrbitalTimeline timelineData={timelineData} />
      </div>
    </div>
  );
};

export default Inspections;
