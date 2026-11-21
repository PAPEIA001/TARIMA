/* PARTIENDO LA TARIMA · Spotify for the music mode (needs the host's Spotify Premium).
   Login with PKCE in the TV's own browser (no secret), tokens kept only in that browser.
   Plays in the TV itself with the Web Playback SDK when the browser supports it, otherwise
   on any Spotify Connect device (phone, speaker, computer, the Spotify app of a TV...). ES5 only. */
(function (T) {
  "use strict";
  var API = "https://api.spotify.com/v1", ACC = "https://accounts.spotify.com";
  var SCOPES = "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing";
  var KEY = "sp.tok", PK = "sp.pkce";
  function redirectUri() { return T.siteBase() + "spotify.html"; }
  function clientId(cfg) { return (cfg && cfg.spClient) || T.SPOTIFY_CLIENT || ""; }
  function b64url(bytes) {
    var s = ""; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function hexBytes(h) { var out = new Uint8Array(h.length / 2); for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16); return out; }
  function form(o) { return Object.keys(o).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(o[k]); }).join("&"); }
  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error_description || j.error || ("HTTP " + r.status)); return j; }); });
  }
  function save(j, client) {
    var old = T.store(KEY) || {};
    var t = { access: j.access_token, refresh: j.refresh_token || old.refresh, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, client: client };
    T.store(KEY, t); return t;
  }

  var SP = {
    // Step 1 (on the TV): go to Spotify's login page. back = page to return to afterwards.
    login: function (cfg, back) {
      var client = clientId(cfg); if (!client) return false;
      var verifier = T.rand(64, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~");
      var state = T.rand(16);
      T.store(PK, { v: verifier, state: state, back: back || location.href, client: client });
      var challenge = b64url(hexBytes(window.__sha256hex(window.__utf8(verifier))));
      location.href = ACC + "/authorize?" + form({ response_type: "code", client_id: client, scope: SCOPES, redirect_uri: redirectUri(),
        code_challenge_method: "S256", code_challenge: challenge, state: state, show_dialog: "true" });
      return true;
    },
    // Step 2 (spotify.html): swap the code for tokens and go back.
    finish: function (params) {
      var pk = T.store(PK);
      if (!pk) return Promise.reject(new Error("Empieza la conexión desde la pantalla de la tele."));
      if (params.get("error")) return Promise.reject(new Error(params.get("error") === "access_denied" ? "Has cancelado la conexión." : params.get("error")));
      if (params.get("state") !== pk.state) return Promise.reject(new Error("La respuesta de Spotify no coincide. Vuelve a intentarlo."));
      return post(ACC + "/api/token", { grant_type: "authorization_code", code: params.get("code"), redirect_uri: redirectUri(), client_id: pk.client, code_verifier: pk.v })
        .then(function (j) { save(j, pk.client); T.store(PK, null); return pk.back; });
    },
    connected: function () { var t = T.store(KEY); return !!(t && t.refresh); },
    logout: function () { T.store(KEY, null); SP.me = null; },
    token: function () {
      var t = T.store(KEY);
      if (!t || !t.refresh) return Promise.reject(new Error("nologin"));
      if (t.access && Date.now() < t.exp) return Promise.resolve(t.access);
      return post(ACC + "/api/token", { grant_type: "refresh_token", refresh_token: t.refresh, client_id: t.client })
        .then(function (j) { return save(j, t.client).access; });
    },
    api: function (method, path, body, retried) {
      return SP.token().then(function (tok) {
        var o = { method: method, headers: { Authorization: "Bearer " + tok } };
        if (body !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body); }
        return fetch(API + path, o).then(function (r) {
          if (r.status === 401 && !retried) { var t = T.store(KEY); if (t) { t.exp = 0; T.store(KEY, t); } return SP.api(method, path, body, true); }
          if (r.status === 204 || r.status === 202) return null;
          return r.text().then(function (txt) {
            var j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
            if (!r.ok) { var e2 = new Error((j && j.error && (j.error.message || j.error)) || ("HTTP " + r.status)); e2.status = r.status; e2.reason = j && j.error && j.error.reason; throw e2; }
            return j;
          });
        });
      });
    },
    profile: function () { return SP.api("GET", "/me").then(function (m) { SP.me = m; return m; }); },
    // up to 10 results per page in development mode: ask for 2 pages
    search: function (q) {
      var one = function (off) { return SP.api("GET", "/search?" + form({ q: q, type: "track", limit: 10, offset: off, market: "from_token" })); };
      return Promise.all([one(0), one(10).catch(function () { return null; })]).then(function (rs) {
        var seen = {}, out = [];
        rs.forEach(function (r) { ((r && r.tracks && r.tracks.items) || []).forEach(function (x) {
          if (!x || seen[x.uri]) return; seen[x.uri] = 1;
          var imgs = (x.album && x.album.images) || [];
          out.push({ uri: x.uri, t: x.name, a: (x.artists || []).map(function (a) { return a.name; }).join(", "), img: imgs.length ? imgs[imgs.length > 1 ? 1 : 0].url : "", big: imgs.length ? imgs[0].url : "", dur: Math.round((x.duration_ms || 0) / 1000), ex: !!x.explicit });
        }); });
        return out;
      });
    },
    devices: function () { return SP.api("GET", "/me/player/devices").then(function (r) { return ((r && r.devices) || []).map(function (d) { return { id: d.id, name: d.name, type: d.type, active: d.is_active, restricted: d.is_restricted }; }); }); },
    play: function (uri, device) { return SP.api("PUT", "/me/player/play" + (device ? "?device_id=" + encodeURIComponent(device) : ""), { uris: [uri] }); },
    pause: function (device) { return SP.api("PUT", "/me/player/pause" + (device ? "?device_id=" + encodeURIComponent(device) : "")).catch(function () {}); },
    resume: function (device) { return SP.api("PUT", "/me/player/play" + (device ? "?device_id=" + encodeURIComponent(device) : "")).catch(function () {}); },
    volume: function (pct, device) { return SP.api("PUT", "/me/player/volume?" + form({ volume_percent: Math.round(pct), device_id: device || "" })).catch(function () {}); },
    state: function () { return SP.api("GET", "/me/player"); },
    // Web Playback SDK: the TV page itself becomes a Spotify speaker (desktop browsers; many TV browsers can't).
    sdk: function (name) {
      return new Promise(function (res, rej) {
        if (!window.MediaKeys && !navigator.requestMediaKeySystemAccess) { rej(new Error("noeme")); return; }
        var done = false, to = setTimeout(function () { if (!done) { done = true; rej(new Error("sdk-timeout")); } }, 15000);
        window.onSpotifyWebPlaybackSDKReady = function () {
          var p = new window.Spotify.Player({ name: name || "PARTIENDO LA TARIMA", volume: 0.9, getOAuthToken: function (cb) { SP.token().then(cb, function () {}); } });
          p.addListener("ready", function (e) { if (done) return; done = true; clearTimeout(to); SP.player = p; res(e.device_id); });
          ["initialization_error", "authentication_error", "account_error"].forEach(function (ev) { p.addListener(ev, function (e) { if (done) return; done = true; clearTimeout(to); rej(new Error(ev + ": " + (e && e.message))); }); });
          p.connect();
        };
        var s = document.createElement("script"); s.src = "https://sdk.scdn.co/spotify-player.js"; s.onerror = function () { if (!done) { done = true; clearTimeout(to); rej(new Error("sdk-load")); } };
        document.head.appendChild(s);
      });
    },
    activate: function () { try { if (SP.player && SP.player.activateElement) SP.player.activateElement(); } catch (e) {} }
  };
  T.spotify = SP;
})(window.T);
