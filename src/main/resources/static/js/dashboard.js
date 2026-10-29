/* ===== dashboard.js ===== */

iniciarLayout('Dashboard');

/** Fecha de hoy en formato YYYY-MM-DD local */
function hoyStr() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
}

/** Comprueba si una fecha (ISO string o arreglo) corresponde a hoy */
function esHoy(fecha) {
  if (!fecha) return false;
  let d;
  if (Array.isArray(fecha)) {
    const [y, m, day] = fecha;
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(fecha);
  }
  const h = new Date();
  return d.getFullYear() === h.getFullYear() &&
         d.getMonth()    === h.getMonth()    &&
         d.getDate()     === h.getDate();
}

/** Comprueba si una fecha está dentro de los últimos N días */
function enUltimosDias(fecha, dias) {
  if (!fecha) return false;
  let d;
  if (Array.isArray(fecha)) {
    const [y, m, day] = fecha;
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(fecha);
  }
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  return d >= limite;
}

async function cargarDashboard() {
  try {
    // Carga en paralelo
    const [productos, alertas, movimientos] = await Promise.all([
      apiGet('/api/productos'),
      apiGet('/api/alertas/stock'),
      apiGet('/api/movimientos'),
    ]);

    // --- Tarjetas ---
    const totalUnidades = productos.reduce((s, p) => s + (p.stockActual || 0), 0);
    const stockBajo     = productos.filter(p => calcularEstado(p.stockActual, p.stockMinimo, p.stockMaximo) === 'BAJO').length;
    const criticos      = productos.filter(p => calcularEstado(p.stockActual, p.stockMinimo, p.stockMaximo) === 'AGOTADO').length;
    const ventasHoy     = movimientos
      .filter(m => m.tipo === 'VENTA' && esHoy(m.fecha))
      .reduce((s, m) => s + (m.cantidad || 0), 0);

    document.getElementById('stat-total').textContent    = totalUnidades.toLocaleString('es-PE');
    document.getElementById('stat-bajo').textContent     = stockBajo;
    document.getElementById('stat-criticos').textContent = criticos;
    document.getElementById('stat-ventas').textContent   = ventasHoy.toLocaleString('es-PE');

    // --- Alertas recientes ---
    renderAlertas(alertas);

    // --- Gráfico más vendidos ---
    renderGrafico(movimientos);

  } catch (err) {
    mostrarToast(err.message, 'error');
  }
}

function renderAlertas(alertas) {
  const contenedor = document.getElementById('lista-alertas');
  if (!alertas.length) {
    contenedor.innerHTML = `<div class="estado-vacio"><p>Sin alertas activas. ¡Todo en orden!</p></div>`;
    return;
  }

  // Mostrar máximo 8 alertas
  const visibles = alertas.slice(0, 8);
  contenedor.innerHTML = visibles.map(a => `
    <div class="alerta-item">
      <div>
        <div class="alerta-nombre">${escapar(a.nombre)}</div>
        <div class="alerta-detalle">Stock: ${a.stockActual} / Mínimo: ${a.stockMinimo}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        ${badgeEstado(a.estado)}
        <span class="alerta-sugerida">+${a.cantidadSugerida} uds.</span>
      </div>
    </div>
  `).join('');
}

function renderGrafico(movimientos) {
  // Suma ventas de los últimos 30 días por producto
  const mapa = {};
  movimientos
    .filter(m => m.tipo === 'VENTA' && enUltimosDias(m.fecha, 30))
    .forEach(m => {
      const nombre = m.producto?.nombre || 'Desconocido';
      mapa[nombre] = (mapa[nombre] || 0) + (m.cantidad || 0);
    });

  const top5 = Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const contenedor = document.getElementById('grafico-ventas');

  if (!top5.length) {
    contenedor.innerHTML = `<div class="estado-vacio"><p>Sin ventas en los últimos 30 días.</p></div>`;
    return;
  }

  const maximo = top5[0][1];
  contenedor.innerHTML = `<div class="grafico-barras">` +
    top5.map(([nombre, total]) => {
      const pct = maximo > 0 ? Math.round((total / maximo) * 100) : 0;
      return `
        <div class="barra-item">
          <span class="barra-label" title="${escapar(nombre)}">${escapar(nombre)}</span>
          <div class="barra-track">
            <div class="barra-fill" style="width:${pct}%">
              <span class="barra-valor">${total}</span>
            </div>
          </div>
        </div>`;
    }).join('') +
  `</div>`;
}

cargarDashboard();
