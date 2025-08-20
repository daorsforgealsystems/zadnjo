import type * as Leaflet from 'leaflet';
import type React from 'react';
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps, PolylineProps } from 'react-leaflet';

export type LeafletComponents = {
  MapContainer: React.ComponentType<MapContainerProps & { children?: React.ReactNode }>;
  TileLayer: React.ComponentType<TileLayerProps>;
  Marker: React.ComponentType<MarkerProps>;
  Popup: React.ComponentType<PopupProps>;
  Polyline: React.ComponentType<PolylineProps>;
  L: typeof Leaflet;
  Icon: typeof Leaflet.Icon;
};

export const loadLeafletComponents = async (): Promise<LeafletComponents> => {
  const [reactLeaflet, leaflet] = await Promise.all([
    import('react-leaflet'),
    import('leaflet')
  ]);

  // Load CSS dynamically
  await import('leaflet/dist/leaflet.css');

  const leafletModule = leaflet as unknown as typeof Leaflet;
  const L = leafletModule;
  const Icon = leafletModule.Icon;

  // Fix for default icon issue with bundlers
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  return {
    MapContainer: reactLeaflet.MapContainer,
    TileLayer: reactLeaflet.TileLayer,
    Marker: reactLeaflet.Marker,
    Popup: reactLeaflet.Popup,
    Polyline: reactLeaflet.Polyline,
    L,
    Icon
  };
};

export const preloadMapComponents = () => {
  void loadLeafletComponents();
};
