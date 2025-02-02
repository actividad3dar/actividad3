import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";
import { obtenerGasolineras } from "./api/gasolineras";

// Definir la estructura de una gasolinera
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

// Función para calcular la distancia entre dos coordenadas (Haversine)
const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
};

const App = () => {
  const { location, error } = useGeolocation();
  const [gasolineras, setGasolineras] = useState<Gasolinera[]>([]);

  useEffect(() => {
  if (location) {
    console.log("Ubicación obtenida:", location);
    obtenerGasolineras().then((data) => {
      console.log("Gasolineras obtenidas de la API:", data);

      if (!data || data.length === 0) {
        console.error("No se recibieron datos de la API");
        return;
      }

      // Convertir coordenadas y calcular distancia
      const gasolinerasConDistancia: Gasolinera[] = data.map((g: Gasolinera) => ({
        ...g,
        latitud: parseFloat(g["Latitud"].replace(",", ".")), 
        longitud: parseFloat(g["Longitud"].replace(",", ".")),
        distancia: calcularDistancia(
          location.lat,
          location.lon,
          parseFloat(g["Latitud"].replace(",", ".")),
          parseFloat(g["Longitud"].replace(",", "."))
        ),
      }));

      // Ordenar por distancia
      gasolinerasConDistancia.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));

      console.log("Gasolineras ordenadas por distancia:", gasolinerasConDistancia.slice(0, 6));
      
      setGasolineras(gasolinerasConDistancia.slice(0, 6));
    }).catch((error) => {
      console.error("Error obteniendo gasolineras:", error);
    });
  }
}, [location]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>⛽ Encuentra Gasolineras Cercanas</h1>
      
      {error && <p style={{ color: "red" }}>{error}</p>}

      {location && (
        <p>
          🌍 <strong>Tu ubicación:</strong> <br />
          📍 <strong>Latitud:</strong> {location.lat} <br />
          📍 <strong>Longitud:</strong> {location.lon}
        </p>
      )}

      <h2 style={{ marginTop: "20px", fontSize: "1.5rem" }}>Gasolineras Cercanas:</h2>
      
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        {gasolineras.length > 0 ? (
          gasolineras.map((g, index) => (
            <div key={index} style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              width: "300px",
              textAlign: "left",
              backgroundColor: "#f9f9f9",
              boxShadow: "2px 2px 10px rgba(0,0,0,0.1)"
            }}>
              <h3>⛽ {g["Rótulo"]}</h3>
              <p>📍 <strong>Dirección:</strong> {g["Dirección"]}</p>
              <p>🏙️ <strong>Población:</strong> {g["Municipio"]}</p>
              <p>📏 <strong>Distancia:</strong> {g.distancia?.toFixed(2)} km</p>
              <p>💰 <strong>Precio Gasolina 95:</strong> {g["Precio Gasolina 95 E5"] || "No disponible"} €/L</p>
            </div>
          ))
        ) : (
          <p>Cargando gasolineras...</p>
        )}
      </div>
    </div>
  );
};

export default App;
