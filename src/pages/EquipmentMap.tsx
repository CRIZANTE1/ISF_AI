import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import LoadingScreen from '../components/LoadingScreen';
import PageHeader from '../components/PageHeader';
import { useTranslation } from '../hooks/useTranslation';
import { 
  ExtinguisherIcon, 
  FoamChamberIcon, 
  CannonMonitorIcon, 
  EyewashIcon, 
  AlarmIcon,
  ShelterIcon
} from '../components/EquipmentIcons';
import { useNavigate } from 'react-router-dom';
import { getCurrentLocation } from '../hooks/useGeolocation';
import { logger } from '../utils/logger';

// Fix para ícones padrão do Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Função para criar ícone customizado baseado no tipo
function createCustomIcon(type: string): Icon {
  // Cores baseadas no tipo de equipamento
  const colors: Record<string, string> = {
    extintor: '#FC3D39',
    camara_espuma: '#53D769',
    canhao_monitor: '#FC3D39',
    chuveiro_lavaolhos: '#157EFB',
    alarme: '#FC3D39',
    abrigo: '#53D769',
  };
  
  const color = colors[type] || '#8E8E93';
  
  // Criar SVG inline para o ícone
  const svgIcon = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="20" cy="20" r="12" fill="#FFFFFF" opacity="0.3"/>
    </svg>
  `;
  
  const svgBlob = new Blob([svgIcon], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  return new Icon({
    iconUrl: svgUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

// Ícone para localização do usuário (azul com ponto central)
function createUserLocationIcon(): Icon {
  const svgIcon = `
    <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="20" fill="#157EFB" opacity="0.3" stroke="#157EFB" stroke-width="2"/>
      <circle cx="25" cy="25" r="12" fill="#157EFB" opacity="0.5"/>
      <circle cx="25" cy="25" r="6" fill="#FFFFFF" stroke="#157EFB" stroke-width="2"/>
    </svg>
  `;
  
  const svgBlob = new Blob([svgIcon], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  return new Icon({
    iconUrl: svgUrl,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  });
}

interface EquipmentMarker {
  id: string;
  type: string;
  serial: string;
  latitude: number;
  longitude: number;
  name?: string;
  status?: string;
}

// Componente para ajustar o zoom do mapa para mostrar todos os marcadores
function MapBounds({ bounds }: { bounds: LatLngBounds | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
}

const EquipmentMap = () => {
  const { t } = useTranslation();
  const { getAllEquipment } = useEquipmentCache();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [markers, setMarkers] = useState<EquipmentMarker[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEquipment = async () => {
      setLoading(true);
      try {
        // Carregar localização do usuário de forma assíncrona (não bloqueia)
        getCurrentLocation().then(location => {
          if (location) {
            setUserLocation(location);
          }
        }).catch(err => {
          // Erro de localização não é crítico, apenas loga
          logger.warn('Erro ao obter localização do usuário', 'permission', err);
        });

        // Processar equipamentos de forma otimizada
        const allEquipment = getAllEquipment();
        const equipmentMarkers: EquipmentMarker[] = [];

        // Processar apenas extintores com localização (otimizado)
        const extinguishers = allEquipment.filter((eq: any) => 
          eq.latitude && eq.longitude && eq.numero_identificacao
        );
        
        // Limitar processamento para não travar
        const maxItems = 1000; // Limite de segurança
        const limitedExtinguishers = extinguishers.slice(0, maxItems);
        
        limitedExtinguishers.forEach((ext: any) => {
          equipmentMarkers.push({
            id: ext.numero_identificacao,
            type: 'extintor',
            serial: ext.numero_identificacao,
            latitude: Number(ext.latitude),
            longitude: Number(ext.longitude),
            name: `Extintor ${ext.numero_identificacao}`,
            status: ext.aprovado_inspecao || 'N/A',
          });
        });
        
        setMarkers(equipmentMarkers);
      } catch (error) {
        handleError(error, 'equipment', t('equipmentMap.errorLoadingEquipment'));
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [getAllEquipment]);

  // Calcular bounds para ajustar o zoom (incluindo localização do usuário)
  const bounds = useMemo(() => {
    const allPoints: { lat: number; lng: number }[] = [];
    
    // Adicionar marcadores de equipamentos
    markers.forEach(m => {
      allPoints.push({ lat: m.latitude, lng: m.longitude });
    });
    
    // Adicionar localização do usuário
    if (userLocation) {
      allPoints.push({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
    
    if (allPoints.length === 0) return null;
    
    const lats = allPoints.map(p => p.lat);
    const lngs = allPoints.map(p => p.lng);
    
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [markers, userLocation]);

  // Centro padrão (Brasil)
  const defaultCenter: [number, number] = [-14.235, -51.9253];
  const defaultZoom = 4;

  // Se houver marcadores ou localização do usuário, usar o centro deles
  const mapCenter = useMemo(() => {
    const allPoints: { lat: number; lng: number }[] = [];
    
    markers.forEach(m => {
      allPoints.push({ lat: m.latitude, lng: m.longitude });
    });
    
    if (userLocation) {
      allPoints.push({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
    
    if (allPoints.length > 0) {
      const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
      const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;
      return [avgLat, avgLng] as [number, number];
    }
    return defaultCenter;
  }, [markers, userLocation]);

  const getIconForType = (type: string) => {
    return createCustomIcon(type);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      extintor: t('equipment.extinguisher'),
      camara_espuma: t('equipment.foamChamber'),
      canhao_monitor: t('equipment.cannonMonitor'),
      chuveiro_lavaolhos: t('equipment.eyewash'),
      alarme: t('equipment.alarm'),
      abrigo: t('equipment.shelter'),
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <LoadingScreen 
        fullScreen={true} 
        size="xl" 
        color="blue"
      />
    );
  }

  return (
    <main className="min-h-screen pb-32" style={{ backgroundColor: '#000000' }}>
      <div className="h-screen flex flex-col" style={{ backgroundColor: '#000000' }}>
        {/* Header compacto para mobile */}
        <div className="px-4 py-3 border-b" style={{ backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h1 className="text-xl font-bold text-foreground">
            {t('equipmentMap.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {markers.length > 0 
              ? t('equipmentMap.equipmentCount', { count: markers.length })
              : t('equipmentMap.noEquipmentFound')
            }
          </p>
        </div>

        {/* Mapa ocupando todo o espaço disponível */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 120px)' }}>
          <MapContainer
            center={mapCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marcador da localização do usuário */}
            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={createUserLocationIcon()}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm mb-2">{t('equipmentMap.yourLocation')}</h3>
                    <p className="text-xs text-muted-foreground">
                      <strong>{t('equipmentMap.latitude')}</strong> {userLocation.latitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>{t('equipmentMap.longitude')}</strong> {userLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marcadores dos equipamentos */}
            {markers.map((marker) => (
              <Marker
                key={`${marker.type}-${marker.id}`}
                position={[marker.latitude, marker.longitude]}
                icon={getIconForType(marker.type)}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      {marker.type === 'extintor' && <ExtinguisherIcon size={24} />}
                      {marker.type === 'camara_espuma' && <FoamChamberIcon size={24} />}
                      {marker.type === 'canhao_monitor' && <CannonMonitorIcon size={24} />}
                      {marker.type === 'chuveiro_lavaolhos' && <EyewashIcon size={24} />}
                      {marker.type === 'alarme' && <AlarmIcon size={24} />}
                      {marker.type === 'abrigo' && <ShelterIcon size={24} />}
                      <h3 className="font-semibold text-sm">{getTypeLabel(marker.type)}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      <strong>{t('equipmentMap.serialNumber')}</strong> {marker.serial}
                    </p>
                    {marker.status && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>{t('equipmentMap.status')}</strong> {marker.status}
                      </p>
                    )}
                    <button
                      onClick={() => navigate(`/equipment/${marker.type}/${marker.id}`)}
                      className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                    >
                      {t('equipmentMap.viewDetails')}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {bounds && <MapBounds bounds={bounds} />}
          </MapContainer>
          
          {markers.length === 0 && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1000] bg-black/70 dark:bg-black/80 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 max-w-[90%]">
              <p className="text-white text-center text-sm font-medium">
                {t('equipmentMap.noEquipmentWithLocation')}
              </p>
              <p className="text-xs text-white/80 mt-1 text-center">
                {t('equipmentMap.registerWithGeolocation')}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default EquipmentMap;

