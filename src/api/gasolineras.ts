import axios from 'axios';

export const obtenerGasolineras = async () => {
  try {
    const response = await axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestresHist/12-08-2024');
    return response.data.ListaEESSPrecio;
  } catch (error) {
    console.error('Error al obtener las gasolineras:', error);
    return [];
  }
};
