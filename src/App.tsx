import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";

// Interfaz para los datos de la API
interface GasolineraAPI {
  "Rótulo": string;
  "Dirección": string;
  "Municipio": string;
  "Latitud": string;
  "Longitud": string;
  "Precio Gasolina 95 E5": string;
}

// Interfaz para nuestros datos procesados
interface GasolineraProcessed extends GasolineraAPI {
  latitud: number;
  longitud: number;
  distancia: number;
}

interface APIResponse {
  Fecha: string;
  ListaEESSPrecio: GasolineraAPI[];
}

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R: number = 6371;
  const toRad = (value: number): number => value * (Math.PI / 180);
  
  const lat1Rad: number = toRad(lat1);
  const lon1Rad: number = toRad(lon1);
  const lat2Rad: number = toRad(lat2);
  const lon2Rad: number = toRad(lon2);
  
  const dLat: number = lat2Rad - lat1Rad;
  const dLon: number = lon2Rad - lon1Rad;
  
  const sinDLat: number = Math.sin(dLat / 2);
  const sinDLon: number = Math.sin(dLon / 2);
  
  const a: number = 
    sinDLat * sinDLat +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLon * sinDLon;
    
  const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const App = () => {
  const { location, error: locationError } = useGeolocation();
  const [gasolineras, setGasolineras] = useState<GasolineraProcessed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGasolineras = async () => {
      if (!location) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/');
        if (!response.ok) {
          throw new Error(`Error en la petición: ${response.status}`);
        }
        
        const data: APIResponse = await response.json();
        
        if (!data?.ListaEESSPrecio || !Array.isArray(data.ListaEESSPrecio)) {
          throw new Error('Formato de datos inválido');
        }

        const gasolinerasConDistancia = data.ListaEESSPrecio
          .filter((g): g is GasolineraAPI => 
            g.Latitud != null && 
            g.Longitud != null && 
            g.Latitud !== '' && 
            g.Longitud !== ''
          )
          .map((g: GasolineraAPI): GasolineraProcessed | null => {
            try {
              const latitud = parseFloat(g.Latitud.replace(',', '.'));
              const longitud = parseFloat(g.Longitud.replace(',', '.'));
              
              if (isNaN(latitud) || isNaN(longitud)) {
                return null;
              }

              return {
                ...g,
                latitud,
                longitud,
                distancia: calcularDistancia(
                  location.lat,
                  location.lon,
                  latitud,
                  longitud
                )
              };
            } catch (err) {
              console.error('Error procesando gasolinera:', err);
              return null;
            }
          })
          .filter((g): g is GasolineraProcessed => g !== null)
          .sort((a, b) => a.distancia - b.distancia)
          .slice(0, 6);

        if (gasolinerasConDistancia.length === 0) {
          throw new Error('No se encontraron gasolineras cercanas');
        }

        setGasolineras(gasolinerasConDistancia);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al obtener gasolineras');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGasolineras();
  }, [location]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-center mb-8">⛽ Encuentra Gasolineras Cercanas</h1>
      
      {locationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error de ubicación: {locationError}
        </div>
      )}

      {location && (
        <div className="text-center mb-6">
          <p className="text-lg">
            🌍 <strong>Tu ubicación:</strong><br />
            📍 <strong>Latitud:</strong> {location.lat}<br />
            📍 <strong>Longitud:</strong> {location.lon}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <p className="text-xl">Cargando gasolineras... ⏳</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gasolineras.map((g, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-white shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">⛽ {g["Rótulo"]}</h3>
              <p className="mb-1">📍 <strong>Dirección:</strong> {g["Dirección"]}</p>
              <p className="mb-1">🏙️ <strong>Población:</strong> {g["Municipio"]}</p>
              <p className="mb-1">📏 <strong>Distancia:</strong> {g.distancia.toFixed(2)} km</p>
              <p className="mb-1">
                💰 <strong>Precio Gasolina 95:</strong>{' '}
                {g["Precio Gasolina 95 E5"] || "No disponible"} €/L
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
