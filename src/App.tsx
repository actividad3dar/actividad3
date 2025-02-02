import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";

// Interfaz para una gasolinera
interface Gasolinera {
  "Rótulo": string;
  "Dirección": string;
  "Municipio": string;
  "Latitud": string;
  "Longitud": string;
  "Precio Gasolina 95 E5": string;
  latitud?: number;
  longitud?: number;
  distancia?: number;
}

// Función para calcular la distancia entre dos coordenadas
const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const App = () => {
  const { location, error: locationError } = useGeolocation();
  const [gasolineras, setGasolineras] = useState<Gasolinera[]>([]);
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
        
        const data = await response.json();
        
        if (!data?.ListaEESSPrecio || !Array.isArray(data.ListaEESSPrecio)) {
          throw new Error('Formato de datos inválido');
        }

        const gasolinerasConDistancia: Gasolinera[] = data.ListaEESSPrecio
          .map((g: Gasolinera) => ({
            ...g,
            latitud: parseFloat(g["Latitud"].replace(",", ".")),
            longitud: parseFloat(g["Longitud"].replace(",", ".")),
            distancia: calcularDistancia(
              location.lat,
              location.lon,
              parseFloat(g["Latitud"].replace(",", ".")),
              parseFloat(g["Longitud"].replace(",", "."))
            ),
          }))
          .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0))
          .slice(0, 6);

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
            📍 Latitud: {location.lat}<br />
            📍 Longitud: {location.lon}
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
              <p className="mb-1">📏 <strong>Distancia:</strong> {g.distancia?.toFixed(2)} km</p>
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
