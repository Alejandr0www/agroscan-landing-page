const menu = document.querySelector('#menu');
const navigation = document.querySelector('#navigation');
menu.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
const loginView = document.querySelector('#login-view');
const appView = document.querySelector('#app-view');
const content = document.querySelector('#view-content');
const status = document.querySelector('#app-status');
const logout = document.querySelector('#logout');
const links = document.querySelectorAll('[data-view]');
let user = '';
let role = 'agricultor';
let currentId = '';
let records = [];
let lastCrop = 'papa';
function dataKey(key) { return currentId ? key + ':' + currentId : key; }
function readStorage(key, fallback) { try { return localStorage.getItem(dataKey(key)) || fallback; } catch (error) { return fallback; } }
function writeStorage(key, value) { try { localStorage.setItem(dataKey(key), value); } catch (error) { /* Sin almacenamiento, los cambios solo duran en esta sesión. */ } }
let currentResult = null;
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function notify(message) { status.textContent = message; }
const authStatus = document.querySelector('#auth-status');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const loginTab = document.querySelector('#login-tab');
const registerTab = document.querySelector('#register-tab');
const accountStore = 'agroscan-demo-accounts-v1';

function accounts() {
  const saved = localStorage.getItem(accountStore);
  const values = saved ? JSON.parse(saved) : [];
  return Array.isArray(values) ? values : [];
}
function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
async function passwordDigest(password, salt) {
  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(salt.match(/.{2}/g).map(part => parseInt(part, 16)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256'}, key, 256);
  return hex(new Uint8Array(bits));
}
function authTab(mode) {
  const registering = mode === 'register';
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  loginTab.setAttribute('aria-selected', String(!registering));
  registerTab.setAttribute('aria-selected', String(registering));
  authStatus.textContent = '';
}
function beginSession(account) {
  user = account.name;
  role = account.role;
  currentId = account.id;
  try { records = JSON.parse(readStorage('agroscan-records', '[]')); if (!Array.isArray(records)) records = []; } catch (error) { records = []; }
  lastCrop = readStorage('agroscan-crop', 'papa');
  start();
  document.querySelector('#experiencia').scrollIntoView({behavior:'smooth'});
}
function start() {
  const loggedIn = Boolean(user);
  loginView.hidden = loggedIn;
  appView.hidden = !loggedIn;
  logout.hidden = !loggedIn;
  document.body.classList.toggle('app-mode', loggedIn);
  document.querySelector('.app-shell').classList.toggle('is-authenticated', loggedIn);
  if (loggedIn) show('home');
}
loginTab.addEventListener('click', () => authTab('login'));
registerTab.addEventListener('click', () => authTab('register'));
document.querySelectorAll('[data-auth-open]').forEach(link => link.addEventListener('click', () => authTab(link.dataset.authOpen)));
registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = registerForm.querySelector('button[type="submit"]');
  const name = document.querySelector('#register-name').value.trim();
  const email = document.querySelector('#register-email').value.trim().toLowerCase();
  const password = document.querySelector('#register-password').value;
  const confirm = document.querySelector('#register-confirm').value;
  if (!name) { authStatus.textContent = 'Escribe tu nombre.'; return; }
  if (password !== confirm) { authStatus.textContent = 'Las contraseñas no coinciden.'; return; }
  button.disabled = true;
  try {
    if (!window.crypto || !crypto.subtle) throw new Error('crypto');
    const users = accounts();
    if (users.some(account => account.email === email)) { authStatus.textContent = 'Ya existe un perfil de prueba con ese correo en este navegador.'; return; }
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const id = hex(crypto.getRandomValues(new Uint8Array(12)));
    const account = {id, name, email, role:document.querySelector('#role').value, salt, passwordHash:await passwordDigest(password, salt)};
    users.push(account);
    localStorage.setItem(accountStore, JSON.stringify(users));
    registerForm.reset();
    authStatus.textContent = '';
    beginSession(account);
  } catch (error) {
    authStatus.textContent = 'No se pudo guardar el perfil. Verifica que el navegador permita almacenamiento y usa la página publicada.';
  } finally { button.disabled = false; }
});
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  const email = document.querySelector('#login-email').value.trim().toLowerCase();
  const password = document.querySelector('#login-password').value;
  button.disabled = true;
  try {
    const account = accounts().find(entry => entry.email === email);
    if (!account || await passwordDigest(password, account.salt) !== account.passwordHash) {
      authStatus.textContent = 'Correo o contraseña incorrectos. Si aún no tienes perfil de prueba, regístrate.';
      return;
    }
    loginForm.reset();
    authStatus.textContent = '';
    beginSession(account);
  } catch (error) {
    authStatus.textContent = 'No se pudo iniciar sesión en esta demo. Revisa la configuración del navegador.';
  } finally { button.disabled = false; }
});
logout.addEventListener('click', () => {
  user = ''; role = 'agricultor'; currentId = ''; currentResult = null; records = []; lastCrop = 'papa';
  loginForm.reset(); registerForm.reset(); authTab('login'); start();
  document.querySelector('#inicio').scrollIntoView({behavior:'smooth'});
});
links.forEach(link => link.addEventListener('click', () => { if (!user) { authTab('login'); document.querySelector('#login-email').focus(); return; } show(link.dataset.view); }));
function show(view) {
  status.textContent = '';
  links.forEach(link => link.classList.toggle('active', link.dataset.view === view));
  if (view === 'home') content.innerHTML = `<p class="eyebrow">MI ESPACIO</p><h3>Hola, ${escapeText(user)} 👋</h3><p>Tu cultivo merece una mirada. ¿Qué quieres hacer hoy?</p><div class="app-grid"><article class="app-card"><h4>✳ Analizar una hoja</h4><p>Prueba un resultado de ejemplo para papa o maíz.</p><button data-go="scan">Comenzar →</button></article><article class="app-card"><h4>▤ Mis registros</h4><p>Tienes ${records.length} resultado(s) guardado(s) en este navegador.</p><button data-go="history">Ver historial →</button></article><article class="app-card"><h4>✉ Hablar con un técnico</h4><p>Escribe una consulta de prueba sobre tu cultivo.</p><button data-go="consult">Crear consulta →</button></article><article class="app-card"><h4>☀ Preferencias</h4><p>Activa el modo de mayor contraste para explorar la interfaz.</p><button data-go="settings">Ver preferencias →</button></article></div>`;
  if (view === 'home') content.innerHTML += `<div class="app-card" style="margin-top:14px"><h4>Tu perfil: ${role === 'agricultor' ? 'Agricultor o comunero' : role === 'tecnico' ? 'Técnico o extensionista' : 'Administrador de cooperativa'}</h4><p>Explora las tareas y los ejemplos pensados para tu perfil.</p><button data-go="segment">Abrir mi espacio →</button></div>`;
  if (view === 'segment') {
    const segments = {
      agricultor: `<p class="eyebrow">AGRICULTOR O COMUNERO</p><h3>Tu parcela</h3><p>Revisa tus cultivos, consulta resultados y solicita orientación.</p><div class="app-grid"><article class="app-card"><h4>Analizar cultivo</h4><p>Selecciona papa o maíz y observa un resultado simulado.</p><button data-go="scan">Analizar hoja →</button></article><article class="app-card"><h4>Mis observaciones</h4><p>Consulta tus resultados de ejemplo guardados en este navegador.</p><button data-go="history">Ver historial →</button></article><article class="app-card"><h4>Orientación</h4><p>Escribe una consulta de prueba a un técnico.</p><button data-go="consult">Consultar →</button></article></div>`,
      tecnico: `<p class="eyebrow">TÉCNICO O EXTENSIONISTA</p><h3>Seguimiento de campo</h3><p>Registra inspecciones de ejemplo durante tus visitas. Se guardan solo en este navegador.</p><form id="inspection-form" class="app-card"><label for="plot">Nombre de parcela</label><input id="plot" required maxlength="60" placeholder="Ejemplo: Parcela Norte"><label for="inspection-crop">Cultivo</label><select id="inspection-crop"><option>Papa</option><option>Maíz</option></select><label for="observation">Observación</label><textarea id="observation" required rows="3" maxlength="300" placeholder="Describe lo observado"></textarea><p><button class="button">Guardar inspección de prueba</button></p></form><div id="inspection-list"></div>`,
      cooperativa: `<p class="eyebrow">ADMINISTRADOR DE COOPERATIVA</p><h3>Resumen comunitario</h3><p>Ejemplo ilustrativo de seguimiento de casos. Los datos no provienen de parcelas reales.</p><div class="app-grid"><article class="app-card"><h4>12 parcelas</h4><p>Registradas en el ejemplo</p></article><article class="app-card"><h4>3 casos por revisar</h4><p>Casos simulados · papa y maíz</p></article></div><div class="app-card" style="margin-top:14px"><h4>Crear aviso preventivo</h4><p>Escribe un aviso de ejemplo para la comunidad. No se envía a personas reales.</p><form id="alert-form"><label for="alert-message">Mensaje del aviso</label><textarea id="alert-message" rows="3" required maxlength="300" placeholder="Ejemplo: Revisar las hojas de papa"></textarea><p><button class="button">Mostrar aviso simulado</button></p></form><div id="alert-result"></div></div>`
    }; content.innerHTML=segments[role]; if(role === 'tecnico') renderInspections();
  }
  if (view === 'scan') content.innerHTML = `<p class="eyebrow">ANÁLISIS DE EJEMPLO</p><h3>Cuéntanos sobre tu cultivo</h3><p>Selecciona un cultivo y, si deseas, una imagen. El resultado es fijo y no analiza la fotografía.</p><form id="scan-form"><label for="crop">Cultivo</label><select id="crop"><option value="papa" ${lastCrop === 'papa' ? 'selected' : ''}>Papa</option><option value="maiz" ${lastCrop === 'maiz' ? 'selected' : ''}>Maíz</option></select><label for="photo">Fotografía de la hoja (opcional)</label><input id="photo" type="file" accept="image/*"><p><button class="button">Simular análisis ↗</button></p></form><div id="result"></div>`;
  if (view === 'history') content.innerHTML = `<p class="eyebrow">MIS REGISTROS</p><h3>Historial de ejemplos</h3><p>Los registros se guardan solo en este navegador y pueden eliminarse.</p><div id="history-list">${records.length ? records.map((r,i) => `<div class="history-item"><strong>${escapeText(r.crop)} · ${escapeText(r.result)}</strong><br><small>${escapeText(r.date)} · Resultado simulado</small> <button class="plain" data-delete="${i}">Eliminar</button></div>`).join('') : '<p>Aún no tienes resultados guardados. Prueba un análisis.</p>'}</div><button class="small-button" data-go="scan">Nuevo análisis →</button>`;
  if (view === 'consult') content.innerHTML = `<p class="eyebrow">CONSULTA DE PRUEBA</p><h3>Consulta a un técnico</h3><p>Escribe tu duda. La respuesta es automática y no se envía a una persona.</p><form id="consult-form"><label for="question">Tu consulta</label><textarea id="question" required rows="4" maxlength="500" placeholder="Describe lo que observaste en tu cultivo"></textarea><p><button class="button">Enviar consulta simulada ↗</button></p></form><div id="reply"></div>`;
  if (view === 'settings') content.innerHTML = `<p class="eyebrow">PREFERENCIAS</p><h3>Una pantalla más cómoda</h3><p>Prueba el contraste pensado para mejorar la lectura en el campo.</p><div class="app-card"><h4>☀ Modo Sol</h4><p>Aumenta el contraste en esta demostración.</p><button id="sun" aria-pressed="${document.body.classList.contains('sun')}">${document.body.classList.contains('sun') ? 'Desactivar' : 'Activar'} modo Sol</button></div><p>La asistencia por voz y la versión en quechua son funcionalidades propuestas para la aplicación móvil; aún no están implementadas en esta demo.</p>`;
}
content.addEventListener('click', event => {
  const go = event.target.closest('[data-go]'); if (go) { show(go.dataset.go); return; }
  const del = event.target.closest('[data-delete]'); if (del) { records.splice(Number(del.dataset.delete),1); writeStorage('agroscan-records', JSON.stringify(records)); show('history'); notify('Registro eliminado de este navegador.'); return; }
  if (event.target.id === 'save-result' && currentResult) { records.unshift(currentResult); writeStorage('agroscan-records', JSON.stringify(records)); event.target.disabled = true; notify('Resultado de ejemplo guardado en el historial.'); }
  if (event.target.id === 'sun') { document.body.classList.toggle('sun'); show('settings'); notify('Preferencia de contraste actualizada.'); }
});
function renderInspections() { const node = document.querySelector('#inspection-list'); if (!node) return; let entries=[]; try { entries=JSON.parse(readStorage('agroscan-inspections','[]')); } catch(error) {} node.innerHTML=entries.length ? '<h4>Inspecciones de ejemplo</h4>'+entries.map(x=>`<div class="history-item"><strong>${escapeText(x.plot)} · ${escapeText(x.crop)}</strong><p>${escapeText(x.observation)}</p></div>`).join('') : '<p>Aún no hay inspecciones registradas.</p>'; }
content.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'inspection-form') { let entries=[]; try { entries=JSON.parse(readStorage('agroscan-inspections','[]')); } catch(error) {} entries.unshift({plot:document.querySelector('#plot').value.trim(),crop:document.querySelector('#inspection-crop').value,observation:document.querySelector('#observation').value.trim()}); writeStorage('agroscan-inspections', JSON.stringify(entries)); event.target.reset(); renderInspections(); notify('Inspección de prueba guardada localmente si el navegador lo permite.'); }
  if (event.target.id === 'alert-form') { document.querySelector('#alert-result').innerHTML = `<div class="result"><strong>Aviso de ejemplo</strong><p>${escapeText(document.querySelector('#alert-message').value)}</p><p>No se envió ninguna notificación.</p></div>`; notify('Aviso simulado creado.'); }
  if (event.target.id === 'scan-form') { lastCrop = document.querySelector('#crop').value; writeStorage('agroscan-crop', lastCrop); const crop = lastCrop === 'papa' ? 'Papa' : 'Maíz'; const result = lastCrop === 'papa' ? 'Posible rancha' : 'Posible roya'; currentResult = {crop, result, date:new Date().toLocaleString('es-PE')}; document.querySelector('#result').innerHTML = `<div class="result"><strong>Ejemplo: ${result}</strong><p>Confianza y severidad: datos ilustrativos, sin análisis real.</p><p>Observa la planta y consulta a un técnico antes de aplicar cualquier producto. Usa protección y sigue la etiqueta del producto.</p><button type="button" class="small-button" id="save-result">Guardar ejemplo</button> <button type="button" class="small-button" data-go="consult">Consultar a un técnico</button></div>`; notify('El resultado mostrado es una simulación.'); }
  if (event.target.id === 'consult-form') { document.querySelector('#reply').innerHTML = '<div class="result"><strong>Respuesta de ejemplo</strong><p>Gracias por tu consulta. Revisa la planta con un técnico de tu zona antes de tomar una decisión. Este mensaje es automático.</p></div>'; notify('Consulta simulada; no se ha enviado ningún mensaje.'); }
});
document.querySelector('#contact-form').addEventListener('submit', event => { event.preventDefault(); document.querySelector('#contact-status').textContent = 'Gracias. Esta es una prueba: tu consulta no ha sido enviada.'; event.target.reset(); });
start();

