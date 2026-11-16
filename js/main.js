import { obtenerFrutas } from './api.js';
import {
  leerCarrito,
  agregarItemGuardado,
  modificarCantidadGuardada,
  eliminarItemGuardado,
  vaciarCarritoGuardado,
} from './storage.js';

const COLORES_TOAST = {
  exito: 'linear-gradient(to right, #16a34a, #22c55e)',
  error: 'linear-gradient(to right, #b91c1c, #ef4444)',
  info: 'linear-gradient(to right, #0369a1, #0ea5e9)',
};

let catalogo = [];

const inputBuscar = document.getElementById('input-buscar');
const filtroCalidad = document.getElementById('filtro-calidad');
const contenedorFrutas = document.getElementById('contenedor-frutas');
const contenedorCarrito = document.getElementById('contenedor-carrito');
const btnComprar = document.getElementById('btn-comprar');
const btnVaciar = document.getElementById('btn-vaciar');
const lblTotalUnidades = document.getElementById('total-unidades');
const lblValorTotal = document.getElementById('valor-total');

function notificar(texto, tipo = 'exito') {
  Toastify({
    text: texto,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    close: true,
    style: { background: COLORES_TOAST[tipo] ?? COLORES_TOAST.info },
  }).showToast();
}

const formatearPrecio = (valor) => `$${valor.toLocaleString('es-CL')}`;

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function crearBoton(texto, clase, datos = {}) {
  const boton = crearElemento('button', clase, texto);
  boton.type = 'button';
  Object.entries(datos).forEach(([clave, valor]) => (boton.dataset[clave] = valor));
  return boton;
}

function obtenerItemsCarrito() {
  return leerCarrito()
    .map(({ id, cantidad }) => ({ ...catalogo.find((producto) => producto.id === id), cantidad }))
    .filter(({ fruta }) => fruta);
}

function calcularTotal(items) {
  return items.reduce((acumulado, { precio, cantidad }) => acumulado + precio * cantidad, 0);
}

function renderizarCatalogo() {
  const termino = inputBuscar.value.toLowerCase().trim();
  const calidadElegida = filtroCalidad.value || 'Todas';

  const lista = catalogo
    .filter(({ fruta }) => fruta.toLowerCase().includes(termino))
    .filter(({ calidad }) => (calidadElegida === 'Todas' ? true : calidad === calidadElegida));

  contenedorFrutas.replaceChildren();

  if (lista.length === 0) {
    contenedorFrutas.append(crearElemento('p', 'estado', 'No se encontraron frutas.'));
    return;
  }

  lista.forEach(({ id, fruta, precio, calidad, imagen }) => {
    const tarjeta = crearElemento('div', 'card-fruta');
    const foto = crearElemento('img', 'foto-fruta');
    foto.src = imagen;
    foto.alt = fruta;

    const detalle = crearElemento('div', 'fruta-detalle');
    detalle.append(
      crearElemento('h3', '', fruta),
      crearElemento('span', 'badge-calidad', calidad),
      crearElemento('p', '', `${formatearPrecio(precio)} / kg`)
    );

    tarjeta.append(foto, detalle, crearBoton('Agregar', 'btn-agregar', { id }));
    contenedorFrutas.append(tarjeta);
  });
}

function renderizarCarrito() {
  const items = obtenerItemsCarrito();
  const totalUnidades = items.reduce((acumulado, { cantidad }) => acumulado + cantidad, 0);

  contenedorCarrito.replaceChildren();

  if (items.length === 0) {
    contenedorCarrito.append(crearElemento('p', 'estado', 'Tu carrito está vacío.'));
  }

  items.forEach(({ id, fruta, precio, calidad, cantidad }) => {
    const fila = crearElemento('div', 'item-carrito');
    const detalle = crearElemento('div', 'fruta-detalle');
    detalle.append(
      crearElemento('h3', '', fruta),
      crearElemento('span', 'badge-calidad', calidad),
      crearElemento('p', '', formatearPrecio(precio * cantidad))
    );

    const controles = crearElemento('div', 'controles-cantidad');
    controles.append(
      crearBoton('−', 'btn-cantidad', { accion: 'restar', id }),
      crearElemento('span', 'cantidad', cantidad),
      crearBoton('+', 'btn-cantidad', { accion: 'sumar', id }),
      crearBoton('✕', 'btn-quitar', { accion: 'quitar', id })
    );

    fila.append(detalle, controles);
    contenedorCarrito.append(fila);
  });

  lblTotalUnidades.textContent = totalUnidades;
  lblValorTotal.textContent = formatearPrecio(calcularTotal(items));
  btnComprar.disabled = items.length === 0;
}

function agregarAlCarrito(id) {
  const producto = catalogo.find((item) => item.id === id);
  if (!producto) return;

  agregarItemGuardado(id);
  renderizarCarrito();
  notificar(`"${producto.fruta}" agregada al carrito.`, 'exito');
}

function gestionarItemCarrito(accion, id) {
  const acciones = {
    sumar: () => modificarCantidadGuardada(id, 1),
    restar: () => modificarCantidadGuardada(id, -1),
    quitar: () => eliminarItemGuardado(id),
  };

  acciones[accion]?.();
  renderizarCarrito();
}

async function confirmarAccion({ titulo, texto, html, textoConfirmar, icono = 'warning', color = '#dc2626' }) {
  const { isConfirmed } = await Swal.fire({
    title: titulo,
    text: texto,
    html,
    icon: icono,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: color,
  });

  return isConfirmed;
}

async function vaciarCarrito() {
  if (obtenerItemsCarrito().length === 0) {
    notificar('Tu carrito ya está vacío.', 'info');
    return;
  }

  const confirmado = await confirmarAccion({
    titulo: '¿Vaciar el carrito?',
    texto: 'Se quitarán todas las frutas seleccionadas.',
    textoConfirmar: 'Sí, vaciar',
  });
  if (!confirmado) return;

  vaciarCarritoGuardado();
  renderizarCarrito();
  notificar('Carrito vaciado.', 'info');
}

async function confirmarCompra() {
  const items = obtenerItemsCarrito();
  if (items.length === 0) {
    notificar('Agrega frutas antes de comprar.', 'error');
    return;
  }

  const total = calcularTotal(items);
  const detalleCompra = items
    .map(({ fruta, precio, calidad, cantidad }) => `<li>${cantidad} × ${fruta} (${calidad}) — ${formatearPrecio(precio * cantidad)}</li>`)
    .join('');

  const confirmado = await confirmarAccion({
    titulo: 'Confirmar compra',
    html: `<ul class="resumen-compra">${detalleCompra}</ul><p><strong>Total: ${formatearPrecio(total)}</strong></p>`,
    textoConfirmar: 'Sí, comprar',
    icono: 'question',
    color: '#16a34a',
  });
  if (!confirmado) return;

  const numeroPedido = Date.now().toString().slice(-6);
  vaciarCarritoGuardado();
  renderizarCarrito();

  await Swal.fire({
    title: '¡Compra realizada!',
    text: `Pedido N° ${numeroPedido} por ${formatearPrecio(total)}. ¡Gracias por tu compra!`,
    icon: 'success',
    confirmButtonColor: '#16a34a',
  });
}

function mostrarCargando() {
  contenedorFrutas.replaceChildren(crearElemento('p', 'estado', 'Cargando frutas…'));
}

function mostrarErrorCarga(detalle) {
  const caja = crearElemento('div', 'estado estado-error');
  caja.append(
    crearElemento('p', '', 'No se pudieron cargar las frutas.'),
    crearElemento('p', 'detalle', detalle),
    crearBoton('Reintentar', 'btn-reintentar')
  );
  contenedorFrutas.replaceChildren(caja);
}

async function cargarCatalogo() {
  mostrarCargando();
  btnComprar.disabled = true;

  try {
    catalogo = await obtenerFrutas();
    renderizarCatalogo();
  } catch (error) {
    const detalle = error instanceof TypeError
      ? 'Error de red: revisa tu conexión o que el archivo JSON esté disponible.'
      : error.message;

    mostrarErrorCarga(detalle);
    notificar(`Error al cargar las frutas: ${detalle}`, 'error');
  } finally {
    renderizarCarrito();
  }
}

contenedorFrutas.addEventListener('click', (evento) => {
  if (evento.target.closest('.btn-reintentar')) {
    cargarCatalogo();
    return;
  }

  const id = Number(evento.target.closest('.btn-agregar')?.dataset.id);
  if (id) agregarAlCarrito(id);
});

contenedorCarrito.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (boton) gestionarItemCarrito(boton.dataset.accion, Number(boton.dataset.id));
});

inputBuscar.addEventListener('input', renderizarCatalogo);
filtroCalidad.addEventListener('change', renderizarCatalogo);
btnComprar.addEventListener('click', confirmarCompra);
btnVaciar.addEventListener('click', vaciarCarrito);

document.addEventListener('DOMContentLoaded', cargarCatalogo);
