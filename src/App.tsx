import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";

interface GasolineraData {
  "Rótulo": string;
  "Dirección": string;
  "Municipio": string;
  "Latitud": string;
  "Longitud": string;
  "Precio Gasolina 95 E5": string;
  "Margen": string;
  "Horario": string;
  "C.P."?: string;
  "Localidad"?: string;
  "Provincia"?: string;
}

interface GasolineraProcessed {
  Rótulo: string;
  Dirección: string;
  Municipio: string;
  Horario: string;
  "Precio Gasolina 95 E5": string;
  latitud: number;
  longitud: number;
  distancia: number;
}

const parseCSVLine = (line: string): GasolineraData | null => {
  try {
    const [fecha, cp, direccion, horario, latitud, localidad, longitud, margen, municipio, precio95, provincia, rotulo, ...resto] = line.split(" ");
    
    return {
      "Rótulo": rotulo || "",
      "Dirección": direccion || "",
      "Municipio": municipio || "",
      "Latitud": latitud || "",
      "Longitud": longitud || "",
      "Precio Gasolina 95 E5": precio95 || "",
      "Margen": margen || "",
      "Horario": horario || "",
      "C.P.": cp,
      "Localidad": localidad,
      "Provincia": provincia
    };
  } catch {
    return null;
  }
};

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const toRad = (value: number): number => value * (Math.PI / 180);
  
  const lat1Rad = toRad(lat1);
  const lon1Rad = toRad(lon1);
  const lat2Rad = toRad(lat2);
  const lon2Rad = toRad(lon2);
  
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
           Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        const response = await window.fs.readFile('paste.txt', { encoding: 'utf8' });
        const lines = response.split('\n').filter(line => line.trim().length > 0);
        
        console.log('Datos recibidos:', lines[0]); // Log primera línea para debug
        
        const gasolinerasData = lines
          .map(parseCSVLine)
          .filter((g): g is GasolineraData => g !== null)
          .map(g => {
            try {
              const latitud = parseFloat(g.Latitud);
              const longitud = parseFloat(g.Longitud);
              
              if (isNaN(latitud) || isNaN(longitud)) {
                return null;
              }

              return {
                Rótulo: g.Rótulo,
                Dirección: g.Dirección,
                Municipio: g.Municipio,
                Horario: g.Horario,
                "Precio Gasolina 95 E5": g["Precio Gasolina 95 E5"],
                latitud,
                longitud,
                distancia: calcularDistancia(
                  location.lat,
                  location.lon,
                  latitud,
                  longitud
                )
              } as GasolineraProcessed;
            } catch (err) {
              console.error('Error procesando gasolinera:', err);
              return null;
            }
          })
          .filter((g): g is GasolineraProcessed => g !== null)
          .sort((a, b) => a.distancia - b.distancia)
          .slice(0, 6);

        if (gasolinerasData.length === 0) {
          throw new Error('No se encontraron gasolineras cercanas');
        }

        setGasolineras(gasolinerasData);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al obtener gasolineras');
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
              <h3 className="text-xl font-semibold mb-2">⛽ {g.Rótulo}</h3>
              <p className="mb-1">📍 <strong>Dirección:</strong> {g.Dirección}</p>
              <p className="mb-1">🏙️ <strong>Población:</strong> {g.Municipio}</p>
              <p className="mb-1">🕒 <strong>Horario:</strong> {g.Horario}</p>
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
