/* ===== productos.js ===== */

iniciarLayout('Productos');

// Estado local
let todosProductos  = [];
let todasCategorias = [];
let todosProveedores = [];

// ---------- PESTAÑAS ----------

function cambiarTab(nombre) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    const tabs = ['productos', 'categorias', 'proveedores'];
    btn.classList.toggle('activo', tabs[i] === nombre);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('activo'));
  document.getElementById(`tab-${nombre}`).classList.add('activo');

  if (nombre === 'categorias')  cargarCategorias();
  if (nombre === 'proveedores') cargarProveedores();
}

// ---------- MODALES ----------

function abrirModal(id) {
  document.getElementById(id).classList.add('visible');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('visible');
}

// Cierra modal al hacer clic en el overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('visible');
  });
});

// ---------- UTILIDADES FORMULARIO ----------

function mostrarErrForm(id, visible) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('visible', visible);
}

function limpiarErrs(ids) { ids.forEach(id => mostrarErrForm(id, false)); }

// ---------- CARGA INICIAL ----------

async function cargarTodo() {
  try {
    [todosProductos, todasCategorias, todosProveedores] = await Promise.all([
      apiGet('/api/productos'),
      apiGet('/api/categorias'),
      apiGet('/api/proveedores'),
    ]);
    renderTablaProductos(todosProductos);
    poblarFiltroCategoria();
  } catch (err) {
    mostrarToast(err.message, 'error');
    document.getElementById('tabla-productos-body').innerHTML =
      `<tr><td colspan="9" style="text-align:center;color:var(--rojo);padding:24px;">${escapar(err.message)}</td></tr>`;
  }
}

function poblarFiltroCategoria() {
  const sel = document.getElementById('filtro-categoria');
  const actual = sel.value;
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    todasCategorias.map(c => `<option value="${c.id}">${escapar(c.nombre)}</option>`).join('');
  sel.value = actual;
}

// ---------- TABLA PRODUCTOS ----------

function renderTablaProductos(lista) {
  const tbody = document.getElementById('tabla-productos-body');
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="estado-vacio"><p>No se encontraron productos.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(p => {
    const estado = calcularEstado(p.stockActual, p.stockMinimo, p.stockMaximo);
    return `<tr>
      <td>${escapar(p.nombre)}</td>
      <td>${escapar(p.categoria?.nombre || '—')}</td>
      <td>${escapar(p.proveedor?.nombre || '—')}</td>
      <td><strong>${p.stockActual}</strong></td>
      <td>${p.stockMinimo}</td>
      <td>${p.stockMaximo}</td>
      <td>S/ ${Number(p.precio).toFixed(2)}</td>
      <td>${badgeEstado(estado)}</td>
      <td>
        <div class="d-flex gap-8" style="flex-wrap:wrap;">
          <button class="btn btn-icono btn-sm" title="Editar" onclick="abrirModalProducto(${p.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-exito btn-sm" title="Entrada" onclick="abrirModalMovimiento(${p.id},'${escapar(p.nombre)}','ENTRADA')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </button>
          <button class="btn btn-naranja btn-sm" title="Salida/Venta" onclick="abrirModalMovimiento(${p.id},'${escapar(p.nombre)}','SALIDA')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>
          <button class="btn btn-secundario btn-sm" title="Historial" onclick="verHistorial(${p.id},'${escapar(p.nombre)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button class="btn btn-peligro btn-sm" title="Eliminar" onclick="confirmarEliminarProducto(${p.id},'${escapar(p.nombre)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ---------- FILTROS ----------

function aplicarFiltros() {
  const texto    = document.getElementById('buscador').value.toLowerCase();
  const catId    = document.getElementById('filtro-categoria').value;
  const estadoF  = document.getElementById('filtro-estado').value;

  const filtrados = todosProductos.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(texto);
    const coincideCat    = !catId || String(p.categoria?.id) === catId;
    const estado         = calcularEstado(p.stockActual, p.stockMinimo, p.stockMaximo);
    const coincideEstado = !estadoF || estado === estadoF;
    return coincideNombre && coincideCat && coincideEstado;
  });

  renderTablaProductos(filtrados);
}

document.getElementById('buscador').addEventListener('input', aplicarFiltros);
document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
document.getElementById('filtro-estado').addEventListener('change', aplicarFiltros);

// ---------- MODAL PRODUCTO ----------

function poblarSelectsCatalogos() {
  const selCat  = document.getElementById('prod-categoria');
  const selProv = document.getElementById('prod-proveedor');
  const catActual  = selCat.value;
  const provActual = selProv.value;

  selCat.innerHTML  = '<option value="">Seleccionar...</option>' +
    todasCategorias.map(c => `<option value="${c.id}">${escapar(c.nombre)}</option>`).join('');
  selProv.innerHTML = '<option value="">Seleccionar...</option>' +
    todosProveedores.map(p => `<option value="${p.id}">${escapar(p.nombre)}</option>`).join('');

  selCat.value  = catActual;
  selProv.value = provActual;
}

function abrirModalProducto(id = null) {
  limpiarErrs(['err-prod-nombre','err-prod-categoria','err-prod-proveedor',
               'err-prod-stock-actual','err-prod-precio','err-prod-stock-min','err-prod-stock-max']);

  document.getElementById('prod-id').value           = '';
  document.getElementById('prod-nombre').value       = '';
  document.getElementById('prod-categoria').value    = '';
  document.getElementById('prod-proveedor').value    = '';
  document.getElementById('prod-stock-actual').value = '';
  document.getElementById('prod-precio').value       = '';
  document.getElementById('prod-stock-min').value    = '';
  document.getElementById('prod-stock-max').value    = '';

  poblarSelectsCatalogos();

  if (id) {
    const p = todosProductos.find(x => x.id === id);
    if (p) {
      document.getElementById('modal-producto-titulo').textContent = 'Editar producto';
      document.getElementById('prod-id').value           = p.id;
      document.getElementById('prod-nombre').value       = p.nombre;
      document.getElementById('prod-categoria').value    = p.categoria?.id || '';
      document.getElementById('prod-proveedor').value    = p.proveedor?.id || '';
      document.getElementById('prod-stock-actual').value = p.stockActual;
      document.getElementById('prod-precio').value       = p.precio;
      document.getElementById('prod-stock-min').value    = p.stockMinimo;
      document.getElementById('prod-stock-max').value    = p.stockMaximo;
    }
  } else {
    document.getElementById('modal-producto-titulo').textContent = 'Nuevo producto';
  }

  abrirModal('modal-producto');
}

async function guardarProducto() {
  limpiarErrs(['err-prod-nombre','err-prod-categoria','err-prod-proveedor',
               'err-prod-stock-actual','err-prod-precio','err-prod-stock-min','err-prod-stock-max']);

  const nombre      = document.getElementById('prod-nombre').value.trim();
  const categoriaId = Number(document.getElementById('prod-categoria').value);
  const proveedorId = Number(document.getElementById('prod-proveedor').value);
  const stockActual = Number(document.getElementById('prod-stock-actual').value);
  const precio      = Number(document.getElementById('prod-precio').value);
  const stockMinimo = Number(document.getElementById('prod-stock-min').value);
  const stockMaximo = Number(document.getElementById('prod-stock-max').value);
  const id          = document.getElementById('prod-id').value;

  let valido = true;
  if (!nombre)                          { mostrarErrForm('err-prod-nombre', true);       valido = false; }
  if (!categoriaId)                     { mostrarErrForm('err-prod-categoria', true);    valido = false; }
  if (!proveedorId)                     { mostrarErrForm('err-prod-proveedor', true);    valido = false; }
  if (isNaN(stockActual) || stockActual < 0) { mostrarErrForm('err-prod-stock-actual', true); valido = false; }
  if (isNaN(precio) || precio < 0)      { mostrarErrForm('err-prod-precio', true);       valido = false; }
  if (isNaN(stockMinimo) || stockMinimo < 0) { mostrarErrForm('err-prod-stock-min', true); valido = false; }
  if (isNaN(stockMaximo) || stockMaximo < stockMinimo) { mostrarErrForm('err-prod-stock-max', true); valido = false; }
  if (!valido) return;

  const cuerpo = { nombre, categoriaId, proveedorId, stockActual, stockMinimo, stockMaximo, precio };
  const btn = document.getElementById('btn-guardar-producto');
  btn.disabled = true;

  try {
    if (id) {
      await apiPut(`/api/productos/${id}`, cuerpo);
      mostrarToast('Producto actualizado correctamente.', 'exito');
    } else {
      await apiPost('/api/productos', cuerpo);
      mostrarToast('Producto creado correctamente.', 'exito');
    }
    cerrarModal('modal-producto');
    await cargarTodo();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ---------- ELIMINAR PRODUCTO ----------

function confirmarEliminarProducto(id, nombre) {
  document.getElementById('confirmar-mensaje').textContent =
    `¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`;
  const btnOk = document.getElementById('btn-confirmar-ok');
  btnOk.onclick = () => eliminarProducto(id);
  abrirModal('modal-confirmar');
}

async function eliminarProducto(id) {
  const btn = document.getElementById('btn-confirmar-ok');
  btn.disabled = true;
  try {
    await apiDelete(`/api/productos/${id}`);
    mostrarToast('Producto eliminado.', 'exito');
    cerrarModal('modal-confirmar');
    await cargarTodo();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ---------- MODAL MOVIMIENTO ----------

function abrirModalMovimiento(productoId, nombreProducto, tipoInicial = 'ENTRADA') {
  limpiarErrs(['err-mov-cantidad']);
  document.getElementById('mov-producto-id').value    = productoId;
  document.getElementById('mov-producto-nombre').value = nombreProducto;
  document.getElementById('mov-tipo').value           = tipoInicial;
  document.getElementById('mov-cantidad').value       = '';
  document.getElementById('mov-observacion').value    = '';

  const titulo = tipoInicial === 'ENTRADA' ? 'Registrar entrada' : 'Registrar salida / venta';
  document.getElementById('modal-mov-titulo').textContent = titulo;

  // Para entrada solo mostrar ENTRADA; para salida mostrar SALIDA y VENTA
  const selTipo = document.getElementById('mov-tipo');
  if (tipoInicial === 'ENTRADA') {
    selTipo.innerHTML = '<option value="ENTRADA">Entrada</option>';
  } else {
    selTipo.innerHTML = '<option value="SALIDA">Salida</option><option value="VENTA">Venta</option>';
  }

  abrirModal('modal-movimiento');
}

async function guardarMovimiento() {
  limpiarErrs(['err-mov-cantidad']);
  const productoId  = Number(document.getElementById('mov-producto-id').value);
  const tipo        = document.getElementById('mov-tipo').value;
  const cantidad    = Number(document.getElementById('mov-cantidad').value);
  const observacion = document.getElementById('mov-observacion').value.trim();

  if (!cantidad || cantidad < 1) { mostrarErrForm('err-mov-cantidad', true); return; }

  const btn = document.getElementById('btn-guardar-mov');
  btn.disabled = true;

  try {
    await apiPost('/api/movimientos', { productoId, tipo, cantidad, observacion });
    mostrarToast('Movimiento registrado correctamente.', 'exito');
    cerrarModal('modal-movimiento');
    await cargarTodo();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ---------- HISTORIAL ----------

async function verHistorial(productoId, nombre) {
  document.getElementById('modal-historial-titulo').textContent = `Historial — ${nombre}`;
  document.getElementById('tabla-historial-body').innerHTML =
    `<tr class="cargando-fila"><td colspan="4"><span class="spinner spinner-dark"></span> Cargando...</td></tr>`;
  abrirModal('modal-historial');

  try {
    const movs = await apiGet(`/api/movimientos/producto/${productoId}`);
    const tbody = document.getElementById('tabla-historial-body');
    if (!movs.length) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="estado-vacio"><p>Sin movimientos registrados.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = movs.map(m => {
      const colorTipo = m.tipo === 'ENTRADA' ? 'badge-normal' : m.tipo === 'VENTA' ? 'badge-bajo' : 'badge-exceso';
      return `<tr>
        <td>${escapar(normalizarFecha(m.fecha))}</td>
        <td><span class="badge ${colorTipo}">${escapar(m.tipo)}</span></td>
        <td>${m.cantidad}</td>
        <td>${escapar(m.observacion || '—')}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    mostrarToast(err.message, 'error');
    cerrarModal('modal-historial');
  }
}

// ---------- CATEGORÍAS ----------

async function cargarCategorias() {
  try {
    todasCategorias = await apiGet('/api/categorias');
    renderTablaCategorias();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
}

function renderTablaCategorias() {
  const tbody = document.getElementById('tabla-categorias-body');
  if (!todasCategorias.length) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="estado-vacio"><p>Sin categorías.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = todasCategorias.map(c => `<tr>
    <td>${c.id}</td>
    <td>${escapar(c.nombre)}</td>
    <td>
      <div class="d-flex gap-8">
        <button class="btn btn-icono btn-sm" onclick="abrirModalCategoria(${c.id},'${escapar(c.nombre)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-peligro btn-sm" onclick="confirmarEliminarCat(${c.id},'${escapar(c.nombre)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
    </td>
  </tr>`).join('');
}

function abrirModalCategoria(id = null, nombre = '') {
  document.getElementById('cat-id').value     = id || '';
  document.getElementById('cat-nombre').value = nombre;
  document.getElementById('modal-cat-titulo').textContent = id ? 'Editar categoría' : 'Nueva categoría';
  limpiarErrs(['err-cat-nombre']);
  abrirModal('modal-categoria');
}

async function guardarCategoria() {
  const nombre = document.getElementById('cat-nombre').value.trim();
  const id     = document.getElementById('cat-id').value;
  if (!nombre) { mostrarErrForm('err-cat-nombre', true); return; }

  try {
    if (id) {
      await apiPut(`/api/categorias/${id}`, { nombre });
      mostrarToast('Categoría actualizada.', 'exito');
    } else {
      await apiPost('/api/categorias', { nombre });
      mostrarToast('Categoría creada.', 'exito');
    }
    cerrarModal('modal-categoria');
    await cargarCategorias();
    // Actualizar filtro y selects de producto
    poblarFiltroCategoria();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
}

function confirmarEliminarCat(id, nombre) {
  document.getElementById('confirmar-mensaje').textContent = `¿Eliminar la categoría "${nombre}"?`;
  document.getElementById('btn-confirmar-ok').onclick = () => eliminarCategoria(id);
  abrirModal('modal-confirmar');
}

async function eliminarCategoria(id) {
  const btn = document.getElementById('btn-confirmar-ok');
  btn.disabled = true;
  try {
    await apiDelete(`/api/categorias/${id}`);
    mostrarToast('Categoría eliminada.', 'exito');
    cerrarModal('modal-confirmar');
    await cargarCategorias();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ---------- PROVEEDORES ----------

async function cargarProveedores() {
  try {
    todosProveedores = await apiGet('/api/proveedores');
    renderTablaProveedores();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
}

function renderTablaProveedores() {
  const tbody = document.getElementById('tabla-proveedores-body');
  if (!todosProveedores.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="estado-vacio"><p>Sin proveedores.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = todosProveedores.map(p => `<tr>
    <td>${p.id}</td>
    <td>${escapar(p.nombre)}</td>
    <td>${escapar(p.telefono || '—')}</td>
    <td>
      <div class="d-flex gap-8">
        <button class="btn btn-icono btn-sm" onclick="abrirModalProveedor(${p.id},'${escapar(p.nombre)}','${escapar(p.telefono||'')}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-peligro btn-sm" onclick="confirmarEliminarProv(${p.id},'${escapar(p.nombre)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
    </td>
  </tr>`).join('');
}

function abrirModalProveedor(id = null, nombre = '', telefono = '') {
  document.getElementById('prov-id').value       = id || '';
  document.getElementById('prov-nombre').value   = nombre;
  document.getElementById('prov-telefono').value = telefono;
  document.getElementById('modal-prov-titulo').textContent = id ? 'Editar proveedor' : 'Nuevo proveedor';
  limpiarErrs(['err-prov-nombre']);
  abrirModal('modal-proveedor');
}

async function guardarProveedor() {
  const nombre   = document.getElementById('prov-nombre').value.trim();
  const telefono = document.getElementById('prov-telefono').value.trim();
  const id       = document.getElementById('prov-id').value;
  if (!nombre) { mostrarErrForm('err-prov-nombre', true); return; }

  try {
    if (id) {
      await apiPut(`/api/proveedores/${id}`, { nombre, telefono });
      mostrarToast('Proveedor actualizado.', 'exito');
    } else {
      await apiPost('/api/proveedores', { nombre, telefono });
      mostrarToast('Proveedor creado.', 'exito');
    }
    cerrarModal('modal-proveedor');
    await cargarProveedores();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
}

function confirmarEliminarProv(id, nombre) {
  document.getElementById('confirmar-mensaje').textContent = `¿Eliminar el proveedor "${nombre}"?`;
  document.getElementById('btn-confirmar-ok').onclick = () => eliminarProveedor(id);
  abrirModal('modal-confirmar');
}

async function eliminarProveedor(id) {
  const btn = document.getElementById('btn-confirmar-ok');
  btn.disabled = true;
  try {
    await apiDelete(`/api/proveedores/${id}`);
    mostrarToast('Proveedor eliminado.', 'exito');
    cerrarModal('modal-confirmar');
    await cargarProveedores();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ---------- INICIO ----------
cargarTodo();
