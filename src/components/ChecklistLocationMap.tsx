import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../hooks/useTranslation';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface ChecklistLocationMapProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  title?: string;
  height?: number;
}

const ChecklistLocationMap = ({
  latitude,
  longitude,
  title,
  height = 200,
}: ChecklistLocationMapProps) => {
  const { t } = useTranslation();

  const lat = latitude != null ? Number(latitude) : NaN;
  const lng = longitude != null ? Number(longitude) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const position: [number, number] = [lat, lng];

  return (
    <div
      className="mb-4 rounded-lg overflow-hidden border"
      style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(28,28,30,0.9)' }}
    >
      <p className="text-xs font-medium px-3 py-2 text-white border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {t('inspection.equipmentLocation', { defaultValue: 'Localização do equipamento' })}
      </p>
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={position}>
            <Popup>
              {title || t('inspection.equipmentLocation', { defaultValue: 'Localização do equipamento' })}
              <br />
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default ChecklistLocationMap;
