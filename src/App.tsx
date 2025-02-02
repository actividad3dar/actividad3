import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";

// Interfaz para los datos de la API
interface GasolineraAPI {
  "C.P.": string;
  "Dirección": string;
  "Horario": string;
  "Latitud": string;
  "Localidad": string;
  "Longitud": string;
  "Margen": string;
  "Municipio": string;
  "Precio Gasolina 95 E5": string;
  "Provincia": string;
  "Remisión": string;
  "Rótulo": string;
  "Tipo Venta": string;
  "IDEESS": string;
  "IDMunicipio": string;
  "IDProvincia": string;
  "IDCCAA": string
}

// Interfaz para datos procesados
interface GasolineraProcessed extends GasolineraAPI {
  latitud: number;
  longitud: number;
  distancia: number
}

interface APIResponse {
  Fecha: string;
  ListaEESSPrecio: GasolineraAPI[]
}

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const toRad = (value: number): number => value * (Math.PI / 180);
  
  const lat1Rad = toRad(lat1);
  const lon1Rad = toRad(lon1);
  const lat2Rad = toRad(lat2);
  const lon2Rad = toRad(lon2);
  
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  
  const a = sinDLat * sinDLat +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinDLon * sinDLon;
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
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
        console.log('Respuesta de la API:', data);
        
        if (!data?.ListaEESSPrecio || !Array.isArray(data.ListaEESSPrecio)) {
          throw new Error('Formato de datos inválido');
        }
        
        console.log('Primera gasolinera:', data.ListaEESSPrecio[0]);

        const gasolinerasConDistancia = data.ListaEESSPrecio
          .filter((g): g is GasolineraAPI => {
            return typeof g?.Latitud === 'string' && 
                   typeof g?.Longitud === 'string' &&
                   g.Latitud !== '' && 
                   g.Longitud !== '';
          })
          .map((g: GasolineraAPI): GasolineraProcessed | null => {
            try {
              if (typeof g.Latitud !== 'string' || typeof g.Longitud !== 'string') {
                return null;
              }
              
              const latitud = parseFloat(g.Latitud.toString().replace(',', '.'));
              const longitud = parseFloat(g.Longitud.toString().replace(',', '.'));
              
              if (isNaN(latitud) || isNaN(longitud)) {
                console.log('Coordenadas inválidas:', g.Latitud, g.Longitud);
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
