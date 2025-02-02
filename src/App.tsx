import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";
import { obtenerGasolineras } from "./api/gasolineras";

const App = () => {
  const { location, error } = useGeolocation();
  const [gasolineras, setGasolineras] = useState([]);

  useEffect(() => {
    if (location) {
      obtenerGasolineras().then((data) => {
        console.log("Gasolineras obtenidas:", data);
        setGasolineras(data.slice(0, 6)); // Solo mostramos las primeras 6
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
              <h3 style={{ margin: "0 0 10px", color: "#333" }}>⛽ {g["Rótulo"]}</h3>
              <p>📍 <strong>Dirección:</strong> {g["Dirección"]}</p>
              <p>🏙️ <strong>Población:</strong> {g["Municipio"]}</p>
              <p>💰 <strong>Precio Gasolina 95:</strong> {g["Precio Gasolina 95 E5"]} €/L</p>
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
