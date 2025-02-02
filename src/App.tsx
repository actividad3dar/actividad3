import useGeolocation from "./useGeolocation";

const App = () => {
  const { location, error } = useGeolocation();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Encuentra Gasolineras Cercanas</h1>
      
      {error && <p style={{ color: "red" }}>{error}</p>}

      {location ? (
        <p>
          🌍 Tu ubicación: <br />
          📍 Latitud: <strong>{location.lat}</strong> <br />
          📍 Longitud: <strong>{location.lon}</strong>
        </p>
      ) : (
        <p>Obteniendo ubicación...</p>
      )}
    </div>
  );
};

export default App;
