/* Inicio — home launcher for Samsung Tizen TV (2018+). ES5 on purpose for old Chromium. */
(function () {
  'use strict';

  // ---------- Config ----------
  var CONFIG = {
    city: 'Tlaxcala',
    lat: 19.3139,
    lon: -98.2404,
    use12h: true,
    idleMinutes: 3,
    apps: [
      // match: lowercase fragments to find the installed app by name; avoid: fragments to skip
      // ids: Samsung app IDs tried in order when the app list isn't readable (inside TizenBrew)
      { label: 'TizenTube', sub: 'Sin anuncios', module: 'tizentube', letter: 'T', color: '#e62117' },
      { label: 'Netflix',   match: ['netflix'], ids: ['3201907018807', '11101200001', 'RN1MCdNq8t.Netflix'], letter: 'N', color: '#e50914' },
      { label: 'Disney+',   match: ['disney'], ids: ['3201901017640', '3202009021709', '3202204027038', 'MCmYXNxgcu.DisneyPlus'], letter: 'D', color: '#1f4fd1' },
      { label: 'Prime Video', match: ['prime video', 'amazon prime'], ids: ['3201910019365', '3201512006785', 'evKhCgZelL.AmazonIgnitionLauncher2'], letter: 'P', color: '#1aa3ff' },
      { label: 'Apple TV',  match: ['apple tv'], avoid: ['music'], ids: ['3201807016597'], letter: 'A', color: '#3a3a3c' },
      { label: 'HBO Max',   match: ['hbo max', 'max'], exact: ['max', 'hbo max', 'hbomax'], ids: ['3202301029760', '3201601007230'], letter: 'H', color: '#5b2bd8' },
      { label: 'Apple Music', match: ['apple music'], ids: ['3201908019041', '3201908019022'], letter: '♪', color: '#fa2d48' },
      { label: 'ViX',       match: ['vix'], ids: [], letter: 'V', color: '#ff6b00' }
    ]
  };

  // ---------- Profiles ----------
  var PROFILES = [
    { name: 'Jocelyn', grad: 'linear-gradient(135deg,#ff8fc7 0%,#ec4899 50%,#a21caf 100%)', accent: 'rgba(244,114,182,.85)',
      blobs: ['rgba(236,72,153,.60)', 'rgba(192,38,211,.48)', 'rgba(251,113,133,.42)'] },
    { name: 'Renato', grad: 'linear-gradient(135deg,#7dd3fc 0%,#3b82f6 50%,#1e3a8a 100%)', accent: 'rgba(96,165,250,.85)',
      blobs: ['rgba(59,130,246,.60)', 'rgba(37,99,235,.48)', 'rgba(14,165,233,.42)'] },
    { name: 'Sergio', grad: 'linear-gradient(135deg,#bef264 0%,#22c55e 50%,#065f46 100%)', accent: 'rgba(74,222,128,.85)',
      blobs: ['rgba(34,197,94,.55)', 'rgba(16,185,129,.45)', 'rgba(132,204,22,.38)'] }
  ];
  var current = null;      // selected profile
  var picking = true;      // profile screen visible
  var pickIndex = 0;

  function lastProfile() { try { return parseInt(localStorage.getItem('inicio.profile'), 10) || 0; } catch (e) { return 0; } }
  function saveProfile(i) { try { localStorage.setItem('inicio.profile', String(i)); } catch (e) {} }

  function buildPicker() {
    var row = document.getElementById('pRow');
    row.innerHTML = '';
    for (var i = 0; i < PROFILES.length; i++) {
      var p = PROFILES[i];
      var el = document.createElement('div');
      el.className = 'p-card';
      el.innerHTML = '<div class="p-avatar" style="background:' + p.grad + '">' + p.name.charAt(0) + '</div>' +
        '<div class="p-name">' + p.name + '</div>';
      row.appendChild(el);
    }
  }
  function setPick(i) {
    var cards = document.getElementById('pRow').children;
    pickIndex = (i + cards.length) % cards.length;
    for (var k = 0; k < cards.length; k++) cards[k].className = 'p-card' + (k === pickIndex ? ' focus' : '');
    applyTheme(PROFILES[pickIndex]); // live preview of the color
  }
  function applyTheme(p) {
    var bl = document.querySelectorAll('.blob');
    for (var i = 0; i < bl.length; i++)
      bl[i].style.background = 'radial-gradient(circle, ' + p.blobs[i] + ' 0%, rgba(0,0,0,0) 65%)';
    var st = document.getElementById('themeStyle');
    st.textContent = '.tile.focus{border-color:' + p.accent + ';box-shadow:0 24px 60px rgba(0,0,0,.45),0 0 40px ' + p.accent.replace('.85', '.35') + ';}' +
      '.p-card.focus .p-avatar{box-shadow:0 0 0 6px #fff, 0 0 60px ' + p.accent + ';}';
  }
  function openPicker() {
    picking = true;
    document.body.className = document.body.className.replace(' picked', '');
    setPick(current ? PROFILES.indexOf(current) : lastProfile());
  }
  function choose() {
    current = PROFILES[pickIndex];
    saveProfile(pickIndex);
    picking = false;
    document.body.className += ' picked';
    document.getElementById('who').innerHTML = '<span class="who-dot" style="background:' + current.grad + '">' +
      current.name.charAt(0) + '</span>' + current.name + '<span class="who-hint">cambiar</span>';
    tickClock();
    if (window.Widgets) window.Widgets.render(current.name);
    setZone('dock');
  }

  var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var hasTizen = typeof window.tizen !== 'undefined' && window.tizen.application;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Clock ----------
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tickClock() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var label = '';
    if (CONFIG.use12h) {
      label = h < 12 ? 'a. m.' : 'p. m.';
      h = h % 12; if (h === 0) h = 12;
    }
    $('clock').textContent = h + ':' + pad(m);
    $('ampm').textContent = label;
    var dn = DAYS[d.getDay()];
    $('date').textContent = dn.charAt(0).toUpperCase() + dn.slice(1) + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
    var hr = d.getHours();
    $('greeting').textContent = (hr < 12 ? 'Buenos días' : (hr < 19 ? 'Buenas tardes' : 'Buenas noches')) +
      (current ? ', ' + current.name : '');
  }

  // ---------- Weather (Open-Meteo, no API key) ----------
  var ICONS = {
    sun: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="12" fill="#FFD25A"/><g stroke="#FFD25A" stroke-width="4" stroke-linecap="round"><path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M13.6 50.4l5-5M45.4 18.6l5-5"/></g></svg>',
    moon: '<svg viewBox="0 0 64 64"><path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z" fill="#E6E9F5"/></svg>',
    partly: '<svg viewBox="0 0 64 64"><circle cx="24" cy="24" r="10" fill="#FFD25A"/><path d="M22 50h26a10 10 0 0 0 0-20 14 14 0 0 0-26 4 8 8 0 0 0 0 16z" fill="#E6E9F5"/></svg>',
    cloud: '<svg viewBox="0 0 64 64"><path d="M18 48h30a11 11 0 0 0 0-22 15 15 0 0 0-29 4 9 9 0 0 0-1 18z" fill="#C9CEDD"/></svg>',
    fog: '<svg viewBox="0 0 64 64"><g stroke="#C9CEDD" stroke-width="4" stroke-linecap="round"><path d="M12 24h40M8 34h48M14 44h36"/></g></svg>',
    rain: '<svg viewBox="0 0 64 64"><path d="M18 38h30a11 11 0 0 0 0-22 15 15 0 0 0-29 4 9 9 0 0 0-1 18z" fill="#C9CEDD"/><g stroke="#6FB6FF" stroke-width="4" stroke-linecap="round"><path d="M24 46l-3 8M34 46l-3 8M44 46l-3 8"/></g></svg>',
    storm: '<svg viewBox="0 0 64 64"><path d="M18 36h30a11 11 0 0 0 0-22 15 15 0 0 0-29 4 9 9 0 0 0-1 18z" fill="#AEB4C6"/><path d="M34 38l-8 12h7l-4 10 12-15h-7l4-7z" fill="#FFD25A"/></svg>',
    snow: '<svg viewBox="0 0 64 64"><path d="M18 38h30a11 11 0 0 0 0-22 15 15 0 0 0-29 4 9 9 0 0 0-1 18z" fill="#C9CEDD"/><g fill="#fff"><circle cx="24" cy="50" r="3"/><circle cx="34" cy="54" r="3"/><circle cx="44" cy="50" r="3"/></g></svg>'
  };

  function describe(code, isDay) {
    if (code === 0) return { t: isDay ? 'Despejado' : 'Noche despejada', i: isDay ? 'sun' : 'moon' };
    if (code === 1 || code === 2) return { t: 'Parcialmente nublado', i: isDay ? 'partly' : 'cloud' };
    if (code === 3) return { t: 'Nublado', i: 'cloud' };
    if (code === 45 || code === 48) return { t: 'Neblina', i: 'fog' };
    if (code >= 51 && code <= 57) return { t: 'Llovizna', i: 'rain' };
    if (code >= 61 && code <= 67) return { t: 'Lluvia', i: 'rain' };
    if (code >= 71 && code <= 77) return { t: 'Nieve', i: 'snow' };
    if (code >= 80 && code <= 82) return { t: 'Chubascos', i: 'rain' };
    if (code >= 95) return { t: 'Tormenta', i: 'storm' };
    return { t: '—', i: 'cloud' };
  }

  function loadWeather() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + CONFIG.lat + '&longitude=' + CONFIG.lon +
      '&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&forecast_days=1';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 15000;
    xhr.onload = function () {
      try {
        var data = JSON.parse(xhr.responseText);
        var c = data.current, dy = data.daily;
        var info = describe(c.weather_code, c.is_day === 1);
        $('wTemp').textContent = Math.round(c.temperature_2m) + '°';
        $('wDesc').textContent = CONFIG.city + ' · ' + info.t;
        $('wIcon').innerHTML = ICONS[info.i];
        var rain = dy.precipitation_probability_max ? dy.precipitation_probability_max[0] : null;
        $('wRange').textContent = 'Máx ' + Math.round(dy.temperature_2m_max[0]) + '°  ·  Mín ' +
          Math.round(dy.temperature_2m_min[0]) + '°' + (rain !== null ? '  ·  Lluvia ' + rain + '%' : '');
      } catch (e) { $('wDesc').textContent = CONFIG.city + ' · sin datos'; }
    };
    xhr.onerror = xhr.ontimeout = function () { $('wDesc').textContent = CONFIG.city + ' · sin conexión'; };
    xhr.send();
  }

  // ---------- Apps ----------
  var tiles = [];
  var focusIndex = 0;

  function findApp(list, def) {
    var best = null;
    for (var i = 0; i < list.length; i++) {
      var n = (list[i].name || '').toLowerCase();
      var skip = false;
      if (def.avoid) for (var a = 0; a < def.avoid.length; a++) if (n.indexOf(def.avoid[a]) !== -1) skip = true;
      if (skip) continue;
      if (def.exact) {
        for (var e = 0; e < def.exact.length; e++) if (n === def.exact[e]) return list[i];
        continue;
      }
      for (var k = 0; k < def.match.length; k++) if (n.indexOf(def.match[k]) !== -1) { best = list[i]; break; }
      if (best) return best;
    }
    return null;
  }

  function buildDock(installed) {
    var dock = $('dock');
    dock.innerHTML = '';
    tiles = [];
    for (var i = 0; i < CONFIG.apps.length; i++) {
      var def = CONFIG.apps[i];
      var app = (installed && !def.module) ? findApp(installed, def) : null;
      var el = document.createElement('div');
      var missing = installed && !def.module && !app;
      el.className = 'tile' + (missing ? ' missing' : '');
      var src = app && app.iconPath ? app.iconPath : '';
      if (src && svcOk) src = SVC + '/icon?path=' + encodeURIComponent(src);
      else if (src && src.charAt(0) === '/') src = 'file://' + src;
      var icon = src ? '<img src="' + src + '" alt="">' : def.letter;
      var sub = def.sub || '';
      if (missing) sub = 'No instalada';
      el.innerHTML = '<div class="ico" style="background:' + (src ? 'transparent' : def.color) + '">' + icon + '</div><div class="name">' + def.label + '</div>' +
        (sub ? '<div class="sub">' + sub + '</div>' : '');
      // fallback to the letter if the TV icon fails to load
      var img = el.querySelector('img');
      if (img) img.onerror = (function (box, letter) { return function () { box.innerHTML = letter; }; })(el.querySelector('.ico'), def.letter);
      dock.appendChild(el);
      tiles.push({ el: el, app: app, def: def });
    }
    setFocus(focusIndex);
  }

  function setFocus(i) {
    if (!tiles.length) return;
    focusIndex = (i + tiles.length) % tiles.length;
    for (var k = 0; k < tiles.length; k++) tiles[k].el.className = tiles[k].el.className.replace(' focus', '');
    tiles[focusIndex].el.className += ' focus';
  }

  function launch() {
    var t = tiles[focusIndex];
    if (!t) return;
    if (t.def.module) { launchBrewModule(t.def.module, t.def.label); return; }
    var ids = (t.app ? [t.app.id] : []).concat(t.def.ids || []);
    if (!ids.length) { flash(t.def.label + ': falta su ID en esta tele'); return; }
    flash('Abriendo ' + t.def.label + '…');
    if (hasTizen) tryIds(ids, 0, t.def.label);
    else svcLaunch(ids, 0, t.def.label, '');
  }

  // 0) Through the local service (works inside TizenBrew)
  function svcLaunch(ids, i, label, lastErr) {
    if (i >= ids.length) {
      if (lastErr === 'sin servicio') remoteLaunch(ids, 0, label); // service not running: try the TV channel
      else flash(label + ' no se pudo abrir (' + lastErr + ')');
      return;
    }
    svcGet('/launch?id=' + encodeURIComponent(ids[i]), function () {}, function (err) {
      svcLaunch(ids, i + 1, label, err || 'error');
    });
  }

  // 1) Tizen API (works when installed as a normal app)
  function tryIds(ids, i, label) {
    if (i >= ids.length) { remoteLaunch(ids, 0, label); return; } // fall back to the TV's remote-control channel
    try {
      tizen.application.launch(ids[i], null, function () { tryIds(ids, i + 1, label); });
    } catch (e) { tryIds(ids, i + 1, label); }
  }

  // 2) The TV's own remote-control channel (same one phone remote apps use).
  //    Works from inside TizenBrew. The first time, the TV asks to allow "Inicio".
  var rc = null, rcReady = false, rcQueue = [], rcPending = null;
  function rcSend(obj) { if (rcReady) rc.send(JSON.stringify(obj)); else rcQueue.push(obj); }
  function rcConnect() {
    if (rc && (rc.readyState === 0 || rc.readyState === 1)) return;
    rcReady = false;
    try { rc = new WebSocket('ws://127.0.0.1:8001/api/v2/channels/samsung.remote.control?name=' + btoa('Inicio')); }
    catch (e) { flash('No se pudo conectar con la tele'); return; }
    rc.onmessage = function (ev) {
      var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.event === 'ms.channel.connect') {
        rcReady = true;
        while (rcQueue.length) rc.send(JSON.stringify(rcQueue.shift()));
      } else if (msg.event === 'ms.channel.unauthorized') {
        flash('La tele no dio permiso. Vuelve a intentar y elige "Permitir"');
      } else if (msg.event === 'ed.apps.launch' && rcPending) {
        var p = rcPending; rcPending = null; clearTimeout(p.timer);
        if (msg.data === 200 || msg.data === '200' || msg.data === true) return; // opened
        remoteLaunch(p.ids, p.i + 1, p.label);
      }
    };
    rc.onerror = function () { flash('No se pudo conectar con la tele'); };
    rc.onclose = function () { rcReady = false; };
  }
  function remoteLaunch(ids, i, label) {
    if (i >= ids.length) { flash(label + ' no se pudo abrir'); return; }
    rcConnect();
    rcPending = { ids: ids, i: i, label: label,
      timer: setTimeout(function () { if (rcPending) { rcPending = null; remoteLaunch(ids, i + 1, label); } }, rcReady ? 4000 : 20000) };
    rcSend({ method: 'ms.channel.emit', params: { event: 'ed.apps.launch', to: 'host',
      data: { appId: ids[i], action_type: /\./.test(ids[i]) ? 'NATIVE_LAUNCH' : 'DEEP_LINK' } } });
  }

  // Launch a TizenBrew module (e.g. TizenTube) through TizenBrew's local service
  function launchBrewModule(nameFragment, label) {
    var ws;
    try { ws = new WebSocket('ws://localhost:8081'); } catch (e) { flash('No se pudo abrir ' + label); return; }
    var done = false;
    ws.onopen = function () { ws.send(JSON.stringify({ type: 4 })); };          // GetModules
    ws.onmessage = function (ev) {
      var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type !== 4 || !msg.payload || done) return;
      var mdl = null;
      for (var i = 0; i < msg.payload.length; i++)
        if ((msg.payload[i].fullName || '').toLowerCase().indexOf(nameFragment) !== -1) mdl = msg.payload[i];
      if (!mdl) { flash(label + ' no está en TizenBrew'); ws.close(); return; }
      done = true;
      try { for (var k = 0; k < (mdl.keys || []).length; k++) tizen.tvinputdevice.registerKey(mdl.keys[k]); } catch (e) {}
      ws.send(JSON.stringify({ type: 5, payload: mdl }));                      // LaunchModule
      if (!mdl.evaluateScriptOnDocumentStart) setTimeout(function () { location.href = mdl.appPath; }, 150);
    };
    ws.onerror = function () { flash('No se pudo abrir ' + label); };
  }

  function flash(msg) {
    var h = $('hint');
    h.textContent = msg;
    clearTimeout(flash.t);
    flash.t = setTimeout(function () { h.textContent = HINTS[zone]; }, 3000);
  }

  // ---------- Local service (runs inside TizenBrew, has permission to list/launch apps) ----------
  var SVC = 'http://127.0.0.1:8099';
  var svcOk = false;
  function svcGet(path, ok, fail) {
    var x = new XMLHttpRequest();
    x.open('GET', SVC + path, true);
    x.timeout = 6000;
    x.onload = function () {
      var d = null; try { d = JSON.parse(x.responseText); } catch (e) {}
      if (x.status === 200) ok(d); else fail(d && d.error);
    };
    x.onerror = x.ontimeout = function () { fail('sin servicio'); };
    x.send();
  }

  function loadApps(attempt) {
    attempt = attempt || 0;
    if (hasTizen) {
      try { tizen.application.getAppsInfo(function (list) { buildDock(list); }, function () { fromService(); }); }
      catch (e) { fromService(); }
      return;
    }
    fromService();
    function fromService() {
      svcGet('/apps', function (list) { svcOk = true; buildDock(list); }, function () {
        if (!tiles.length) buildDock(null);
        if (attempt < 8) setTimeout(function () { loadApps(attempt + 1); }, 1500); // service may still be starting
      });
    }
  }

  // ---------- Focus zones: dock (apps) · panel (widget) · who (profile) ----------
  var zone = 'dock';
  var HINTS = {
    dock: '◀ ▶ para elegir · OK para abrir · ▲ más opciones',
    panel: '◀ ▶ para navegar · OK para abrir · ▼ apps · ▲ perfil',
    who: 'OK para cambiar de perfil · ▼ regresar'
  };
  function setZone(z) {
    zone = z;
    var panel = $('panel'), who = $('who');
    panel.className = panel.className.replace(' focus', '') + (z === 'panel' ? ' focus' : '');
    who.className = 'who' + (z === 'who' ? ' focus' : '');
    var dock = $('dock');
    dock.className = 'dock' + (z === 'dock' ? '' : ' dim');
    if (window.Widgets) window.Widgets.pause(z === 'panel');
    $('hint').textContent = HINTS[z];
  }
  function openFromPanel() {
    var platform = window.Widgets.currentPlatform();
    if (!platform) { flash('Este widget es solo informativo'); return; }
    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i].def.label === platform) { focusIndex = i; setFocus(i); setZone('dock'); launch(); return; }
    }
    flash(platform + ' no está en tus apps');
  }

  // ---------- Remote control ----------
  var idleTimer = null;
  function wake() {
    document.body.className = document.body.className.replace('ambient', '');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { document.body.className += ' ambient'; }, CONFIG.idleMinutes * 60000);
  }

  document.addEventListener('keydown', function (e) {
    var wasAmbient = document.body.className.indexOf('ambient') !== -1;
    wake();
    if (wasAmbient) { e.preventDefault(); return; } // first press only wakes
    if (picking) {
      if (e.keyCode === 37) setPick(pickIndex - 1);
      else if (e.keyCode === 39) setPick(pickIndex + 1);
      else if (e.keyCode === 13) choose();
      else if (e.keyCode === 10009 && current) { picking = false; document.body.className += ' picked'; applyTheme(current); }
      return;
    }
    if (zone === 'panel') {
      if (e.keyCode === 37) window.Widgets.prev();
      else if (e.keyCode === 39) window.Widgets.next();
      else if (e.keyCode === 38) setZone('who');
      else if (e.keyCode === 40) setZone('dock');
      else if (e.keyCode === 13) openFromPanel();
      return;
    }
    if (zone === 'who') {
      if (e.keyCode === 13) { setZone('dock'); openPicker(); }
      else if (e.keyCode === 40) setZone(window.Widgets && window.Widgets.active() ? 'panel' : 'dock');
      return;
    }
    switch (e.keyCode) {
      case 38: setZone(window.Widgets && window.Widgets.active() ? 'panel' : 'who'); break; // up
      case 37: setFocus(focusIndex - 1); break;        // left
      case 39: setFocus(focusIndex + 1); break;        // right
      case 13: launch(); break;                        // OK
      case 10009:                                      // Return / Back
        if (hasTizen) { try { tizen.application.getCurrentApplication().exit(); } catch (x) {} }
        break;
    }
  });

  // Refresh installed apps when coming back to this screen
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { loadApps(); loadWeather(); tickClock(); wake(); }
  });

  // ---------- Start ----------
  tickClock();
  setInterval(tickClock, 1000 * 15);
  loadWeather();
  setInterval(loadWeather, 1000 * 60 * 20);
  loadApps();
  buildPicker();
  openPicker();
  wake();
})();
