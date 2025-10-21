// src/leaflet-icons.ts
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Vite: importer les images comme URL (suffixe ?url)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import iconUrl       from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png?url';

// Configurer les icônes par défaut
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export {};
