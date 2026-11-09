/* Per-profile widgets: NBA scores (Renato) and series picks (Jocelyn). ES5 for old Tizen Chromium. */
(function () {
  'use strict';

  var SERIES = [
    { t: 'Mindhunter', p: 'Netflix', g: 'Psicología criminal', d: 'Dos agentes del FBI entrevistan a asesinos en serie para entender cómo piensan.' },
    { t: 'Severance', p: 'Apple TV', g: 'Thriller psicológico', d: 'Empleados con la memoria dividida entre el trabajo y su vida personal.' },
    { t: 'Big Little Lies', p: 'HBO Max', g: 'Drama · Misterio', d: 'Secretos, amistad y una muerte que une a cinco madres de Monterey.' },
    { t: 'You', p: 'Netflix', g: 'Thriller psicológico', d: 'La obsesión de un librero contada desde su propia cabeza.' },
    { t: 'Homecoming', p: 'Prime Video', g: 'Thriller psicológico', d: 'Una terapeuta descubre qué había detrás del programa donde trabajaba.' },
    { t: 'Shrinking', p: 'Apple TV', g: 'Drama · Terapia', d: 'Un terapeuta en duelo empieza a decirles a sus pacientes lo que piensa.' },
    { t: 'Sharp Objects', p: 'HBO Max', g: 'Thriller · Drama', d: 'Una periodista vuelve a su pueblo para cubrir crímenes que la confrontan con su pasado.' },
    { t: 'Adolescence', p: 'Netflix', g: 'Drama', d: 'Una familia enfrenta lo impensable tras la detención de su hijo de 13 años.' },
    { t: 'Defending Jacob', p: 'Apple TV', g: 'Drama · Thriller', d: 'Un fiscal defiende a su hijo, acusado de un crimen en su escuela.' },
    { t: 'The Act', p: 'Disney+', g: 'Drama psicológico', d: 'La inquietante relación entre una madre sobreprotectora y su hija.' },
    { t: 'Baby Reindeer', p: 'Netflix', g: 'Drama psicológico', d: 'Un comediante es acosado por una mujer a la que mostró un gesto de amabilidad.' },
    { t: 'Behind Her Eyes', p: 'Netflix', g: 'Thriller psicológico', d: 'Un triángulo entre una madre soltera, su jefe y la esposa de él, con giros inesperados.' }
  ];
  var PLATFORM_COLOR = { 'Netflix': '#e50914', 'Apple TV': '#8e8e93', 'HBO Max': '#5b2bd8', 'Prime Video': '#1aa3ff', 'Disney+': '#1f4fd1' };

  // Renato's teams (ESPN abbreviations): Warriors, Spurs, Lakers
  var FAVS = ['GS', 'SA', 'LAL'];
  function isFav(e) {
    var cs = e.competitions[0].competitors;
    for (var i = 0; i < cs.length; i++) if (FAVS.indexOf((cs[i].team || {}).abbreviation) !== -1) return true;
    return false;
  }

  var timer = null, refresh = null, idx = 0, items = [], mode = null, meta = null, paused = false, rotateMs = 0;
  var $ = function (id) { return document.getElementById(id); };
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function stop() { clearInterval(timer); clearTimeout(refresh); timer = refresh = null; }

  function show(i) {
    if (!items.length) return;
    idx = (i + items.length) % items.length;
    var body = $('wBody');
    body.style.opacity = 0;
    setTimeout(function () {
      body.innerHTML = items[idx];
      body.style.opacity = 1;
      var dots = '';
      var n = Math.min(items.length, 12);
      for (var k = 0; k < n; k++) dots += '<i' + (k === idx % n ? ' class="on"' : '') + '></i>';
      $('wDots').innerHTML = dots;
    }, 300);
  }
  function rotate(ms) {
    rotateMs = ms; clearInterval(timer);
    timer = setInterval(function () { if (!paused) show(idx + 1); }, ms);
  }

  // ---------- Jocelyn: series ----------
  function seriesCards() {
    var list = SERIES.slice();
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = list[i]; list[i] = list[j]; list[j] = t; }
    meta = list;
    return list.map(function (s) {
      return '<div class="s-card">' +
        '<div class="s-meta"><span class="chip" style="background:' + (PLATFORM_COLOR[s.p] || '#555') + '">' + s.p + '</span>' +
        '<span class="s-genre">' + s.g + '</span></div>' +
        '<div class="s-title">' + s.t + '</div>' +
        '<div class="s-desc">' + s.d + '</div></div>';
    });
  }

  // ---------- Renato: NBA ----------
  function ymd(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function localTime(iso) {
    var d = new Date(iso), h = d.getHours(), m = d.getMinutes();
    var ap = h < 12 ? 'a. m.' : 'p. m.'; h = h % 12; if (h === 0) h = 12;
    var today = new Date(), tom = new Date(); tom.setDate(today.getDate() + 1);
    var day = d.toDateString() === today.toDateString() ? 'Hoy' : (d.toDateString() === tom.toDateString() ? 'Mañana' : (d.getDate() + '/' + (d.getMonth() + 1)));
    return day + ' · ' + h + ':' + pad(m) + ' ' + ap;
  }
  function teamRow(c, winner) {
    var t = c.team || {};
    var rec = c.records && c.records[0] ? c.records[0].summary : '';
    var c1 = '#' + (t.color || '444444'), c2 = '#' + (t.alternateColor || t.color || '222222');
    var fav = FAVS.indexOf(t.abbreviation) !== -1;
    return '<div class="n-team' + (winner ? ' win' : '') + (fav ? ' fav' : '') + '">' +
      '<span class="n-badge" style="background:linear-gradient(135deg,' + c1 + ' 0%,' + c1 + ' 55%,' + c2 + ' 100%)">' + (t.abbreviation || '') + '</span>' +
      '<span class="n-name">' + (t.shortDisplayName || t.displayName || '') + (fav ? ' <b class="star">★</b>' : '') + '<small>' + rec + '</small></span>' +
      '<span class="n-score">' + (c.score !== undefined && c.score !== '' ? c.score : '') + '</span></div>';
  }
  function nbaCard(e) {
    var comp = e.competitions[0], st = e.status || {}, type = st.type || {};
    var away = null, home = null;
    for (var i = 0; i < comp.competitors.length; i++) {
      if (comp.competitors[i].homeAway === 'home') home = comp.competitors[i]; else away = comp.competitors[i];
    }
    var status, cls = '';
    if (type.state === 'post') status = 'Final';
    else if (type.state === 'in') { status = 'En vivo · ' + (st.period ? 'Q' + st.period : '') + (st.displayClock ? ' ' + st.displayClock : ''); cls = ' live'; }
    else status = localTime(e.date);
    var pre = type.state === 'pre';
    if (pre) { away.score = ''; home.score = ''; }
    var aw = type.state === 'post' && +away.score > +home.score, hw = type.state === 'post' && +home.score > +away.score;
    var fav = isFav(e);
    return '<div class="n-card">' + teamRow(away, aw) + teamRow(home, hw) +
      '<div class="n-status' + cls + '">' + status + (fav ? '<span class="n-fav">Tu equipo</span>' : '') + '</div></div>';
  }
  function loadNBA() {
    var today = new Date(), yest = new Date(), tom = new Date();
    yest.setDate(today.getDate() - 1); tom.setDate(today.getDate() + 1);
    var days = [ymd(yest), ymd(today), ymd(tom)], got = [], pending = days.length, anyLive = false;
    days.forEach(function (day, k) {
      var x = new XMLHttpRequest();
      x.open('GET', 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=' + day, true);
      x.timeout = 15000;
      x.onload = function () {
        try { var ev = JSON.parse(x.responseText).events || []; got[k] = ev; } catch (e) { got[k] = []; }
        done();
      };
      x.onerror = x.ontimeout = function () { got[k] = []; done(); };
      x.send();
    });
    function done() {
      if (--pending > 0 || mode !== 'nba') return;
      // tomorrow: only Renato's teams, so he sees their next game
      var tomFav = (got[2] || []).filter(isFav);
      var all = (got[0] || []).concat(got[1] || [], tomFav);
      // favorites first; then live, upcoming, finals
      var order = { 'in': 0, 'pre': 1, 'post': 2 };
      all.sort(function (a, b) {
        var fa = isFav(a) ? 0 : 1, fb = isFav(b) ? 0 : 1;
        if (fa !== fb) return fa - fb;
        var sa = order[a.status.type.state], sb = order[b.status.type.state];
        return sa !== sb ? sa - sb : (new Date(a.date) - new Date(b.date));
      });
      for (var i = 0; i < all.length; i++) if (all[i].status.type.state === 'in') anyLive = true;
      items = all.map(nbaCard);
      if (!items.length) items = ['<div class="w-empty">No hay partidos de la NBA hoy ni ayer.</div>'];
      show(Math.min(idx, items.length - 1));
      rotate(7000);
      refresh = setTimeout(loadNBA, anyLive ? 60000 : 600000);
    }
  }

  // ---------- Public ----------
  window.Widgets = {
    active: function () { return mode !== null; },
    next: function () { show(idx + 1); },
    prev: function () { show(idx - 1); },
    pause: function (p) { paused = p; },
    // platform of the series on screen (Jocelyn), or null
    currentPlatform: function () { return mode === 'series' && meta && meta[idx] ? meta[idx].p : null; },
    render: function (profileName) {
      stop();
      idx = 0; items = []; meta = null; paused = false;
      var panel = $('panel');
      if (profileName === 'Renato') {
        mode = 'nba';
        $('wTitle').innerHTML = '<span class="w-ball"></span>NBA · Marcadores';
        $('wBody').innerHTML = '<div class="w-empty">Cargando partidos…</div>';
        panel.className = 'panel on nba';
        loadNBA();
      } else if (profileName === 'Jocelyn') {
        mode = 'series';
        $('wTitle').textContent = 'Para ti · Psicología, drama y thriller';
        panel.className = 'panel on series';
        items = seriesCards();
        show(0); rotate(9000);
      } else {
        mode = null;
        panel.className = 'panel';
      }
    }
  };
})();
