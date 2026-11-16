const CLAVE_CARRITO = 'carritoFrutas';

export function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || '[]');
    return Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    return [];
  }
}

function guardarCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
}

export function agregarItemGuardado(id) {
  const items = leerCarrito();
  const existente = items.find((item) => item.id === id);

  if (existente) {
    existente.cantidad += 1;
  } else {
    items.push({ id, cantidad: 1 });
  }

  guardarCarrito(items);
}

export function modificarCantidadGuardada(id, variacion) {
  const itemsActualizados = leerCarrito()
    .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + variacion } : item))
    .filter(({ cantidad }) => cantidad > 0);

  guardarCarrito(itemsActualizados);
}

export function eliminarItemGuardado(id) {
  guardarCarrito(leerCarrito().filter((item) => item.id !== id));
}

export function vaciarCarritoGuardado() {
  localStorage.removeItem(CLAVE_CARRITO);
}
