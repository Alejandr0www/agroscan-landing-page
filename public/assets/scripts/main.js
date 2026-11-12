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
function readStorage(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (error) { return fallback; } }
function writeStorage(key, value) { try { localStorage.setItem(key, value); } catch (error) { /* La demo sigue disponible sin almacenamiento. */ } }
let user = '';
let records = []; try { records = JSON.parse(readStorage('agroscan-records', '[]')); } catch (error) { records = []; }
let lastCrop = readStorage('agroscan-crop', 'papa');
let currentResult = null;
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function notify(message) { status.textContent = message; }
function start() { loginView.hidden = !!user; appView.hidden = !user; logout.hidden = !user; if (user) show('home'); }
document.querySelector('#login-form').addEventListener('submit', event => { event.preventDefault(); user = document.querySelector('#username').value.trim(); if (!user) return; start(); });
logout.addEventListener('click', () => { user = ''; currentResult = null; start(); });
links.forEach(link => link.addEventListener('click', () => { if (!user) { document.querySelector('#username').focus(); return; } show(link.dataset.view); }));
function show(view) {
  status.textContent = '';
  links.forEach(link => link.classList.toggle('active', link.dataset.view === view));
  if (view === 'home') content.innerHTML = `<p class="eyebrow">MI ESPACIO</p><h3>Hola, ${escapeText(user)} 👋</h3><p>Tu cultivo merece una mirada. ¿Qué quieres hacer hoy?</p><div class="app-grid"><article class="app-card"><h4>✳ Analizar una hoja</h4><p>Prueba un resultado de ejemplo para papa o maíz.</p><button data-go="scan">Comenzar →</button></article><article class="app-card"><h4>▤ Mis registros</h4><p>Tienes ${records.length} resultado(s) guardado(s) en este navegador.</p><button data-go="history">Ver historial →</button></article><article class="app-card"><h4>✉ Hablar con un técnico</h4><p>Escribe una consulta de prueba sobre tu cultivo.</p><button data-go="consult">Crear consulta →</button></article><article class="app-card"><h4>☀ Preferencias</h4><p>Activa el modo de mayor contraste para explorar la interfaz.</p><button data-go="settings">Ver preferencias →</button></article></div>`;
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
content.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'scan-form') { lastCrop = document.querySelector('#crop').value; writeStorage('agroscan-crop', lastCrop); const crop = lastCrop === 'papa' ? 'Papa' : 'Maíz'; const result = lastCrop === 'papa' ? 'Posible rancha' : 'Posible roya'; currentResult = {crop, result, date:new Date().toLocaleString('es-PE')}; document.querySelector('#result').innerHTML = `<div class="result"><strong>Ejemplo: ${result}</strong><p>Confianza y severidad: datos ilustrativos, sin análisis real.</p><p>Observa la planta y consulta a un técnico antes de aplicar cualquier producto. Usa protección y sigue la etiqueta del producto.</p><button type="button" class="small-button" id="save-result">Guardar ejemplo</button> <button type="button" class="small-button" data-go="consult">Consultar a un técnico</button></div>`; notify('El resultado mostrado es una simulación.'); }
  if (event.target.id === 'consult-form') { document.querySelector('#reply').innerHTML = '<div class="result"><strong>Respuesta de ejemplo</strong><p>Gracias por tu consulta. Revisa la planta con un técnico de tu zona antes de tomar una decisión. Este mensaje es automático.</p></div>'; notify('Consulta simulada; no se ha enviado ningún mensaje.'); }
});
document.querySelector('#contact-form').addEventListener('submit', event => { event.preventDefault(); document.querySelector('#contact-status').textContent = 'Gracias. Esta es una prueba: tu consulta no ha sido enviada.'; event.target.reset(); });
start();
