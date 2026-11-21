/* Tarima · show sounds made with the Web Audio API (no files, no cost).
   T.sfx.unlock() must run inside a click (the TV's Start button) before anything sounds. */
(function (T) {
  "use strict";
  var ac = null, master = null, noiseBuf = null, loop = null, on = true;
  function ctx() {
    if (ac) return ac;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0.7;
    var comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  function ready() { var c = ctx(); if (!c || !on) return null; if (c.state === "suspended") c.resume(); return c; }
  function tone(type, f, t0, dur, vol, dest, slideTo) {
    var c = ac, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05); return o;
  }
  function noise(t0, dur, vol, type, freq, q, dest) {
    var c = ac, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = type || "bandpass"; f.frequency.value = freq || 1500; f.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  var N = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  var S = {
    unlock: function () { var c = ctx(); if (c && c.state === "suspended") c.resume(); },
    set: function (v) { on = v !== false; if (!on) S.stopLoop(); },
    // TV-show opener: brass-like stab, rising arpeggio and a cymbal
    jingle: function () {
      var c = ready(); if (!c) return; var t = c.currentTime + 0.05;
      [60, 64, 67, 72, 76, 79].forEach(function (m, i) { tone("sawtooth", N(m), t + i * 0.09, 0.25, 0.12); tone("square", N(m + 12), t + i * 0.09, 0.18, 0.04); });
      [72, 76, 79, 84].forEach(function (m) { tone("sawtooth", N(m), t + 0.62, 0.9, 0.1); });
      noise(t + 0.62, 1.2, 0.25, "highpass", 6000, 0.5);
      noise(t + 0.62, 0.15, 0.5, "lowpass", 200, 1);
    },
    // snare roll that grows, ends with a crash
    drumroll: function (secs) {
      var c = ready(); if (!c) return; var t = c.currentTime + 0.02, n = Math.floor((secs || 2) * 22);
      for (var i = 0; i < n; i++) noise(t + i / 22, 0.06, 0.08 + 0.35 * i / n, "bandpass", 2500, 0.8);
      noise(t + n / 22, 1.4, 0.45, "highpass", 5000, 0.4); noise(t + n / 22, 0.2, 0.6, "lowpass", 150, 1);
    },
    // crowd applause: many small claps with random timing
    applause: function (secs, big) {
      var c = ready(); if (!c) return; var t = c.currentTime + 0.02, len = secs || 3, n = Math.floor(len * (big ? 140 : 70));
      for (var i = 0; i < n; i++) {
        var at = t + Math.random() * len, fade = 1 - Math.max(0, (at - t) - len * 0.6) / (len * 0.4);
        noise(at, 0.03 + Math.random() * 0.04, (0.05 + Math.random() * 0.1) * fade, "bandpass", 900 + Math.random() * 1800, 1.2);
      }
      if (big) for (var k = 0; k < 6; k++) tone("sine", 1800 + Math.random() * 900, t + 0.3 + Math.random() * len * 0.6, 0.35, 0.03, null, 2600 + Math.random() * 600);   // whistles
    },
    clap: function () { var c = ready(); if (!c) return; var t = c.currentTime; for (var i = 0; i < 8; i++) noise(t + Math.random() * 0.4, 0.04, 0.12, "bandpass", 1200 + Math.random() * 1200, 1.2); },
    airhorn: function () {
      var c = ready(); if (!c) return; var t = c.currentTime + 0.02;
      [[0, 0.18], [0.24, 0.18], [0.48, 0.7]].forEach(function (p) { [0, 4, 7].forEach(function (d) { tone("sawtooth", 466 + d, t + p[0], p[1], 0.09); tone("sawtooth", 233 + d / 2, t + p[0], p[1], 0.06); }); });
    },
    // "wah wah wah wahhh"
    trombone: function () {
      var c = ready(); if (!c) return; var t = c.currentTime + 0.02, lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.connect(master);
      [[62, 0.4], [61, 0.4], [60, 0.4], [59, 1.3]].forEach(function (p, i) {
        var at = t + i * 0.45, o = tone("sawtooth", N(p[0]), at, p[1], 0.2, lp);
        if (i === 3) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6; lg.gain.value = 6; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + p[1]); }
      });
    },
    ding: function () { var c = ready(); if (!c) return; var t = c.currentTime; tone("sine", N(84), t, 0.6, 0.25); tone("sine", N(91), t + 0.12, 0.8, 0.2); },
    buzz: function () { var c = ready(); if (!c) return; tone("square", 110, c.currentTime, 0.5, 0.12); },
    tick: function (hi) { var c = ready(); if (!c) return; tone("square", hi ? 1400 : 1000, c.currentTime, 0.06, 0.08); },
    whoosh: function () { var c = ready(); if (!c) return; var t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = noiseBuf; f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.7); },
    fanfare: function () { var c = ready(); if (!c) return; var t = c.currentTime + 0.05;
      [[67, 0, 0.15], [67, 0.16, 0.15], [67, 0.32, 0.15], [72, 0.5, 0.9]].forEach(function (p) { tone("sawtooth", N(p[0]), t + p[1], p[2], 0.14); tone("sawtooth", N(p[0] - 12), t + p[1], p[2], 0.08); tone("square", N(p[0] + 4), t + p[1], p[2], 0.04); }); },
    // soft lounge loop for the waiting room (quiz), only when there is no background playlist
    startLoop: function () {
      var c = ready(); if (!c || loop) return;
      var bus = c.createGain(); bus.gain.value = 0.0001; bus.connect(master); bus.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 1);
      var chords = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]], beat = 60 / 104, step = 0, next = c.currentTime + 0.1;
      loop = { bus: bus, timer: setInterval(function () {
        while (next < c.currentTime + 0.3) {
          var bar = Math.floor(step / 8) % 4, ch = chords[bar], s8 = step % 8;
          if (s8 === 0) ch.forEach(function (m) { tone("triangle", N(m), next, beat * 3.8, 0.035, bus); });
          if (s8 % 4 === 0) tone("sine", N(ch[0] - 24), next, beat * 0.9, 0.18, bus);
          if (s8 % 4 === 3) tone("sine", N(ch[2] - 24), next, beat * 0.4, 0.1, bus);
          noise(next, 0.04, s8 % 2 ? 0.03 : 0.05, "highpass", 8000, 0.5, bus);
          if (s8 === 2 || s8 === 6) noise(next, 0.12, 0.09, "bandpass", 1800, 0.7, bus);
          if (s8 === 0 || s8 === 5) noise(next, 0.18, 0.25, "lowpass", 120, 1, bus);
          next += beat / 2; step++;
        }
      }, 100) };
    },
    stopLoop: function () {
      if (!loop) return; var l = loop; loop = null; clearInterval(l.timer);
      try { l.bus.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.8); setTimeout(function () { l.bus.disconnect(); }, 1000); } catch (e) {}
    }
  };
  S.NAMES = { applause: "👏 Aplausos", airhorn: "📯 Bocina", drumroll: "🥁 Redoble", trombone: "😂 Trombón triste", jingle: "✨ Sintonía", fanfare: "🎺 Fanfarria", ding: "🔔 Ding", whoosh: "💨 Whoosh" };
  T.sfx = S;
})(window.T);
