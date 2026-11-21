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
    return { base: base, state: base + "/state", cmd: base + "/cmd", config: base + "/config", catalog: base + "/catalog", say: base + "/say",
      av: function (cid) { return base + "/av/" + cid; }, avAll: base + "/av/+", res: function (cid) { return base + "/res/" + cid; } };
  }

  // Party passwords ignore case and spaces at the ends, so phone keyboards can't break them.
  function pw(s) { return String(s == null ? "" : s).trim().toLowerCase(); }

  /* ---------- YouTube catalog and search (needs a YouTube Data API key) ---------- */
  // Trusted karaoke channels. "id" when known; otherwise resolved once from "handle" or "q".
  var CHANNELS = [
    { name: "Sing King", id: "UCwTRjvjVge51X-ILJ4i22ew", handle: "@singkingkaraoke" },
    { name: "KaraFun", handle: "@karafun", q: "KaraFun Karaoke" },
    { name: "Stingray Karaoke", handle: "@StingrayKaraoke", q: "Stingray Karaoke" },
    { name: "KaraokeMedia (español)", id: "UCmV_ZCnAAj5DbkUqpBC_CDg", q: "KaraokeMedia karaoke español" }
  ];
  var YT = "https://www.googleapis.com/youtube/v3/";
  function ytGet(path, params, key) {
    var qs = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(YT + path + "?" + qs + "&key=" + encodeURIComponent(key)).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) { var e = new Error((j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || j.error.message || "youtube"); e.yt = j.error; throw e; }
      return j;
    });
  }
  function decodeHtml(s) { var t = document.createElement("textarea"); t.innerHTML = s; return t.value; }
  // "Queen - Bohemian Rhapsody (Karaoke Version)" -> "Queen - Bohemian Rhapsody"
  function cleanTitle(t) {
    t = decodeHtml(String(t || ""));
    t = t.replace(/[\(\[\{][^\)\]\}]*(karaok|version|versión|lyric|letra|instrumental|official|oficial|hd|4k)[^\)\]\}]*[\)\]\}]/gi, "");
    t = t.split("|")[0];
    t = t.replace(/\bkaraok[eê]\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s*[-–:]\s*$/, "").trim();
    return t || "Vídeo de YouTube";
  }
  function isoSecs(d) { var m = String(d || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; }
  function resolveChannel(c, key) {
    if (c.id) return Promise.resolve(c.id);
    var byHandle = c.handle ? ytGet("channels", { part: "id", forHandle: c.handle }, key).then(function (j) { return j.items && j.items[0] && j.items[0].id; }) : Promise.resolve(null);
    return byHandle.catch(function () { return null; }).then(function (id) {
      if (id || !c.q) return id;
      return ytGet("search", { part: "snippet", type: "channel", maxResults: 1, q: c.q }, key).then(function (j) { return j.items && j.items[0] && j.items[0].id.channelId; });
    });
  }
  // Latest uploads of each trusted channel (about 1 quota unit per 50 videos).
  function syncCatalog(key, channels, perChannel) {
    perChannel = perChannel || 150;
    var out = [], resolved = [];
    return channels.reduce(function (p, c) {
      return p.then(function () {
        return resolveChannel(c, key).then(function (id) {
          if (!id) return;
          resolved.push({ name: c.name, id: id, handle: c.handle || "", q: c.q || "" });
          var pl = "UU" + id.slice(2), got = 0;
          var page = function (tok) {
            var prm = { part: "snippet", playlistId: pl, maxResults: 50 }; if (tok) prm.pageToken = tok;
            return ytGet("playlistItems", prm, key).then(function (j) {
              (j.items || []).forEach(function (it) {
                var sn = it.snippet, vid = sn.resourceId && sn.resourceId.videoId;
                if (!vid || /private|deleted/i.test(sn.title)) return;
                if (!/karaok/i.test(sn.title)) return;
                out.push({ vid: vid, t: cleanTitle(sn.title), ch: c.name, best: true });
              });
              got += 50;
              if (j.nextPageToken && got < perChannel) return page(j.nextPageToken);
            });
          };
          return page();
        }).catch(function () {});
      });
    }, Promise.resolve()).then(function () { return { items: out, channels: resolved, at: Date.now() }; });
  }
  /* Search all of YouTube. mode "karaoke": title must say karaoke, 2-8 min. mode "music": 1.5-10 min, music category.
     Trusted channels and the most viewed come first; versions marked with ads go last. */
  function searchYT(q, key, mode, trustedIds, adSet) {
    var karaoke = mode !== "music";
    var prm = { part: "snippet", type: "video", videoEmbeddable: "true", maxResults: 25, q: karaoke ? q + " karaoke" : q };
    if (!karaoke) prm.videoCategoryId = "10";
    return ytGet("search", prm, key).then(function (j) {
      var ids = (j.items || []).map(function (it) { return it.id && it.id.videoId; }).filter(Boolean);
      if (!ids.length) return [];
      return ytGet("videos", { part: "snippet,contentDetails,statistics,status", id: ids.join(",") }, key).then(function (v) {
        var min = karaoke ? 120 : 90, max = karaoke ? 480 : 600;
        return (v.items || []).filter(function (it) {
          var d = isoSecs(it.contentDetails.duration);
          if (it.status && it.status.embeddable === false) return false;
          if (d < min || d > max) return false;
          if (karaoke && !/karaok/i.test(it.snippet.title)) return false;
          return true;
        }).map(function (it) {
          var best = karaoke && trustedIds.indexOf(it.snippet.channelId) >= 0;
          return { vid: it.id, t: karaoke ? cleanTitle(it.snippet.title) : decodeHtml(it.snippet.title), ch: decodeHtml(it.snippet.channelTitle), best: best,
            ads: !!(adSet && adSet[it.id]), views: +(it.statistics && it.statistics.viewCount) || 0, dur: isoSecs(it.contentDetails.duration) };
        }).sort(function (a, b) { return (a.ads - b.ads) || (b.best - a.best) || (b.views - a.views); }).slice(0, 15);
      });
    });
  }

  /* ---------- guest tastes ---------- */
  var TASTES = [
    { k: "espanol", label: "Pop español", genres: ["Española"] },
    { k: "latino", label: "Latino y reggaetón", genres: ["Latino"] },
    { k: "clasicos", label: "Clásicos 70-80-90", genres: ["Clásicos"] },
    { k: "baladas", label: "Baladas", genres: ["Baladas"] },
    { k: "rock", label: "Rock", genres: ["Clásicos", "Española"] },
    { k: "pop", label: "Pop internacional", genres: ["Clásicos"] },
    { k: "urbano", label: "Rap y urbano", genres: ["Latino"] }
  ];
  function artistsOf(g) { return String((g && g.artists) || "").split(/[,;\n]+/).map(function (a) { return norm(a).trim(); }).filter(function (a) { return a.length > 1; }); }
  // How well a song fits a guest: favourite artist 3, favourite style 2, nothing 0.
  function fit(song, g) {
    var title = norm((song.t || "") + " " + (song.a || ""));
    if (artistsOf(g).some(function (a) { return title.indexOf(a) >= 0; })) return 3;
    var genres = [];
    TASTES.forEach(function (t) { if ((g.tastes || []).indexOf(t.k) >= 0) genres = genres.concat(t.genres); });
    if (song.g && genres.indexOf(song.g) >= 0) return 2;
    // channel catalog songs carry no genre: match the base catalog's artists of those styles
    if (!song.g && genres.length && CATALOG.some(function (b) { return genres.indexOf(b.g) >= 0 && title.indexOf(norm(b.a.split(" y ")[0])) >= 0; })) return 2;
    return 0;
  }

  /* ---------- festive selfie: crop, then draw a hat, glasses and confetti on top ---------- */
  function festive(file, accent) {
    accent = accent || "#ff3d7f";
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = rej;
      fr.onload = function () {
        var img = new Image(); img.onerror = rej;
        img.onload = function () {
          var S = 320, cv = document.createElement("canvas"); cv.width = cv.height = S;
          var g = cv.getContext("2d");
          var side = Math.min(img.width, img.height), sx = (img.width - side) / 2, sy = (img.height - side) / 2;
          // leave head-room for the hat: crop a bit lower on portraits
          if (img.height > img.width) sy = Math.max(0, (img.height - side) * 0.35);
          g.drawImage(img, sx, sy, side, side, 0, 0, S, S);
          var face = { x: S * 0.29, y: S * 0.3, w: S * 0.42, h: S * 0.5 };
          var done = function () { decorate(g, S, face, accent); res(cv.toDataURL("image/jpeg", 0.72)); };
          if (window.FaceDetector) {
            try {
              new FaceDetector({ maxDetectedFaces: 1, fastMode: true }).detect(cv).then(function (f) {
                if (f && f[0]) { var b = f[0].boundingBox; face = { x: b.x, y: b.y, w: b.width, h: b.height }; }
                done();
              }).catch(done);
            } catch (e) { done(); }
          } else done();
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function decorate(g, S, f, accent) {
    var r = Math.random, cx = f.x + f.w / 2, top = f.y + f.h * 0.06;
    // warm party light
    var grd = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75);
    grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, accent + "88");
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    var hat = Math.floor(r() * 3);
    g.save(); g.translate(cx, top); g.rotate((r() - 0.5) * 0.35);
    var w = f.w * 1.05;
    if (hat === 0) {            // party cone
      var h = w * 1.05;
      g.beginPath(); g.moveTo(-w * 0.42, 0); g.lineTo(0, -h); g.lineTo(w * 0.42, 0); g.closePath();
      g.fillStyle = accent; g.fill();
      g.save(); g.clip(); g.strokeStyle = "#ffd23f"; g.lineWidth = w * 0.09;
      for (var i = -3; i < 6; i++) { g.beginPath(); g.moveTo(-w, -h * 0.18 * i); g.lineTo(w, -h * 0.18 * i - h * 0.35); g.stroke(); }
      g.restore();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(0, -h, w * 0.1, 0, 6.3); g.fill();
      g.fillStyle = "#ffd23f"; g.fillRect(-w * 0.46, -w * 0.05, w * 0.92, w * 0.1);
    } else if (hat === 1) {     // crown
      var ch = w * 0.5;
      g.beginPath(); g.moveTo(-w * 0.45, 0);
      [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].forEach(function (k, i) { g.lineTo(w * k, i % 2 ? -ch * 0.45 : -ch); });
      g.lineTo(w * 0.45, 0); g.closePath();
      var gold = g.createLinearGradient(0, -ch, 0, 0); gold.addColorStop(0, "#fff3a0"); gold.addColorStop(1, "#e5a400");
      g.fillStyle = gold; g.fill(); g.strokeStyle = "#a86f00"; g.lineWidth = 3; g.stroke();
      ["#ff3d7f", "#3db8ff", "#3ddc97"].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.arc(w * (i - 1) * 0.25, -ch * 0.22, w * 0.05, 0, 6.3); g.fill(); });
    } else {                    // top hat
      var th = w * 0.75;
      g.fillStyle = "#16121c"; g.fillRect(-w * 0.55, -w * 0.08, w * 1.1, w * 0.12);
      g.fillRect(-w * 0.33, -th, w * 0.66, th);
      g.fillStyle = accent; g.fillRect(-w * 0.33, -w * 0.25, w * 0.66, w * 0.12);
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(w * 0.18, -w * 0.19, w * 0.06, 0, 6.3); g.fill();
    }
    g.restore();
    if (r() < 0.6) {            // party glasses
      var ey = f.y + f.h * 0.42, gw = f.w * 0.36, gh = f.h * 0.16;
      g.save(); g.fillStyle = "rgba(20,10,30,.78)"; g.strokeStyle = r() < 0.5 ? "#ffd23f" : accent; g.lineWidth = 4;
      [-1, 1].forEach(function (k) {
        var x = cx + k * f.w * 0.22 - gw / 2;
        g.beginPath(); if (g.roundRect) g.roundRect(x, ey - gh / 2, gw, gh, gh / 2.2); else g.rect(x, ey - gh / 2, gw, gh);
        g.fill(); g.stroke();
      });
      g.beginPath(); g.moveTo(cx - f.w * 0.04, ey); g.lineTo(cx + f.w * 0.04, ey); g.stroke(); g.restore();
    }
    var cols = ["#ff3d7f", "#ffd23f", "#3db8ff", "#3ddc97", "#a46bff", "#fff"];
    for (var c = 0; c < 70; c++) {
      var x = r() * S, y = r() * S;
      if (x > f.x - 10 && x < f.x + f.w + 10 && y > f.y - 20 && y < f.y + f.h) continue;   // keep the face clear
      g.save(); g.translate(x, y); g.rotate(r() * 6.3); g.fillStyle = cols[c % cols.length]; g.fillRect(-4, -2, 8, 4); g.restore();
    }
    g.lineWidth = 10; g.strokeStyle = accent; g.strokeRect(5, 5, S - 10, S - 10);
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
    initials: initials, pw: pw, TASTES: TASTES, fit: fit, artistsOf: artistsOf, festive: festive, CHANNELS: CHANNELS, ytGet: ytGet, cleanTitle: cleanTitle, syncCatalog: syncCatalog, searchYT: searchYT, resolveChannel: resolveChannel, adminTopic: adminTopic, COLORS: COLORS, applyColor: applyColor, hue: hue, art: art, avatar: avatar, store: store, connect: connect, topics: topics, mmss: mmss, siteBase: siteBase };
})();
