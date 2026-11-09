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
      { label: 'TizenTube', sub: 'YouTube sin anuncios', match: ['tizenbrew'], avoid: ['installer'], letter: 'T' },
      { label: 'Netflix',   match: ['netflix'], letter: 'N' },
      { label: 'Apple TV',  match: ['apple tv'], avoid: ['music'], letter: 'A' },
      { label: 'Disney+',   match: ['disney'], letter: 'D' },
      { label: 'Prime Video', match: ['prime video', 'amazon prime'], letter: 'P' },
      { label: 'HBO Max',   match: ['hbo max', 'max'], exact: ['max', 'hbo max', 'hbomax'], letter: 'H' }
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
      current.name.charAt(0) + '</span>' + current.name + '<span class="who-hint">▲ cambiar</span>';
    tickClock();
    if (window.Widgets) window.Widgets.render(current.name);
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
      var app = installed ? findApp(installed, def) : null;
      var el = document.createElement('div');
      el.className = 'tile' + (installed && !app ? ' missing' : '');
      var src = app && app.iconPath ? app.iconPath : '';
      if (src && src.charAt(0) === '/') src = 'file://' + src;
      var icon = src ? '<img src="' + src + '" alt="">' : def.letter;
      var sub = def.sub || '';
      if (installed && !app) sub = 'No instalada';
      el.innerHTML = '<div class="ico">' + icon + '</div><div class="name">' + def.label + '</div>' +
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
    if (!t || !t.app || !hasTizen) return;
    try {
      tizen.application.launch(t.app.id, null, function () {
        flash(t.def.label + ' no se pudo abrir');
      });
    } catch (e) { flash('Error al abrir ' + t.def.label); }
  }

  function flash(msg) {
    var h = $('hint');
    h.textContent = msg;
    setTimeout(function () { h.textContent = '◀ ▶ para elegir · OK para abrir'; }, 3000);
  }

  function loadApps() {
    if (!hasTizen) { buildDock(null); return; }
    try {
      tizen.application.getAppsInfo(function (list) { buildDock(list); }, function () { buildDock(null); });
    } catch (e) { buildDock(null); }
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
    switch (e.keyCode) {
      case 38: openPicker(); break;                    // up → change profile
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
