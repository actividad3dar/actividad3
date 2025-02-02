import React, { useEffect, useState } from 'react';
import useGeolocation from './useGeolocation';
import { obtenerGasolineras } from './api/gasolineras';

const App = () => {
  const { location, error } = useGeolocation();
  const [gasolineras, setGasolineras] = useState([]);

  useEffect(() => {
    const fetchGasolineras = async () => {
      const data = await obtenerGasolineras();
      if (location) {
        const gasolinerasConDistancia = data.map((g) => {
          const latitud = parseFloat(g['Latitud'].replace(',', '.'));
          const longitud = parseFloat(g['Longitud (WGS84)'].replace(',', '.'));
          const distancia = calcularDistancia(location.lat, location.lon, latitud, longitud);
          return { ...g, latitud, longitud, distancia };
        });
        gasolinerasConDistancia.sort((a, b) => a.distancia - b.distancia);
        setGasolineras(gasolinerasConDistancia.slice(0, 6));
      } else {
        setGasolineras(data.slice(0, 6));
      }
    };

    fetchGasolineras();
  }, [location]);

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  return (
    <div>
      <h1>Gasolineras Cercanas</h1>
      {error && <p>Error: {error}</p>}
      {location && (
        <p>
          Tu ubicación: Latitud {location.lat}, Longitud {location.lon}
        </p>
      )}
      <ul>
        {gasolineras.map((g, index) => (
          <li key={index}>
            {g['Rótulo']} - {g['Precio Gasolina 95 E5']} €/L - {g['Municipio']}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
