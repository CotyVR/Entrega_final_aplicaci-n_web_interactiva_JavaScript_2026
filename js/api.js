const URL_DATOS = './data/frutas.json';

export async function obtenerFrutas() {
  const respuesta = await fetch(URL_DATOS);

  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con error ${respuesta.status}`);
  }

  const datos = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error('El archivo de datos no tiene el formato esperado');
  }

  return datos;
}
