/**
 * GeofencingService - Validación de ubicación usando fórmula Haversine
 * Calcula distancia entre coordenadas GPS y verifica si está dentro del radio de la sede
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BranchLocation {
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface GeofenceResult {
  isWithin: boolean;
  distanceMeters: number;
  radiusMeters: number;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula Haversine
 * @param point1 Primer punto (lat, lng)
 * @param point2 Segundo punto (lat, lng)
 * @returns Distancia en metros
 */
export function haversineDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371000; // Radio de la Tierra en metros
  
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Verifica si una coordenada está dentro del radio de una sede
 * @param userCoords Coordenadas del usuario
 * @param branch Ubicación y radio de la sede
 * @returns Resultado con distancia y si está dentro
 */
export function checkGeofence(userCoords: Coordinates, branch: BranchLocation): GeofenceResult {
  const distance = haversineDistance(userCoords, {
    lat: branch.lat,
    lng: branch.lng,
  });

  return {
    isWithin: distance <= branch.radiusMeters,
    distanceMeters: Math.round(distance),
    radiusMeters: branch.radiusMeters,
  };
}

/**
 * Valida coordenadas GPS básicas
 */
export function validateCoordinates(lat: number, lng: number): { valid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Coordenadas deben ser números' };
  }
  
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Coordenadas inválidas (NaN)' };
  }
  
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitud fuera de rango (-90 a 90)' };
  }
  
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitud fuera de rango (-180 a 180)' };
  }
  
  // Verificar precisión razonable (mínimo 4 decimales ≈ 11m)
  const latPrecision = lat.toString().split('.')[1]?.length || 0;
  const lngPrecision = lng.toString().split('.')[1]?.length || 0;
  
  if (latPrecision < 4 || lngPrecision < 4) {
    return { valid: false, error: 'Precisión GPS insuficiente (mínimo 4 decimales)' };
  }
  
  return { valid: true };
}

/**
 * Formatea coordenadas para mostrar
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Calcula el bounding box para consultas espaciales eficientes
 * Útil para filtrar sedes cercanas antes de calcular Haversine exacto
 */
export function getBoundingBox(center: Coordinates, radiusMeters: number): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  // Aproximación: 1 grado ≈ 111km
  const latDelta = radiusMeters / 111000;
  // Longitud varía con latitud: 1 grado ≈ 111km * cos(lat)
  const lngDelta = radiusMeters / (111000 * Math.cos((center.lat * Math.PI) / 180));
  
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}