/* ===== login.js ===== */

// Si ya hay sesión activa, ir directo al dashboard
if (obtenerSesion()) window.location.href = '/dashboard.html';

/** Alterna entre las pestañas login / registro */
function cambiarTab(tab) {
  document.getElementById('tab-login').classList.toggle('activo', tab === 'login');
  document.getElementById('tab-registro').classList.toggle('activo', tab === 'registro');
  document.getElementById('form-login').classList.toggle('activo', tab === 'login');
  document.getElementById('form-registro').classList.toggle('activo', tab === 'registro');
}

// ---------- Validaciones ----------

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function mostrarError(id, visible) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('visible', visible);
}

function limpiarErrores(ids) {
  ids.forEach(id => mostrarError(id, false));
}

// ---------- LOGIN ----------

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  limpiarErrores(['err-login-email', 'err-login-password']);

  let valido = true;
  if (!validarEmail(email))  { mostrarError('err-login-email', true);    valido = false; }
  if (!password)             { mostrarError('err-login-password', true); valido = false; }
  if (!valido) return;

  const btn = document.getElementById('btn-login');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Ingresando...';

  try {
    const usuario = await apiPost('/api/auth/login', { email, password });
    guardarSesion(usuario);
    window.location.href = '/dashboard.html';
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
});

// ---------- REGISTRO ----------

document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre   = document.getElementById('reg-nombre').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  limpiarErrores(['err-reg-nombre', 'err-reg-email', 'err-reg-password']);

  let valido = true;
  if (!nombre)               { mostrarError('err-reg-nombre', true);    valido = false; }
  if (!validarEmail(email))  { mostrarError('err-reg-email', true);     valido = false; }
  if (password.length < 6)   { mostrarError('err-reg-password', true);  valido = false; }
  if (!valido) return;

  const btn = document.getElementById('btn-registro');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creando cuenta...';

  try {
    const usuario = await apiPost('/api/auth/registro', { nombre, email, password });
    guardarSesion(usuario);
    window.location.href = '/dashboard.html';
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear cuenta';
  }
});
