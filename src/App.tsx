import { useEffect, useState } from "react";
import useGeolocation from "./useGeolocation";
import { obtenerGasolineras } from "./api/gasolineras";

const App = () => {
  const { location, error } = useGeolocation();
  const [gasolineras, setGasolineras] = useState([]);

  useEffect(() => {
    if (location) {
      obtenerGasolineras().then(setGasolineras);
    }
  }, [location]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Encuentra Gasolineras Cercanas</h1>
      
      {error && <p style={{ color: "red" }}>{error}</p>}

      {location && (
        <p>
          🌍 Tu ubicación: <br />
          📍 Latitud: <strong>{location.lat}</strong> <br />
          📍 Longitud: <strong>{location.lon}</strong>
        </p>
      )}

      <h2>Gasolineras Cercanas:</h2>
      <ul>
        {gasolineras.length > 0 ? (
          gasolineras.map((g, index) => (
            <li key={index}>
              {g["Rótulo"]} - {g["Precio Gasolina 95 E5"]} €/L
            </li>
          ))
        ) : (
          <p>Cargando gasolineras...</p>
        )}
      </ul>
    </div>
  );
};

export default App;
