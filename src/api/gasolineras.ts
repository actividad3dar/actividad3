import axios from "axios";

const API_URL = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/";

export const obtenerGasolineras = async () => {
  try {
    const response = await axios.get(`${API_URL}EstacionesTerrestres/`);
    console.log("Respuesta de la API:", response.data);
    return response.data.ListaEESSPrecio; // Verifica que esta clave existe
  } catch (error) {
    console.error("Error al obtener los datos de la API:", error);
    return [];
  }
};
