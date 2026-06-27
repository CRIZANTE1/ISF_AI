import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export const LEAFLET_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO';

/** Tema escuro — padrão do app (inspeções e mapa de equipamentos). */
export const LEAFLET_TILE_DARK = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: LEAFLET_TILE_ATTRIBUTION,
} as const;

let iconsConfigured = false;

/** Configura ícones padrão do Leaflet uma única vez. */
export function configureLeafletDefaultIcons(): void {
  if (iconsConfigured) return;

  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });

  iconsConfigured = true;
}
