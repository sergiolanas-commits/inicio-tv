// Inicio · servicio local dentro de TizenBrew (Node antiguo: ES5).
// Expone en 127.0.0.1:8099 la lista de apps, su ícono y la orden de abrir una app.
var http = require('http');
var fs = require('fs');
var url = require('url');

var PORT = 8099;

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

var server = http.createServer(function (req, res) {
  var u = url.parse(req.url, true);

  if (u.pathname === '/ping') return send(res, 200, { ok: true });

  if (u.pathname === '/apps') {
    try {
      tizen.application.getAppsInfo(function (list) {
        send(res, 200, list.map(function (a) { return { id: a.id, name: a.name, iconPath: a.iconPath }; }));
      }, function (e) { send(res, 500, { error: String(e && e.name) }); });
    } catch (e) { send(res, 500, { error: String(e) }); }
    return;
  }

  if (u.pathname === '/launch') {
    var id = String(u.query.id || '');
    if (!id) return send(res, 400, { error: 'missing id' });
    try {
      tizen.application.launch(id,
        function () { send(res, 200, { ok: true }); },
        function (e) { send(res, 500, { error: String(e && e.name) }); });
    } catch (e) { send(res, 500, { error: String(e) }); }
    return;
  }

  if (u.pathname === '/icon') {
    var p = String(u.query.path || '').replace(/^file:\/\//, '');
    if (!/\.(png|jpe?g)$/i.test(p)) return send(res, 400, { error: 'not an image' });
    fs.readFile(p, function (err, data) {
      if (err) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { 'Content-Type': /png$/i.test(p) ? 'image/png' : 'image/jpeg',
        'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=86400' });
      res.end(data);
    });
    return;
  }

  send(res, 404, { error: 'unknown' });
});

server.on('error', function () { /* el puerto ya está en uso: el servicio sigue activo de antes */ });
server.listen(PORT, '127.0.0.1');
