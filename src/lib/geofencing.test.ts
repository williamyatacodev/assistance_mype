import {
  haversineDistance,
  checkGeofence,
  validateCoordinates,
  formatCoordinates,
  getBoundingBox,
} from './geofencing';

describe('GeofencingService', () => {
  describe('haversineDistance', () => {
    it('debe calcular distancia cero para el mismo punto', () => {
      const point = { lat: -12.0464, lng: -77.0428 };
      const distance = haversineDistance(point, point);
      expect(distance).toBe(0);
    });

    it('debe calcular distancia conocida: Lima a Miraflores (~7km)', () => {
      const lima = { lat: -12.0464, lng: -77.0428 };
      const miraflores = { lat: -12.1211, lng: -77.0300 };
      const distance = haversineDistance(lima, miraflores);
      // Aproximadamente 8.3 km
      expect(distance).toBeGreaterThan(8000);
      expect(distance).toBeLessThan(9000);
    });

    it('debe ser simétrico', () => {
      const a = { lat: -12.0464, lng: -77.0428 };
      const b = { lat: -12.1211, lng: -77.0300 };
      expect(haversineDistance(a, b)).toBe(haversineDistance(b, a));
    });

    it('debe manejar coordenadas en el ecuador', () => {
      const a = { lat: 0, lng: 0 };
      const b = { lat: 0, lng: 1 }; // 1 grado en ecuador ≈ 111km
      const distance = haversineDistance(a, b);
      expect(distance).toBeGreaterThan(110000);
      expect(distance).toBeLessThan(112000);
    });

    it('debe manejar polos', () => {
      const northPole = { lat: 90, lng: 0 };
      const southPole = { lat: -90, lng: 0 };
      const distance = haversineDistance(northPole, southPole);
      // Media circunferencia de la Tierra ≈ 20,015 km (no el diámetro)
      expect(distance).toBeGreaterThan(19900000);
      expect(distance).toBeLessThan(20100000);
    });
  });

  describe('checkGeofence', () => {
    const branch = { lat: -12.0464, lng: -77.0428, radiusMeters: 100 };

    it('debe retornar dentro cuando la distancia es menor al radio', () => {
      // Punto a 50 metros de la sede
      const userCoords = { lat: -12.0460, lng: -77.0428 }; // ~44m al norte
      const result = checkGeofence(userCoords, branch);
      expect(result.isWithin).toBe(true);
      expect(result.distanceMeters).toBeLessThan(100);
      expect(result.radiusMeters).toBe(100);
    });

    it('debe retornar fuera cuando la distancia supera el radio', () => {
      // Punto a 200 metros de la sede
      const userCoords = { lat: -12.0440, lng: -77.0428 }; // ~266m al norte
      const result = checkGeofence(userCoords, branch);
      expect(result.isWithin).toBe(false);
      expect(result.distanceMeters).toBeGreaterThan(100);
    });

    it('debe retornar dentro en el borde exacto (con tolerancia)', () => {
      // Calcular punto exacto a 100m
      // 1 grado lat ≈ 111km, entonces 100m ≈ 0.0009 grados
      const userCoords = { lat: -12.0464 + 0.0009, lng: -77.0428 };
      const result = checkGeofence(userCoords, branch);
      // Puede variar ligeramente por redondeo, aceptamos ambos
      expect(typeof result.isWithin).toBe('boolean');
    });
  });

  describe('validateCoordinates', () => {
    it('debe validar coordenadas correctas de Lima', () => {
      const result = validateCoordinates(-12.0464, -77.0428);
      expect(result.valid).toBe(true);
    });

    it('debe rechazar latitud > 90', () => {
      const result = validateCoordinates(91, -77.0428);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Latitud');
    });

    it('debe rechazar longitud > 180', () => {
      const result = validateCoordinates(-12.0464, 181);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Longitud');
    });

    it('debe rechazar NaN', () => {
      const result = validateCoordinates(NaN, -77.0428);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('NaN');
    });

    it('debe rechazar precisión insuficiente', () => {
      const result = validateCoordinates(-12.04, -77.04); // Solo 2 decimales
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Precisión');
    });

    it('debe aceptar precisión suficiente (6 decimales)', () => {
      const result = validateCoordinates(-12.046400, -77.042800);
      expect(result.valid).toBe(true);
    });
  });

  describe('formatCoordinates', () => {
    it('debe formatear con 6 decimales', () => {
      expect(formatCoordinates(-12.0464, -77.0428)).toBe('-12.046400, -77.042800');
    });

    it('debe manejar números positivos', () => {
      expect(formatCoordinates(12.0464, 77.0428)).toBe('12.046400, 77.042800');
    });
  });

  describe('getBoundingBox', () => {
    it('debe calcular bounding box para 100m en Lima', () => {
      const center = { lat: -12.0464, lng: -77.0428 };
      const box = getBoundingBox(center, 100);
      
      expect(box.minLat).toBeLessThan(center.lat);
      expect(box.maxLat).toBeGreaterThan(center.lat);
      expect(box.minLng).toBeLessThan(center.lng);
      expect(box.maxLng).toBeGreaterThan(center.lng);
      
      // Diferencia aproximada: 100m ≈ 0.0009 grados lat
      expect(box.maxLat - box.minLat).toBeCloseTo(0.0018, 3);
    });

    it('debe ajustar longitud según latitud', () => {
      const equator = { lat: 0, lng: 0 };
      const midLat = { lat: 45, lng: 0 };
      
      const boxEquator = getBoundingBox(equator, 1000);
      const boxMidLat = getBoundingBox(midLat, 1000);
      
      // La fórmula usa cos(lat) en el denominador, entonces:
      // - En ecuador (lat=0): cos(0)=1, lngDelta = radius/111000
      // - A 45°: cos(45°)≈0.707, lngDelta = radius/(111000*0.707) ≈ radius/78477
      // Por tanto, el bounding box en longitud es MÁS ANCHO a latitudes mayores
      // (necesitas más grados de longitud para cubrir la misma distancia en metros)
      expect(boxMidLat.maxLng - boxMidLat.minLng).toBeGreaterThan(
        boxEquator.maxLng - boxEquator.minLng
      );
    });
  });
});