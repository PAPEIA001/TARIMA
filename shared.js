/* Tarima beta: shared code for the guest app (index.html) and the TV screen (tv.html).
   Real-time sync goes through public MQTT brokers over secure WebSockets.
   Each party lives under its own topic: tarima/v1/<CODE>/... ; the TV is the source of truth. */
var T = (function () {
  "use strict";

  var BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  // Starter catalog. Each song has several karaoke videos: if one cannot be embedded, the TV tries the next.
  var CATALOG = [
    { id: "s01", t: "Bohemian Rhapsody", a: "Queen", g: "Clásicos", ids: ["9Lxm0iSnKNc", "jfo_N0vtR44", "8lBAF3cPtNE"] },
    { id: "s02", t: "I Will Survive", a: "Gloria Gaynor", g: "Clásicos", ids: ["FsUa8P-L2Ag", "tClP0J3fpWA", "8eqKukh4zto"] },
    { id: "s03", t: "Dancing Queen", a: "ABBA", g: "Clásicos", ids: ["WHayJZ3eMcE", "ir14kJwqaus", "Tiaby1lXiVU"] },
    { id: "s04", t: "Livin' on a Prayer", a: "Bon Jovi", g: "Clásicos", ids: ["b1Zay0OWjX0", "SGW5UlsgKI0", "9xupUJCpVm0"] },
    { id: "s05", t: "Sweet Caroline", a: "Neil Diamond", g: "Clásicos", ids: ["CgVhqLL1duA", "srLoAl1mhFw", "BosJ0oQr99Q"] },
    { id: "s06", t: "Corazón partío", a: "Alejandro Sanz", g: "Española", ids: ["-mxyGh0zsfQ", "q2FRTAMvdjQ", "LYiI-QCFIoQ"] },
    { id: "s07", t: "Resistiré", a: "Dúo Dinámico", g: "Española", ids: ["P9F-YhEJd9s", "w_fNa783Smo", "EXGyhA7TPVo"] },
    { id: "s08", t: "Mi gran noche", a: "Raphael", g: "Española", ids: ["GVavte6hPek", "sIH-BX56mcY", "UNC1OOAkN8E"] },
    { id: "s09", t: "La flaca", a: "Jarabe de Palo", g: "Española", ids: ["j4oQdoL8mQc", "wRjPQs8reAE", "7n5fuy7rDc0"] },
    { id: "s10", t: "Rosas", a: "La Oreja de Van Gogh", g: "Española", ids: ["456YNhABfhI", "zkCWrx_ljbg", "TAOSwVD2_4o"] },
    { id: "s11", t: "Me cuesta tanto olvidarte", a: "Mecano", g: "Española", ids: ["gfe_hoWNlPA", "dKuu-KbPtiM", "ywyPuGcpwGU"] },
    { id: "s12", t: "Despacito", a: "Luis Fonsi", g: "Latino", ids: ["eATbjCqbYWk", "PzswTRUi-Ro", "FEPsFwAj0IQ"] },
    { id: "s13", t: "La bicicleta", a: "Carlos Vives y Shakira", g: "Latino", ids: ["VMYdnjOOYRU", "-0s1R0XNK88", "-uY1O0lx5L0"] },
    { id: "s14", t: "Gasolina", a: "Daddy Yankee", g: "Latino", ids: ["Rvq8D-GZ0Ig", "8B-3OqgP2Uo", "bifSaBwqt3A"] },
    { id: "s15", t: "Vivir mi vida", a: "Marc Anthony", g: "Latino", ids: ["km8GFyQW-rw", "CqDTuKVgaoU", "EbLw6qlgWgE"] },
    { id: "s16", t: "Tusa", a: "Karol G y Nicki Minaj", g: "Latino", ids: ["--mHajGPFCY", "YjHhbLWMR1M", "t3Vks_dpI-w"] },
    { id: "s17", t: "Hasta que me olvides", a: "Luis Miguel", g: "Baladas", ids: ["WlFZEXjEn-8", "5zHd7AzckK4", "YTdh1u71upk"] }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rand(n, alphabet) {
    alphabet = alphabet || "abcdefghijklmnopqrstuvwxyz0123456789";
    var out = "", buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    for (var i = 0; i < n; i++) out += alphabet[buf[i] % alphabet.length];
    return out;
  }

  function hash(str) {
    var data = new TextEncoder().encode("tarima:" + str);
    return crypto.subtle.digest("SHA-256", data).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    });
  }

  // Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, music.youtube.com, or a bare 11-char id.
  function ytId(text) {
    if (!text) return null;
    text = String(text).trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
    var m = text.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function playlistId(text) {
    if (!text) return null;
    var m = String(text).match(/[?&]list=([A-Za-z0-9_-]{10,})/);
    if (m) return m[1];
    return /^(PL|OL|UU|RD)[A-Za-z0-9_-]{10,}$/.test(String(text).trim()) ? String(text).trim() : null;
  }

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function initials(t) {
    return String(t || "?").split(/\s+/).filter(function (w) { return /^[A-Za-zÀ-ÿ0-9]/.test(w); })
      .slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase() || "♪";
  }

  function hue(s) {
    var h = 0; s = String(s || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  function art(title, px) {
    var h = hue(title);
    return '<div class="art" style="width:' + px + "px;height:" + px + "px;font-size:" + Math.round(px * 0.34) +
      "px;background:linear-gradient(135deg,hsl(" + h + " 80% 55%),hsl(" + ((h + 50) % 360) + ' 70% 30%))">' + esc(initials(title)) + "</div>";
  }

  function avatar(name, px) {
    px = px || 22;
    return '<span class="av" style="width:' + px + "px;height:" + px + "px;font-size:" + Math.round(px * 0.45) +
      "px;background:hsl(" + hue(name) + ' 60% 45%)">' + esc(String(name || "?").charAt(0).toUpperCase()) + "</span>";
  }

  function store(key, val) {
    try {
      if (val === undefined) { var v = localStorage.getItem("tarima." + key); return v ? JSON.parse(v) : null; }
      if (val === null) localStorage.removeItem("tarima." + key);
      else localStorage.setItem("tarima." + key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* Connect to every broker at once; publish to all, and drop duplicates on receive.
     subs: topics to subscribe. onMessage(topic, obj). onStatus(connectedCount). */
  function connect(subs, onMessage, onStatus) {
    var clients = [], seen = {}, seenList = [];
    function count() { return clients.filter(function (c) { return c.connected; }).length; }
    if (typeof mqtt === "undefined") { if (onStatus) onStatus(0, "nolib"); return { publish: function () {}, count: count }; }
    BROKERS.forEach(function (url) {
      var c;
      try {
        c = mqtt.connect(url, { clientId: "tarima_" + rand(12), reconnectPeriod: 3000, connectTimeout: 10000, clean: true, keepalive: 30 });
      } catch (e) { return; }
      c.on("connect", function () {
        subs.forEach(function (s) { c.subscribe(s, { qos: 1 }); });
        if (onStatus) onStatus(count());
      });
      c.on("close", function () { if (onStatus) onStatus(count()); });
      c.on("error", function () {});
      c.on("message", function (topic, buf) {
        var m;
        try { m = JSON.parse(buf.toString()); } catch (e) { return; }
        if (m && m.mid) {
          var key = topic + "|" + m.mid;
          if (seen[key]) return;
          seen[key] = 1; seenList.push(key);
          if (seenList.length > 400) delete seen[seenList.shift()];
        }
        onMessage(topic, m);
      });
      clients.push(c);
    });
    return {
      count: count,
      publish: function (topic, obj, retain) {
        var o = Object.assign({}, obj, { mid: rand(10) });
        var s = JSON.stringify(o);
        clients.forEach(function (c) { if (c.connected) c.publish(topic, s, { qos: 1, retain: !!retain }); });
      },
      clear: function (topic) { clients.forEach(function (c) { if (c.connected) c.publish(topic, "", { qos: 1, retain: true }); }); },
      subscribe: function (topic) { clients.forEach(function (c) { if (c.connected) c.subscribe(topic, { qos: 1 }); }); subs.push(topic); }
    };
  }

  function topics(code) {
    var base = "tarima/v1/" + String(code).toUpperCase();
    return { base: base, state: base + "/state", cmd: base + "/cmd", config: base + "/config", res: function (cid) { return base + "/res/" + cid; } };
  }

  function adminTopic(h) { return "tarima/v1/admin/" + h; }

  var COLORS = { rosa: "#ff3d7f", naranja: "#ff8a3d", amarillo: "#ffc93d", verde: "#3ddc97", azul: "#3db8ff", lila: "#a46bff" };

  // Applies a party's accent colour to the page.
  function applyColor(name) {
    var c = COLORS[name] || COLORS.rosa;
    document.documentElement.style.setProperty("--accent", c);
  }

  function mmss(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }

  function siteBase() {
    return location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  }

  return { BROKERS: BROKERS, CATALOG: CATALOG, esc: esc, rand: rand, hash: hash, ytId: ytId, playlistId: playlistId, norm: norm,
    initials: initials, adminTopic: adminTopic, COLORS: COLORS, applyColor: applyColor, hue: hue, art: art, avatar: avatar, store: store, connect: connect, topics: topics, mmss: mmss, siteBase: siteBase };
})();
