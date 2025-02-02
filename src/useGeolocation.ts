import { useState, useEffect } from "react";

const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada en este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (err) => {
        setError("No se pudo obtener la ubicación.");
        console.error(err);
      }
    );
  }, []);

  return { location, error };
};

export default useGeolocation;
