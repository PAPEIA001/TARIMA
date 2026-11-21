/* Tarima: compatibility layer for Smart TV browsers (Samsung Tizen, LG webOS, old Android TV, Fire TV).
   Loaded first on every page. Only fills in what the browser lacks, so modern browsers are untouched. ES5 only. */
(function () {
  "use strict";
  var W = window;
  function def(obj, name, fn) { if (obj && !obj[name]) try { Object.defineProperty(obj, name, { value: fn, configurable: true, writable: true }); } catch (e) { obj[name] = fn; } }

  // Visible error banner, so a TV never stays black without saying why.
  W.__tarimaErr = function (msg) {
    try {
      var b = document.getElementById("__err");
      if (!b) {
        b = document.createElement("div"); b.id = "__err";
        b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#b00020;color:#fff;font:bold 20px/1.35 sans-serif;padding:14px 20px";
        (document.body || document.documentElement).appendChild(b);
      }
      b.textContent = "Tarima: este navegador ha tenido un problema (" + msg + "). Recarga la página; si sigue, abre la tele en Chrome o en otro navegador.";
    } catch (e) {}
  };
  W.addEventListener("error", function (e) {
    if (!e || !e.message || /Script error/i.test(e.message)) return;   // ignore third-party noise (YouTube)
    if (e.filename && !/github\.io|localhost|127\.0\.0\.1|tarima/i.test(e.filename)) return;
    W.__tarimaErr(e.message);
  });

  // Object / Array / String
  def(Object, "assign", function (t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; });
  def(Object, "values", function (o) { return Object.keys(o).map(function (k) { return o[k]; }); });
  def(Object, "entries", function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); });
  def(Array, "from", function (a, fn) {
    var out = [];
    if (a == null) return out;
    if (typeof a.length === "number") for (var i = 0; i < a.length; i++) out.push(a[i]);
    else if (typeof Symbol !== "undefined" && a[Symbol.iterator]) { var it = a[Symbol.iterator](), s; while (!(s = it.next()).done) out.push(s.value); }
    return fn ? out.map(fn) : out;
  });
  def(Array, "of", function () { return Array.prototype.slice.call(arguments); });
  def(Array.prototype, "includes", function (x) { return this.indexOf(x) >= 0; });
  def(Array.prototype, "find", function (f, t) { for (var i = 0; i < this.length; i++) if (f.call(t, this[i], i, this)) return this[i]; });
  def(Array.prototype, "findIndex", function (f, t) { for (var i = 0; i < this.length; i++) if (f.call(t, this[i], i, this)) return i; return -1; });
  def(Array.prototype, "fill", function (v, s, e) { var n = this.length; s = s || 0; e = e === undefined ? n : e; for (var i = s < 0 ? n + s : s; i < (e < 0 ? n + e : e); i++) this[i] = v; return this; });
  def(String.prototype, "includes", function (x, p) { return this.indexOf(x, p || 0) >= 0; });
  def(String.prototype, "startsWith", function (x, p) { p = p || 0; return this.substr(p, x.length) === x; });
  def(String.prototype, "endsWith", function (x) { return this.slice(-x.length) === x; });
  def(String.prototype, "repeat", function (n) { var o = ""; for (var i = 0; i < n; i++) o += this; return o; });
  def(String.prototype, "padStart", function (n, c) { var s = String(this); c = c || " "; while (s.length < n) s = c + s; return s.slice(-n); });
  def(String.prototype, "trimStart", function () { return this.replace(/^\s+/, ""); });
  def(String.prototype, "trimEnd", function () { return this.replace(/\s+$/, ""); });
  def(Number, "isFinite", function (x) { return typeof x === "number" && isFinite(x); });
  def(Number, "isInteger", function (x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; });
  def(Math, "trunc", function (x) { return x < 0 ? Math.ceil(x) : Math.floor(x); });
  def(Math, "sign", function (x) { return x > 0 ? 1 : x < 0 ? -1 : +x; });

  // DOM
  if (W.NodeList) def(NodeList.prototype, "forEach", Array.prototype.forEach);
  if (W.HTMLCollection) def(HTMLCollection.prototype, "forEach", Array.prototype.forEach);
  if (W.Element) {
    def(Element.prototype, "matches", Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector);
    def(Element.prototype, "closest", function (s) { var el = this; while (el && el.nodeType === 1) { if (el.matches(s)) return el; el = el.parentNode; } return null; });
    def(Element.prototype, "remove", function () { if (this.parentNode) this.parentNode.removeChild(this); });
  }
  def(W, "requestAnimationFrame", function (f) { return setTimeout(function () { f(Date.now()); }, 16); });
  def(W, "cancelAnimationFrame", function (id) { clearTimeout(id); });

  // Promise (very old WebKit TVs)
  if (typeof W.Promise !== "function") {
    var P = function (ex) {
      var self = this, st = 0, val, cbs = [];
      function fin(s, v) { if (st) return; st = s; val = v; setTimeout(function () { cbs.forEach(run); cbs = null; }, 0); }
      function res(v) { if (v && typeof v.then === "function") { try { v.then(res, function (e) { fin(2, e); }); } catch (e) { fin(2, e); } } else fin(1, v); }
      function run(c) { var f = st === 1 ? c.ok : c.ko; if (!f) { (st === 1 ? c.res : c.rej)(val); return; } try { c.res(f(val)); } catch (e) { c.rej(e); } }
      self.then = function (ok, ko) { return new P(function (r, j) { var c = { ok: ok, ko: ko, res: r, rej: j }; if (cbs) cbs.push(c); else setTimeout(function () { run(c); }, 0); }); };
      self["catch"] = function (ko) { return self.then(null, ko); };
      try { ex(res, function (e) { fin(2, e); }); } catch (e) { fin(2, e); }
    };
    P.resolve = function (v) { return new P(function (r) { r(v); }); };
    P.reject = function (e) { return new P(function (r, j) { j(e); }); };
    P.all = function (a) { return new P(function (r, j) { var out = [], n = a.length; if (!n) r(out); a.forEach(function (p, i) { P.resolve(p).then(function (v) { out[i] = v; if (--n === 0) r(out); }, j); }); }); };
    P.race = function (a) { return new P(function (r, j) { a.forEach(function (p) { P.resolve(p).then(r, j); }); }); };
    W.Promise = P;
  }

  // URLSearchParams (only .get / .has are used)
  if (typeof W.URLSearchParams !== "function") {
    W.URLSearchParams = function (q) {
      var map = {};
      String(q || "").replace(/^\?/, "").split("&").forEach(function (kv) {
        if (!kv) return; var i = kv.indexOf("="), k = decodeURIComponent((i < 0 ? kv : kv.slice(0, i)).replace(/\+/g, " "));
        if (!(k in map)) map[k] = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
      });
      this.get = function (k) { return k in map ? map[k] : null; };
      this.has = function (k) { return k in map; };
    };
  }

  // fetch (GET + json/text only)
  if (typeof W.fetch !== "function") {
    W.fetch = function (url, opt) {
      return new Promise(function (res, rej) {
        var x = new XMLHttpRequest(); x.open((opt && opt.method) || "GET", url, true);
        x.onload = function () { var body = x.responseText; res({ ok: x.status >= 200 && x.status < 300, status: x.status, text: function () { return Promise.resolve(body); }, json: function () { return Promise.resolve(JSON.parse(body)); } }); };
        x.onerror = function () { rej(new TypeError("Network error")); };
        x.send((opt && opt.body) || null);
      });
    };
  }

  // crypto.getRandomValues
  if (!W.crypto) W.crypto = W.msCrypto || {};
  if (!W.crypto.getRandomValues) W.crypto.getRandomValues = function (a) { for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 4294967296) % (a.BYTES_PER_ELEMENT === 1 ? 256 : 4294967296); return a; };

  // UTF-8 encode + SHA-256 in plain JS, used when crypto.subtle is missing (old TVs, plain http)
  W.__utf8 = function (s) {
    if (typeof TextEncoder === "function") return new TextEncoder().encode(s);
    var b = unescape(encodeURIComponent(s)), out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  };
  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  W.__sha256hex = function (bytes) {
    var l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n), w = new Array(64), i, j;
    m.set(bytes); m[l] = 0x80;
    var bits = l * 8; m[n - 4] = (bits >>> 24) & 255; m[n - 3] = (bits >>> 16) & 255; m[n - 2] = (bits >>> 8) & 255; m[n - 1] = bits & 255;
    m[n - 5] = Math.floor(l / 536870912) & 255;
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    function r(x, k) { return (x >>> k) | (x << (32 - k)); }
    for (i = 0; i < n; i += 64) {
      for (j = 0; j < 16; j++) w[j] = (m[i + j * 4] << 24) | (m[i + j * 4 + 1] << 16) | (m[i + j * 4 + 2] << 8) | m[i + j * 4 + 3];
      for (j = 16; j < 64; j++) {
        var s0 = r(w[j - 15], 7) ^ r(w[j - 15], 18) ^ (w[j - 15] >>> 3), s1 = r(w[j - 2], 17) ^ r(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (j = 0; j < 64; j++) {
        var t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    return h.map(function (x) { return ("0000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  };
})();
