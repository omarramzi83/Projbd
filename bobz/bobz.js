/* BOBZFLIX · a birthday card for Bobz */
(() => {
  'use strict';

  // Names used on the card. Change them here.
  const CONFIG = {
    from: 'Omar', // who the card is from
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* no vibration */ } };
  const restart = (el, cls) => { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };
  const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const scrollTo = (el, block = 'center') => {
    if (!el) return;
    try { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block }); } catch (e) { el.scrollIntoView(); }
  };

  $$('.from').forEach(el => { el.textContent = CONFIG.from; });

  /* ───────── Sound (synthesised; the only audio files are the two voice clips) ───────── */
  const Sound = (() => {
    let ctx = null, master = null, fx = null, noiseBuf = null;
    let muted = false;
    try { muted = localStorage.getItem('bobz-muted') === '1'; } catch (e) { /* storage blocked */ }

    function init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { return false; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.16;
      const fb = ctx.createGain(); fb.gain.value = 0.3;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
      fx = ctx.createGain(); fx.gain.value = 0.3;
      fx.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(master);
      return true;
    }
    function unlock() {
      if (!init()) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    }
    const ok = () => ctx && !muted && ctx.state === 'running';

    function tone(freq, { t = 0, dur = 0.3, vol = 0.2, type = 'sine', attack = 0.006, to = 0, echo = 0 } = {}) {
      if (!ok()) return;
      const s = ctx.currentTime + t;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, s);
      if (to) o.frequency.exponentialRampToValueAtTime(to, s + dur);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(vol, s + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g); g.connect(master);
      if (echo) { const e = ctx.createGain(); e.gain.value = echo; g.connect(e); e.connect(fx); }
      o.start(s); o.stop(s + dur + 0.05);
    }
    function noise({ t = 0, dur = 0.2, vol = 0.2, type = 'lowpass', f = 1200, to = 0, q = 0.7, attack = 0.012 } = {}) {
      if (!ok()) return;
      if (!noiseBuf) {
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const ch = noiseBuf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      }
      const s = ctx.currentTime + t;
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
      fl.frequency.setValueAtTime(f, s);
      if (to) fl.frequency.exponentialRampToValueAtTime(to, s + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(vol, s + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      src.connect(fl); fl.connect(g); g.connect(master);
      src.start(s); src.stop(s + dur + 0.05);
    }
    // a sung note with vibrato, for the western whistle
    function whistle(freq, t, dur, vol = 0.07) {
      if (!ok()) return;
      const s = ctx.currentTime + t;
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq * 0.97, s); o.frequency.linearRampToValueAtTime(freq, s + 0.08);
      lfo.frequency.value = 5.5; lg.gain.value = freq * 0.012;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(vol, s + 0.06);
      g.gain.setValueAtTime(vol, s + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g); g.connect(master);
      const e = ctx.createGain(); e.gain.value = 0.5; g.connect(e); e.connect(fx);
      o.start(s); lfo.start(s); o.stop(s + dur + 0.05); lfo.stop(s + dur + 0.05);
    }

    return {
      unlock,
      get ctx() { return ctx; },
      get muted() { return muted; },
      setMuted(m) {
        muted = m;
        try { localStorage.setItem('bobz-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
        if (master) master.gain.value = m ? 0 : 0.6;
      },
      pop(n = 0) {
        const f = 660 * Math.pow(2, (n % 10) / 12);
        tone(f, { dur: 0.09, vol: 0.11, type: 'triangle' });
        tone(f * 1.5, { t: 0.06, dur: 0.16, vol: 0.08, type: 'triangle', echo: 0.3 });
      },
      ok() { tone(880, { dur: 0.12, vol: 0.09, type: 'triangle' }); tone(1320, { t: 0.08, dur: 0.2, vol: 0.09, type: 'triangle' }); },
      nope() { tone(233, { dur: 0.28, vol: 0.09, type: 'square', to: 150 }); },
      thunk() { noise({ dur: 0.12, vol: 0.45, f: 900, to: 180 }); tone(95, { dur: 0.18, vol: 0.32, to: 50 }); },
      chop() { noise({ dur: 0.07, vol: 0.2, f: 2500, type: 'bandpass', q: 1.5 }); tone(300, { dur: 0.08, vol: 0.08, to: 180 }); },
      whoosh() { noise({ dur: 0.7, vol: 0.2, type: 'bandpass', f: 400, to: 2400, q: 0.8 }); },
      ding() { tone(1760, { dur: 1.1, vol: 0.12, echo: 0.5 }); tone(2637, { dur: 0.7, vol: 0.04 }); },
      blip(n = 0) { tone(1200 + n * 90, { dur: 0.07, vol: 0.07, type: 'square' }); },
      sparkle() {
        noise({ dur: 0.5, vol: 0.08, type: 'highpass', f: 5200 });
        [0, 0.07, 0.15, 0.24].forEach((t, i) => tone(2300 + i * 430, { t, dur: 0.25, vol: 0.045, echo: 0.5 }));
      },
      fanfare() {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { t: i * 0.09, dur: 0.28, vol: 0.09, type: 'square', echo: 0.2 }));
        [1046.5, 1318.5, 1568].forEach(f => tone(f, { t: 0.42, dur: 1, vol: 0.05, type: 'triangle', echo: 0.4 }));
      },
      boom() { // the BOBZFLIX ident: two deep hits
        tone(56, { dur: 1.4, vol: 0.55, to: 40 });
        tone(112, { dur: 0.8, vol: 0.18, type: 'triangle', to: 70 });
        noise({ dur: 0.45, vol: 0.25, f: 420, to: 80 });
        tone(52, { t: 0.36, dur: 2.2, vol: 0.6, to: 36 });
        tone(104, { t: 0.36, dur: 1.3, vol: 0.2, type: 'triangle', to: 58 });
        noise({ t: 0.36, dur: 0.8, vol: 0.3, f: 520, to: 60 });
        tone(880, { t: 0.5, dur: 1.8, vol: 0.025, echo: 0.6 }); tone(1318.5, { t: 0.55, dur: 1.6, vol: 0.018, echo: 0.6 });
      },
      tvOn() { noise({ dur: 0.18, vol: 0.3, type: 'highpass', f: 2500 }); tone(70, { dur: 0.35, vol: 0.2, to: 45 }); tone(7800, { t: 0.05, dur: 0.6, vol: 0.012 }); },
      static(dur = 0.6) { noise({ dur, vol: 0.2, type: 'bandpass', f: 3200, q: 0.4 }); },
      bubble() { tone(rand(420, 700), { dur: 0.07, vol: 0.05, to: rand(900, 1300) }); },
      ignite() { noise({ dur: 0.5, vol: 0.18, type: 'bandpass', f: 700, to: 300, q: 0.7 }); },
      pour() { noise({ dur: 1.3, vol: 0.12, type: 'bandpass', f: 1000, to: 600, q: 1.4, attack: 0.1 }); },
      sizzle() { noise({ dur: 1.6, vol: 0.2, type: 'highpass', f: 3800, attack: 0.05 }); },
      splash() { noise({ dur: 0.8, vol: 0.35, f: 3200, to: 300 }); tone(180, { dur: 0.15, vol: 0.1, to: 80 }); },
      water(dur = 4) { noise({ dur, vol: 0.1, type: 'bandpass', f: 1500, q: 0.4, attack: 0.3 }); noise({ dur, vol: 0.08, f: 500, attack: 0.3 }); },
      dolphin() { [0, 0.11, 0.22].forEach(t => tone(2200, { t, dur: 0.09, vol: 0.05, to: 3400 })); tone(1700, { t: 0.4, dur: 0.35, vol: 0.05, to: 2900 }); },
      buzzer() { tone(110, { dur: 0.6, vol: 0.13, type: 'square' }); tone(117, { dur: 0.6, vol: 0.09, type: 'sawtooth' }); },
      applause(dur = 2.4) {
        for (let i = 0; i < 60; i++) noise({ t: rand(0, dur) * Math.pow(Math.random(), 0.6), dur: 0.05, vol: rand(0.04, 0.1), type: 'bandpass', f: rand(1400, 4200), q: 1.4, attack: 0.003 });
      },
      gunshot() { noise({ dur: 0.45, vol: 0.75, f: 5200, to: 160, attack: 0.002 }); tone(80, { dur: 0.35, vol: 0.45, to: 38 }); },
      ricochet() { tone(2800, { t: 0.14, dur: 0.55, vol: 0.05, to: 650 }); },
      bell() { tone(1318.5, { dur: 1.2, vol: 0.13, echo: 0.4 }); tone(1975.5, { dur: 0.7, vol: 0.05 }); },
      whistleTune() { // an original little prairie tune
        const N = [[659, 0.5], [880, 0.5], [659, 0.25], [880, 0.25], [988, 1.1], [0, 0.25], [880, 0.5], [784, 0.5], [659, 1.4]];
        let t = 0;
        N.forEach(([f, d]) => { if (f) whistle(f, t, d * 0.44 + 0.05); t += d * 0.44; });
        noise({ t: 0, dur: 0.18, vol: 0.05, type: 'bandpass', f: 180, q: 3 });
      },
      cheer() { noise({ dur: 1.3, vol: 0.2, type: 'bandpass', f: 1100, to: 1600, q: 0.5, attack: 0.08 }); noise({ dur: 1, vol: 0.12, type: 'bandpass', f: 2600, q: 0.8, attack: 0.05 }); },
      drum() { tone(130, { dur: 0.26, vol: 0.35, to: 55 }); noise({ dur: 0.07, vol: 0.12, f: 1800 }); },
      waPop() { tone(1500, { dur: 0.06, vol: 0.06 }); tone(2250, { t: 0.05, dur: 0.08, vol: 0.05 }); },
      scribble() { noise({ dur: 0.28, vol: 0.06, type: 'bandpass', f: 3000, q: 2 }); },
      blow() { noise({ dur: 0.55, vol: 0.2, type: 'bandpass', f: 650, q: 0.5, attack: 0.03 }); },
      happyBirthday() { // music box
        const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
        const song = [
          ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
          ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
          ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
          ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
        ];
        const beat = 0.36; let t = 0.15;
        song.forEach(([n, b]) => {
          const f = N[n] * 2;
          tone(f, { t, dur: Math.max(0.7, b * beat * 1.7), vol: 0.14, echo: 0.45 });
          tone(f * 2, { t, dur: 0.25, vol: 0.02 });
          t += b * beat;
        });
      },
    };
  })();

  const unlockOnce = () => Sound.unlock();
  document.addEventListener('pointerup', unlockOnce, { passive: true });
  document.addEventListener('touchend', unlockOnce, { passive: true });
  document.addEventListener('keydown', unlockOnce);

  const MEDIA = ['#trailer-audio', '#cowboy-audio', '#reaction-vid', '#pl-video'].map(s => $(s));
  const muteBtn = $('#mute');
  function syncMute() {
    muteBtn.setAttribute('aria-pressed', Sound.muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', Sound.muted ? 'Turn sound on' : 'Mute sound');
    MEDIA.forEach(m => { m.muted = Sound.muted; });
  }
  muteBtn.addEventListener('click', () => { Sound.unlock(); Sound.setMuted(!Sound.muted); syncMute(); Sound.pop(4); });
  syncMute();
  const stopMedia = () => MEDIA.forEach(m => { if (m && !m.paused) m.pause(); });

  /* ───────── Toast + floating emoji ───────── */
  const toastEl = $('#toast');
  let toastT = 0;
  function toast(msg, ms = 2800) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
  }
  function floaters(x, y, chars, n = 6) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'float-emoji';
      s.textContent = chars[i % chars.length];
      s.style.left = (x + rand(-34, 34) - 13) + 'px';
      s.style.top = (y + rand(-16, 12) - 13) + 'px';
      s.style.setProperty('--dx', rand(-44, 44) + 'px');
      s.style.animationDelay = (i * 60) + 'ms';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1500 + i * 60);
    }
  }

  /* ───────── Confetti ───────── */
  const PARTY = ['#e3262f', '#f2c14e', '#ffffff', '#60a5fa', '#46d369', '#ff8fab', '#c084fc'];
  const GOLD = ['#f2c14e', '#ffe7a3', '#ffffff', '#d4a017', '#e3262f'];
  const EGYPT = ['#ce1126', '#ffffff', '#111111', '#c09300'];
  const USA_EG = ['#b22234', '#ffffff', '#3c3b6e', '#ce1126', '#111111'];
  const Confetti = (() => {
    const cv = $('#confetti');
    const cx = cv.getContext('2d');
    let parts = [], raf = 0, W = 0, H = 0;
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener('resize', size);
    function burst({ x = W / 2, y = H / 3, n = 120, spread = Math.PI * 2, angle = -Math.PI / 2, speed = 9, colors = PARTY } = {}) {
      if (reduced) n = Math.round(n / 3);
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = speed * (0.45 + Math.random() * 0.8);
        parts.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.16 + Math.random() * 0.1,
          r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, s: 5 + Math.random() * 6,
          c: colors[(Math.random() * colors.length) | 0], shape: Math.random() < 0.6 ? 0 : 1, w: Math.random() * 6.28, life: 0,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
      cx.clearRect(0, 0, W, H);
      parts = parts.filter(p => p.y < H + 40 && p.life < 900);
      for (const p of parts) {
        p.life++;
        p.vx *= 0.985; p.vy = p.vy * 0.985 + p.g;
        p.w += 0.07; p.x += p.vx + Math.sin(p.w) * 0.6; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
        if (p.shape === 0) cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        else { cx.beginPath(); cx.arc(0, 0, p.s / 2.6, 0, 6.283); cx.fill(); }
        cx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(tick);
      else { raf = 0; cx.clearRect(0, 0, W, H); }
    }
    return { burst };
  })();

  /* ───────── What he has watched (remembered on this device) ───────── */
  const Watched = (() => {
    let set = new Set();
    try { set = new Set(JSON.parse(localStorage.getItem('bobz-watched') || '[]')); } catch (e) { /* ignore */ }
    const save = () => { try { localStorage.setItem('bobz-watched', JSON.stringify([...set])); } catch (e) { /* ignore */ } };
    return { has: k => set.has(k), add(k) { set.add(k); save(); }, clear() { set.clear(); save(); } };
  })();

  const EPISODES = [
    { key: 'coffee', n: 1, title: 'Morning Coffee', emoji: '☕', mins: '2m', syn: 'He can’t start the day without it. Make it just right.', bg: 'linear-gradient(135deg,#7a4520,#2a1409)' },
    { key: 'doctor', n: 2, title: 'Dr. Sadig, First Class', emoji: '🩺', mins: '3m', syn: 'ENT & eyes specialist for Saudi Airlines. Seat 1A, always.', bg: 'linear-gradient(135deg,#0f8a58,#0a2e3b)' },
    { key: 'masri', n: 3, title: 'Officially Egyptian', emoji: '🇪🇬', mins: '2m', syn: 'The paperwork is in. Mabrook, ya Masri!', bg: 'linear-gradient(180deg,#ce1126 0 33%,#f4f4f4 33% 66%,#111 66%)' },
    { key: 'villa', n: 4, title: 'Villa Rehab', emoji: '🏡', mins: '3m', syn: 'The pool, the waterfall, the pergola. The good life.', bg: 'linear-gradient(135deg,#1aa3c9,#0f5132)' },
    { key: 'tafee', n: 5, title: 'Film Tafee!', emoji: '🎬', mins: '2m', syn: 'When a film is bad, he can’t stand it. Tonight he’s the critic.', bg: 'linear-gradient(135deg,#3b2f4a,#0d0b11)' },
    { key: 'scam', n: 6, title: 'Scam Busters', emoji: '🚨', mins: '2m', syn: 'WhatsApp safety training for our most trusting viewer 😂', bg: 'linear-gradient(135deg,#128c7e,#075e54)' },
    { key: 'western', n: 7, title: 'The Good, the Bad & the Back Pain', emoji: '🤠', mins: '3m', syn: 'A western. Finally, a film that isn’t tafee.', bg: 'linear-gradient(180deg,#b8325a,#ff8a3d 60%,#3b1d1d)' },
    { key: 'rally', n: 8, title: 'Make 78 Great Again', emoji: '🧢', mins: '2m', syn: 'The rally of the year. The biggest crowds ever.', bg: 'linear-gradient(135deg,#c8102e,#1d2a6b)' },
    { key: 'special', n: 9, special: true, title: 'The Birthday Special', emoji: '🎂', mins: '5m', syn: 'Candles, a letter, a throwback and the credits.', bg: 'linear-gradient(135deg,#f2c14e,#7a4a0e)' },
  ];
  const EP_KEYS = EPISODES.map(e => e.key);

  // Bobz's Jukebox: Santana on YouTube (official uploads where Santana has one)
  const SONGS = [
    { code: 'A1', title: 'Samba Pa Ti', year: 1970, yt: 'j5AUm_xaE9A', note: 'The solo that makes grown men close their eyes', sl: 'linear-gradient(135deg,#ff9a3c,#c8102e)' },
    { code: 'A2', title: 'Europa', year: 1976, yt: 'Ot6pSrKT1oc', note: 'Pure guitar. No words needed', sl: 'linear-gradient(135deg,#3da9ff,#1d2a6b)' },
    { code: 'A3', title: 'Black Magic Woman', year: 1970, yt: '9wT1s96JIb0', note: 'A 1970 classic', sl: 'linear-gradient(135deg,#b86bff,#2b0f3a)' },
    { code: 'A4', title: 'Oye Como Va', year: 1970, yt: 'J7ATTjg7tpE', note: 'Impossible not to dance', sl: 'linear-gradient(135deg,#ffd23f,#ff3d68)' },
    { code: 'B1', title: 'Soul Sacrifice', year: 1969, yt: 'JaaT_HRb4GU', note: 'Live at Woodstock. Legendary', sl: 'linear-gradient(135deg,#3ddc97,#0f5132)' },
    { code: 'B2', title: 'Europa (Live)', year: 2011, yt: 'SgciQ2FF-RM', note: 'Montreux. Eight minutes of solo', sl: 'linear-gradient(135deg,#00c6ff,#6a00f4)' },
    { code: 'B3', title: 'Smooth', year: 1999, yt: '6Whgn_iE5uc', note: 'With Rob Thomas. Turn it up', sl: 'linear-gradient(135deg,#ff6a00,#ee0979)' },
    { code: 'B4', title: 'Maria Maria', year: 1999, yt: 'nPLV7lGbmT4', note: 'Maria, Maria… 🎶', sl: 'linear-gradient(135deg,#f7797d,#6a3093)' },
  ];
  const epLabel = k => { const e = EPISODES.find(x => x.key === k); return e.special ? 'Special' : `E${e.n}`; };

  /* ───────── Screens ───────── */
  const screens = $$('.screen');
  const keys = screens.map(s => s.dataset.key);
  const screenEl = k => screens[keys.indexOf(k)];
  const ctrl = {};
  let cur = 'tv', busy = false;

  function swap(key) {
    const leaving = cur;
    screenEl(leaving).classList.remove('active');
    if (ctrl[leaving] && ctrl[leaving].leave) ctrl[leaving].leave();
    cur = key;
    const el = screenEl(key);
    el.classList.add('active');
    el.scrollTop = 0;
    document.body.dataset.screen = key;
    $('#to-home').hidden = !EP_KEYS.includes(key) && key !== 'jukebox';
    $('#to-jukebox').hidden = key === 'jukebox';
    if (ctrl[key] && ctrl[key].enter) ctrl[key].enter();
  }
  async function show(key, { card = false } = {}) {
    if (busy || key === cur || !keys.includes(key)) return;
    busy = true;
    stopMedia();
    const ep = EPISODES.find(e => e.key === key);
    if (card && ep) {
      $('#tc-num').textContent = ep.special ? 'S78 · Special' : `S78 · E${ep.n}`;
      $('#tc-title').textContent = ep.title;
      const tc = $('#titlecard');
      tc.classList.add('show');
      Sound.boom();
      await wait(420);
      swap(key);
      await wait(reduced ? 500 : 1300);
      tc.classList.remove('show');
    } else {
      swap(key);
      await wait(400);
    }
    busy = false;
  }
  function finish(key) {
    Watched.add(key);
    const S = screenEl(key);
    const n = $('.nav .next', S), s = $('.nav .skip', S);
    if (n) n.hidden = false;
    if (s) s.hidden = true;
    Home.refresh();
  }
  const nextKey = key => EP_KEYS[EP_KEYS.indexOf(key) + 1] || 'home';
  $$('.nav .next, .nav .skip').forEach(b => b.addEventListener('click', () => {
    Sound.unlock();
    const nk = nextKey(b.closest('.screen').dataset.key);
    show(nk, { card: nk !== 'home' });
  }));
  $('#to-home').addEventListener('click', () => { Sound.unlock(); show('home'); });
  // Open the jukebox, straight from the tap so the song is allowed to start playing
  function openJukebox(i) {
    Sound.unlock();
    show('jukebox');
    if (i != null && cur === 'jukebox') ctrl.jukebox.play(i);
  }
  $('#to-jukebox').addEventListener('click', () => openJukebox());

  /* ───────── Trailer (the voice-over, with captions and pictures) ───────── */
  const Trailer = (() => {
    const box = $('#trailer'), a = $('#trailer-audio'), cap = $('#tr-cap'), fill = $('#tr-fill'), studio = $('#tr-studio');
    const slides = $$('.tr-slide', box);
    const LEN = 33.8;
    const CUES = [
      [0.45, 'In a world…'],
      [2.6, 'where one man retired at 50…'],
      [5.8, '…to watch every film ever made'],
      [9.5, 'he flew the world…'],
      [11.7, 'FIRST CLASS ✈️', 'big'],
      [14.0, 'He is officially…'],
      [16.2, 'EGYPTIAN 🇪🇬', 'big'],
      [18.2, 'And films he doesn’t like?'],
      [20.5, 'TAFEE! 👎', 'big'],
      [21.9, 'This September 30th…'],
      [24.0, 'BOBZ turns 78', 'big'],
      [26.6, ''],
      [28.0, 'The Legend Continues'],
      [30.3, 'Rated T…'],
      [32.3, '…for TREMENDOUS', 'big'],
    ];
    let raf = 0, after = null, idx = -2, slideIdx = -1, clock = false, t0 = 0, endT = 0;
    const now = () => (clock ? (performance.now() - t0) / 1000 : a.currentTime);
    function frame() {
      const t = now();
      let i = -1;
      for (let k = 0; k < CUES.length; k++) if (t >= CUES[k][0]) i = k;
      if (i !== idx) {
        idx = i;
        cap.textContent = i >= 0 ? CUES[i][1] : '';
        cap.className = 'tr-cap' + (i >= 0 && CUES[i][2] ? ' ' + CUES[i][2] : '');
        void cap.offsetWidth;
        cap.classList.add('in');
      }
      let s = 0;
      slides.forEach((el, k) => { if (t >= +el.dataset.from) s = k; });
      if (s !== slideIdx) {
        slideIdx = s;
        slides.forEach((el, k) => el.classList.toggle('on', k === s));
        if (s === slides.length - 1) Sound.boom();
      }
      fill.style.width = Math.min(100, (t / LEN) * 100) + '%';
      studio.classList.toggle('on', t < 8.6);
      if (t >= LEN + 1.2) { close(); return; }
      raf = requestAnimationFrame(frame);
    }
    function useClock() { if (!clock) { clock = true; t0 = performance.now() - a.currentTime * 1000; } }
    function play(then) {
      after = then || null;
      box.hidden = false;
      idx = -2; slideIdx = -1; clock = false;
      a.muted = Sound.muted;
      try { a.currentTime = 0; } catch (e) { /* not loaded yet */ }
      const p = a.play();
      if (p && p.catch) p.catch(useClock);
      else if (!p && a.paused) useClock();
      clearTimeout(endT);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
    a.addEventListener('error', useClock);
    a.addEventListener('ended', () => { useClock(); });
    function close() {
      if (box.hidden) return;
      cancelAnimationFrame(raf);
      a.pause();
      box.hidden = true;
      studio.classList.remove('on');
      slides.forEach(el => el.classList.remove('on'));
      const fn = after; after = null;
      if (fn) fn();
    }
    $('#tr-skip').addEventListener('click', close);
    return { play, close };
  })();

  /* ───────── Video player (BOBZFLIX Originals) ───────── */
  const Player = (() => {
    const box = $('#player'), v = $('#pl-video');
    function open(src, title) {
      Sound.unlock();
      $('#pl-title').textContent = title;
      v.src = src;
      v.muted = Sound.muted;
      box.hidden = false;
      const p = v.play();
      if (p && p.catch) p.catch(() => { /* he can press play */ });
    }
    function close() {
      v.pause();
      v.removeAttribute('src');
      v.load();
      box.hidden = true;
    }
    $('#pl-close').addEventListener('click', close);
    box.addEventListener('click', e => { if (e.target === box) close(); });
    return { open };
  })();

  /* ───────── 0 · Switch on the TV ───────── */
  ctrl.tv = (() => {
    const S = screenEl('tv');
    const cv = $('#static'), cx = cv.getContext('2d');
    let raf = 0, busyTv = false;
    function snow() {
      cv.width = 160; cv.height = 100;
      const img = cx.createImageData(160, 100);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(snow);
    }
    $('#power').addEventListener('click', async () => {
      if (busyTv) return;
      busyTv = true;
      Sound.unlock(); buzz(20);
      Sound.tvOn();
      S.classList.add('on');
      await wait(420);
      S.classList.add('static'); Sound.static(0.55); snow();
      await wait(560);
      cancelAnimationFrame(raf);
      S.classList.remove('static');
      S.classList.add('ident-on'); Sound.boom();
      await wait(reduced ? 900 : 2300);
      busyTv = false;
      show('profiles');
    });
    return { enter() { S.classList.remove('on', 'static', 'ident-on'); } };
  })();

  /* ───────── Who's watching? ───────── */
  ctrl.profiles = (() => {
    const MSG = {
      bobz: 'Welcome back, Bobz! 👑',
      sujooks: 'Sujooks?! Only Mom gets to call you that 😂🌭',
      doc: 'Paging Dr. Sadig… your birthday is ready 🩺',
    };
    let picked = false;
    $$('.prof').forEach(p => p.addEventListener('click', () => {
      Sound.unlock();
      const k = p.dataset.p;
      if (k === 'kids') {
        restart(p, 'shake'); Sound.nope(); buzz([30, 30, 30]);
        $('#prof-msg').textContent = 'This profile is for kids. You’re 78, ya Bobz 😂 Pick again!';
        return;
      }
      if (picked) return;
      picked = true;
      p.classList.add('pick'); Sound.ok();
      $('#prof-msg').textContent = MSG[k];
      // Start the trailer from this tap: phones only allow sound that starts from a tap
      Trailer.play(() => {
        show('home');
        setTimeout(() => toast(MSG[k]), 600);
      });
    }));
    return { enter() { picked = false; $$('.prof').forEach(p => p.classList.remove('pick')); $('#prof-msg').textContent = ''; } };
  })();

  /* ───────── Home ───────── */
  const Home = (() => {
    const list = $('#eps');
    list.innerHTML = EPISODES.map(e => `<li><button class="ep-btn" type="button" data-go="${e.key}">
      <span class="thumb" style="--bg-t:${e.bg}">${e.emoji}<b>${e.special ? '★' : e.n}</b><span class="tick">✓</span></span>
      <span class="ep-info"><b>${e.special ? '' : e.n + '. '}${e.title}</b><small>${e.mins}</small><span class="syn">${e.syn}</span><span class="prog"><i></i></span></span>
    </button></li>`).join('');
    list.addEventListener('click', ev => {
      const b = ev.target.closest('.ep-btn');
      if (!b) return;
      Sound.unlock(); Sound.pop(2);
      show(b.dataset.go, { card: true });
    });

    const TOP = [
      { t: 'Bobz: The Legend', img: 'photos/thumbs-up.jpg', msg: '#1 in Egypt. #1 in our hearts 👑' },
      { t: 'Turkish Coffee', e: '☕', bg: 'linear-gradient(160deg,#7a4520,#2a1409)', msg: 'Rated 10/10, every single morning ☕' },
      { t: 'Pool & Pergola', img: 'photos/pergola.jpg', msg: 'Best enjoyed with a glass of tea ☀️' },
      { t: 'Real Westerns', e: '🤠', bg: 'linear-gradient(160deg,#ff8a3d,#7a2f45)', msg: 'The only films that are never tafee 🤠' },
      { t: 'Breaking News', e: '📰', bg: 'linear-gradient(160deg,#c8102e,#1d2a6b)', msg: 'Already forwarded to the family group 😂' },
      { t: 'Film Tafee 7', e: '🗑️', bg: 'linear-gradient(160deg,#444,#111)', msg: 'Switched off after five minutes. Tafee! 👎' },
      { t: 'Free iPhone 17', e: '📱', bg: 'linear-gradient(160deg,#25d366,#075e54)', msg: 'Scam! 🚩 Don’t click it, Bobz 😂' },
    ];
    const top = $('#top10');
    top.innerHTML = TOP.map((x, i) => `<button class="t10" type="button" data-i="${i}" aria-label="Number ${i + 1}: ${x.t}"><span class="num" aria-hidden="true">${i + 1}</span><span class="tp" style="--bg-t:${x.bg || '#222'}">${x.img ? `<img src="${x.img}" alt="" loading="lazy" decoding="async">` : x.e}<em>${x.t}</em></span></button>`).join('');
    top.addEventListener('click', ev => {
      const b = ev.target.closest('.t10');
      if (!b) return;
      Sound.unlock(); Sound.pop(+b.dataset.i + 1);
      toast(TOP[+b.dataset.i].msg);
    });

    const recs = $('#records');
    recs.innerHTML = SONGS.map((s, i) => `<button class="lp" type="button" data-i="${i}" aria-label="Play ${s.title}"><span class="sleeve" style="--sl:${s.sl}"><i>${s.code}</i><em>${s.title}</em></span><span class="lp-t">${s.title}</span><small>Santana · ${s.year}</small></button>`).join('');
    recs.addEventListener('click', ev => {
      const b = ev.target.closest('.lp');
      if (b) openJukebox(+b.dataset.i);
    });

    $$('.orig').forEach(o => o.addEventListener('click', () => Player.open(o.dataset.video, o.dataset.title)));
    $('#play-all').addEventListener('click', () => {
      Sound.unlock();
      const k = EP_KEYS.find(x => !Watched.has(x)) || EP_KEYS[0];
      show(k, { card: true });
    });
    $('#trailer-btn').addEventListener('click', () => { Sound.unlock(); Trailer.play(); });

    function refresh() {
      $$('.ep-btn', list).forEach(b => b.classList.toggle('watched', Watched.has(b.dataset.go)));
      const next = EP_KEYS.find(k => !Watched.has(k));
      const any = EP_KEYS.some(k => Watched.has(k));
      $('#play-all').textContent = !any ? '▶ Play' : next ? `▶ Resume · ${epLabel(next)}` : '▶ Play again';
    }
    refresh();
    return { refresh, enter: refresh };
  })();
  ctrl.home = Home;

  /* ───────── E1 · Morning Coffee ───────── */
  ctrl.coffee = (() => {
    const S = screenEl('coffee');
    const stove = $('#stove'), foam = $('.foam-g', S), spoonEl = $('.spoon', S), bubbles = $('.bubbles', S);
    const text = $('#cf-text');
    const bSpoon = $('#cf-spoon'), sugar = $('#cf-sugar'), bStir = $('#cf-stir'), bFire = $('#cf-fire'), bLift = $('#cf-lift'), bAgain = $('#cf-again');
    let spoons = 0, level = 0, heating = false, paused = false, raf = 0, last = 0, bubT = 0;
    const say = t => { text.textContent = t; };
    function setLevel(lv) {
      level = lv;
      foam.setAttribute('transform', `translate(0 ${((1 - Math.min(lv, 1.02)) * 44).toFixed(1)})`);
    }
    setLevel(0);

    bSpoon.addEventListener('click', () => {
      Sound.unlock();
      spoons++;
      restart(spoonEl, 'drop'); Sound.chop(); buzz(8);
      if (spoons === 1) { say('One more… he likes it strong 💪'); bSpoon.textContent = '🥄 And one more spoon'; }
      if (spoons >= 2) { bSpoon.hidden = true; sugar.hidden = false; say('Sugar? How does Bobz take it?'); }
    });
    $$('.chip', sugar).forEach(c => c.addEventListener('click', () => {
      if (!sugar.hidden && sugar.dataset.done) return;
      sugar.dataset.done = '1';
      Sound.pop(3);
      $$('.chip', sugar).forEach(x => x.classList.toggle('on', x === c));
      const s = c.dataset.s;
      say(s === 'sada' ? 'Sada, no sugar. Strong, like you 💪' : s === 'mazboot' ? 'Mazboot, just right. Like you 👌' : 'Ziyada, extra sweet. Like you 🥹');
      setTimeout(() => { sugar.hidden = true; bStir.hidden = false; }, 1100);
    }));
    bStir.addEventListener('click', () => {
      bStir.hidden = true;
      spoonEl.classList.remove('drop');
      restart(spoonEl, 'stir');
      Sound.chop(); setTimeout(() => Sound.chop(), 500); setTimeout(() => Sound.chop(), 1000);
      setTimeout(() => {
        spoonEl.classList.remove('stir');
        bFire.hidden = false;
        say('Stirred. Now low heat, and watch the foam (the “wesh”) rise…');
      }, 1550);
    });
    bFire.addEventListener('click', () => { bFire.hidden = true; startHeat(0); });

    function startHeat(from) {
      stove.classList.remove('over');
      stove.classList.add('lit');
      Sound.ignite();
      setLevel(from);
      heating = true; paused = false;
      bLift.hidden = false; bAgain.hidden = true;
      say('Take it off the heat when the foam reaches the gold line!');
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }
    function tick(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setLevel(level + dt * (level < 0.5 ? 0.14 : 0.1));
      if (t - bubT > (level > 0.6 ? 110 : 360)) {
        bubT = t;
        const b = document.createElement('span');
        b.className = 'bub';
        b.style.left = rand(38, 60) + '%';
        b.style.top = (44 - Math.min(level, 1) * 10 + rand(-2, 2)) + '%';
        bubbles.appendChild(b);
        setTimeout(() => b.remove(), 1000);
        if (level > 0.45) Sound.bubble();
      }
      if (level >= 1.02) { boilOver(); return; }
      raf = requestAnimationFrame(tick);
    }
    function boilOver() {
      heating = false;
      cancelAnimationFrame(raf);
      stove.classList.remove('lit');
      stove.classList.add('over');
      Sound.sizzle(); buzz([60, 40, 60]);
      bLift.hidden = true; bAgain.hidden = false;
      say('Khalas! It boiled over 😱 Quick, clean the stove before Mom sees!');
    }
    bAgain.addEventListener('click', () => startHeat(0.4));
    bLift.addEventListener('click', () => {
      if (!heating) return;
      if (level < 0.74) { Sound.nope(); say('Not yet! No wesh, no respect 😅 Wait for the gold line…'); return; }
      heating = false;
      cancelAnimationFrame(raf);
      stove.classList.remove('lit');
      bLift.hidden = true;
      Sound.ok(); buzz(20);
      say('Perfect wesh! 👌 Pouring…');
      stove.classList.add('pour');
      Sound.pour();
      setTimeout(serve, 1300);
    });
    function serve() {
      stove.hidden = true;
      $('.cf-panel', S).hidden = true;
      $('#cup-stage').hidden = false;
      const [x, y] = centre($('.cup-box', S));
      Confetti.burst({ x, y, n: 60, speed: 7, colors: GOLD });
      Sound.sparkle();
      scrollTo($('#cup-stage'), 'center');
    }
    $('#cf-fortune').addEventListener('click', async () => {
      const btn = $('#cf-fortune'), box = $('.cup-box', S), note = $('#cup-note');
      btn.disabled = true;
      note.textContent = 'Flip the cup… and let it cool ⏳';
      box.classList.add('flip');
      Sound.thunk();
      await wait(1700);
      box.classList.add('read');
      Sound.sparkle();
      note.textContent = 'Let’s see what the cup says… 🔮';
      btn.hidden = true;
      const F = [
        '🌴 A palm tree: long, lazy afternoons by the pool and the pergola.',
        '📺 A screen: great films ahead, and not one of them tafee.',
        '❤️ A heart: a family who loves you very, very much.',
        '7️⃣8️⃣ And a number… 78? No, wait, it keeps going. Many, many more years, inshallah 🤲',
      ];
      const ul = $('#fortunes');
      for (const f of F) {
        await wait(1000);
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
        Sound.pop(ul.children.length + 2);
      }
      await wait(400);
      finish('coffee');
      scrollTo($('.nav', S), 'end');
    });
    return {
      enter() { if (paused) startHeat(level); },
      leave() { if (heating) { heating = false; paused = true; cancelAnimationFrame(raf); stove.classList.remove('lit'); } },
    };
  })();

  /* ───────── E2 · Dr. Sadig, First Class ───────── */
  ctrl.doctor = (() => {
    const S = screenEl('doctor');
    const lines = $$('.ec', S), btn = $('#ec-next');
    let n = 1;
    lines[0].classList.add('on');
    btn.addEventListener('click', () => {
      Sound.unlock();
      if (n < lines.length) { lines[n].classList.add('on'); Sound.blip(n); n++; }
      if (n === lines.length - 1) btn.textContent = '🔍 And the bottom line?';
      if (n === lines.length) {
        btn.textContent = '✅ 20/20 vision, Doctor!';
        btn.disabled = true;
        btn.classList.add('won');
        lines[lines.length - 1].classList.add('red');
        Sound.ok();
        setTimeout(() => { $('#pass').classList.add('on'); scrollTo($('#pass'), 'center'); }, 800);
      }
    });
    const CLASSES = [['ECONOMY', '34F'], ['BUSINESS', '12C'], ['FIRST', '1A']];
    let c = 0;
    $('#upgrade').addEventListener('click', () => {
      if (c >= 2) return;
      Sound.unlock();
      c++;
      $('#cls').textContent = CLASSES[c][0];
      $('#seat').textContent = CLASSES[c][1];
      Sound.ding();
      const up = $('#upgrade');
      if (c === 1) {
        up.textContent = '⬆ Again! (staff perks)';
        toast('Business class ✈️ Not bad… but Dr. Sadig flies First.');
      } else {
        $('#cls').classList.add('first');
        $('#pass').classList.add('first');
        up.textContent = '🥂 Welcome to First Class, Doctor';
        up.disabled = true;
        up.classList.add('won');
        Sound.fanfare();
        const [x, y] = centre($('#pass'));
        Confetti.burst({ x, y, n: 90, colors: GOLD });
        setTimeout(writeRx, 1100);
      }
    });
    async function writeRx() {
      $('#rx').classList.add('on');
      scrollTo($('#rx'), 'start');
      for (const li of $$('.rx-list li', S)) {
        await wait(700);
        li.classList.add('on');
        Sound.scribble();
      }
      await wait(500);
      finish('doctor');
    }
    return {};
  })();

  /* ───────── E3 · Officially Egyptian ───────── */
  ctrl.masri = (() => {
    const S = screenEl('masri');
    const cert = $('#cert'), btn = $('#stamp-btn');
    let stamped = false;
    function stamp() {
      if (stamped) return;
      stamped = true;
      Sound.unlock();
      cert.classList.add('stamped');
      setTimeout(() => { Sound.thunk(); buzz(40); }, 180);
      const [x, y] = centre(cert);
      setTimeout(() => Confetti.burst({ x, y, n: 130, colors: EGYPT }), 260);
      btn.textContent = 'مبروك · Mabrook! 🇪🇬';
      btn.disabled = true;
      btn.classList.add('won');
      setTimeout(() => { $('#checklist').classList.add('on'); scrollTo($('#checklist'), 'start'); }, 1300);
    }
    btn.addEventListener('click', stamp);
    cert.addEventListener('click', stamp);
    const chks = $$('.chk', S);
    chks.forEach((c, i) => c.addEventListener('click', () => {
      if (c.classList.contains('on')) return;
      c.classList.add('on');
      Sound.pop(i + 2); buzz(8);
      if (chks.every(x => x.classList.contains('on'))) {
        $('#chk-result').hidden = false;
        $('#roots').classList.add('on');
        Sound.fanfare();
        const [x, y] = centre($('#chk-result'));
        Confetti.burst({ x, y, n: 120, colors: EGYPT });
        finish('masri');
        setTimeout(() => scrollTo($('#chk-result'), 'center'), 200);
      }
    }));
    return {};
  })();

  /* ───────── E4 · Villa Rehab ───────── */
  ctrl.villa = (() => {
    const S = screenEl('villa'), cam = $('#cam');
    const views = $$('.cam-view', cam), tabs = $$('.cam-switch button', S);
    const done = new Set();
    let camNow = 'pool', clockT = 0;
    function setCam(k) {
      if (k === camNow) return;
      camNow = k;
      views.forEach(v => v.classList.toggle('on', v.dataset.cam === k));
      tabs.forEach(t => { const on = t.dataset.cam === k; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
      $('#cam-name').textContent = k === 'pool' ? 'CAM 1 · POOL' : 'CAM 2 · PERGOLA';
      Sound.static(0.18);
    }
    tabs.forEach(t => t.addEventListener('click', () => { Sound.unlock(); setCam(t.dataset.cam); }));
    function mark(t) {
      if (done.has(t)) return;
      done.add(t);
      const task = $(`.task[data-t="${t}"]`, S);
      if (task) task.classList.add('done');
      if (done.size === 4) setTimeout(() => { finish('villa'); toast('Villa Rehab is birthday-ready 🎉🏡'); scrollTo($('.nav', S), 'end'); }, 1600);
    }
    function ripple(ev) {
      const stage = $('.cam-view[data-cam="pool"] .stage-img', cam);
      const r = stage.getBoundingClientRect();
      const inside = ev && ev.clientX && ev.target.closest && ev.target.closest('.cam');
      const x = inside ? ev.clientX - r.left : r.width * 0.5;
      const y = inside ? ev.clientY - r.top : r.height * 0.66;
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('span');
        s.className = 'ripple';
        s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.animationDelay = (i * 0.18) + 's';
        stage.appendChild(s);
        setTimeout(() => s.remove(), 1700);
      }
    }
    function party() {
      cam.classList.add('party-on');
      const p = $('.party', cam);
      if (!$('.bunting', p)) {
        const b = document.createElement('div');
        b.className = 'bunting';
        const cols = ['#ce1126', '#ffffff', '#111111', '#f2c14e'];
        b.innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="background:${cols[i % 4]}"></i>`).join('');
        p.appendChild(b);
      }
      ['🎈', '🎈', '🎉', '🎈', '🎂', '🎈', '🎈'].forEach((e, i) => {
        const s = document.createElement('span');
        s.className = 'balloon';
        s.textContent = e;
        s.style.left = (6 + i * 13) + '%';
        s.style.setProperty('--dx', rand(-30, 30) + 'px');
        s.style.setProperty('--rot', rand(-20, 20) + 'deg');
        s.style.animationDelay = (i * 0.25) + 's';
        p.appendChild(s);
        setTimeout(() => s.remove(), 6000 + i * 250);
      });
      Sound.fanfare();
      toast('Party mode: ON 🎈');
    }
    function act(t, ev) {
      Sound.unlock();
      if (t === 'falls') {
        setCam('pool');
        cam.classList.add('falls-on');
        Sound.water(4);
        toast('Waterfall: ON 💦');
      } else if (t === 'dolphins') {
        setCam('pool');
        ripple(ev);
        restart(cam, 'dolph');
        Sound.splash();
        setTimeout(() => Sound.dolphin(), 350);
        toast('The dolphins say happy birthday! 🐬🎂');
      } else if (t === 'tea') {
        setCam('pergola');
        cam.classList.add('tea-on');
        $('#mom-bubble').hidden = false;
        Sound.pour();
        setTimeout(() => Sound.ding(), 600);
      } else if (t === 'party') {
        party();
      }
      mark(t);
    }
    $$('.hot', cam).forEach(h => h.addEventListener('click', ev => act(h.dataset.t, ev)));
    $$('.task', S).forEach(b => b.addEventListener('click', () => act(b.dataset.t)));
    function clock() {
      const d = new Date(), p = v => String(v).padStart(2, '0');
      $('#cam-time').textContent = `30.09 · ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }
    return {
      enter() { clock(); clearInterval(clockT); clockT = setInterval(clock, 1000); },
      leave() { clearInterval(clockT); },
    };
  })();

  /* ───────── E5 · Film Tafee! ───────── */
  ctrl.tafee = (() => {
    const S = screenEl('tafee');
    const stage = $('#poster-stage'), note = $('#critic-note'), good = $('#v-good'), bad = $('#v-bad');
    const FILMS = [
      { top: 'Now in cinemas, sadly', title: 'Fast & Furious 23', tag: 'Family. Again. And again.', art: '🏎️💥', bg: 'linear-gradient(160deg,#ff7a18,#af002d 55%,#1a0006)', meta: '2h 58m · Mostly cars', bad: true },
      { top: 'In 3D, for 3 hours', title: 'Space Robots vs. More Space Robots', tag: 'Part 7 of 12. Zero plot.', art: '🤖🚀', bg: 'linear-gradient(160deg,#3a7bd5,#1b1b4b 60%,#05050f)', meta: 'Sequel to the prequel', bad: true },
      { top: 'A western classic', title: 'The Good, the Bad & the Birthday', tag: 'Real cowboys. Real dust.', art: '🤠🌵', bg: 'linear-gradient(160deg,#f6b352,#a0522d 55%,#2b1308)', meta: '1966 · Technicolor', good: true },
      { top: 'Nobody asked for this', title: 'Love in the Rain (Again)', tag: 'Two hours of staring out of windows.', art: '💕🌧️', bg: 'linear-gradient(160deg,#ff9a9e,#a18cd1 60%,#2b1b3b)', meta: 'Rom-com · 2h 41m', bad: true },
      { top: 'Kharem Barem Productions presents', title: 'BOBZ (1948)', tag: 'The director’s cut. 78 years in the making.', img: 'photos/thumbs-up.jpg', bg: 'linear-gradient(180deg,#1a1a1a,#000)', meta: 'Rated T for Tremendous', bobz: true },
    ];
    let i = 0, reviewed = 0, tafee = 0, lock = false, dodges = 0;
    function render() {
      const f = FILMS[i];
      stage.innerHTML = `<div class="poster" style="--p-bg:${f.bg}${f.img ? `;--p-img:url('${f.img}')` : ''}">
        <div class="p-top">${f.top}</div>
        ${f.img ? '<div class="p-img"></div>' : `<div class="p-art">${f.art}</div>`}
        <div><div class="p-title">${f.title}</div><div class="p-tag">${f.tag}</div><div class="p-meta">${f.meta}</div></div>
      </div>`;
      note.innerHTML = f.bobz ? 'And finally, the one everyone is talking about 🍿' : `Film ${i + 1} of ${FILMS.length}: great film, or <b>film tafee</b>?`;
    }
    render();
    function dodge() {
      dodges++;
      Sound.pop(dodges + 4); buzz(10);
      const msgs = ['Nice try 😏', 'Not this one!', 'Impossible!', 'Access denied 🔒'];
      bad.textContent = msgs[Math.min(dodges - 1, msgs.length - 1)];
      bad.style.transform = `translate(${rand(-70, 20).toFixed(0)}px, ${rand(-90, -30).toFixed(0)}px) rotate(${rand(-14, 14).toFixed(0)}deg)`;
      if (dodges >= 4) {
        setTimeout(() => {
          bad.hidden = true;
          good.style.gridColumn = '1 / -1';
          note.innerHTML = 'The tafee button has left the building 😂 Only one option left…';
        }, 500);
      }
    }
    async function verdict(isGood) {
      if (lock) return;
      const f = FILMS[i];
      Sound.unlock();
      if (f.bobz && !isGood) { dodge(); return; }
      lock = true;
      const poster = $('.poster', stage);
      reviewed++;
      $('#tf-count').textContent = reviewed;
      if (f.bobz) {
        poster.insertAdjacentHTML('beforeend', '<div class="stars">⭐⭐⭐⭐⭐</div>');
        Sound.fanfare(); Sound.applause(); buzz([30, 40, 60]);
        const [x, y] = centre(poster);
        Confetti.burst({ x, y, n: 170, speed: 11, colors: GOLD });
        note.innerHTML = '⭐⭐⭐⭐⭐ <b>A masterpiece.</b> The Oscar for Best Dad goes to… Bobz! 🏆';
        $('#verdict').hidden = true;
        await wait(1600);
        $('#reaction').classList.add('on');
        finish('tafee');
        scrollTo($('#reaction'), 'start');
        return;
      }
      if (!isGood) {
        tafee++;
        $('#tf-tafee').textContent = tafee;
        poster.insertAdjacentHTML('beforeend', '<div class="tafee-stamp">TAFEE!<small>فيلم تافه</small></div>');
        Sound.thunk(); Sound.buzzer(); buzz([40, 30, 40]);
        note.innerHTML = f.good ? 'Tafee?! A <b>western</b>?! Who are you, and what have you done with Bobz? 😱' : 'Correct. <b>Film tafee.</b> Switched off after five minutes 🗑️';
        await wait(1300);
        poster.classList.add('out-bad');
        await wait(650);
      } else {
        poster.insertAdjacentHTML('beforeend', `<div class="stars">${f.good ? '⭐⭐⭐⭐⭐' : '⭐'}</div>`);
        if (f.good) { Sound.fanfare(); note.innerHTML = 'A classic! Finally, a <b>real</b> film 🤠'; }
        else { Sound.nope(); note.innerHTML = 'Really?! 🤨 Are you feeling OK, Bobz? Fine… one star.'; }
        await wait(1300);
        poster.classList.add('out-good');
        await wait(550);
      }
      i++;
      lock = false;
      render();
    }
    good.addEventListener('click', () => verdict(true));
    bad.addEventListener('click', () => verdict(false));
    return {};
  })();

  /* ───────── E6 · Scam Busters ───────── */
  ctrl.scam = (() => {
    const phone = $('#sc-phone'), body = $('#sc-body'), note = $('#sc-note');
    const MSGS = [
      {
        name: 'Auntie 🌸', av: '👵🏻', scam: true,
        text: 'Hi habibi 🌹 I’m stuck at the airport!! Please send me your credit card number and the 3 little numbers on the back. URGENT 🙏🙏',
        right: 'Correct! 🚩 Her account was hacked. Sound familiar, Bobz? 😂',
        wrong: '😂 NOT AGAIN, BOBZ! That’s exactly how it happened last time!',
      },
      {
        name: 'Unknown number', av: '📦', scam: true,
        text: '📦 Your parcel is waiting! Pay a small customs fee of 19 EGP here 👉 egypt-post.parcel-fee.example',
        right: 'Scam! 🚩 There is no parcel. There is never a parcel.',
        wrong: 'Oops 😬 That was a scam. There’s no parcel, Bobz!',
      },
      {
        name: 'Mom', av: '☘️', scam: false,
        text: 'Sujooks, your tea is ready ☕ Come to the pergola!',
        right: 'Legit ✅ The one message you should always answer straight away 😂',
        wrong: 'That was Mom!! 😂 She is not a scammer (but she’ll hear about this).',
      },
      {
        name: 'Prize Department 🏆', av: '🎁', scam: true,
        text: '🎉 CONGRATULATIONS!!! You have WON a FREE iPhone 17 Pro! Claim it before midnight 👉 free-iphone-17.example',
        right: 'Scam! 🚩 Nobody gives away free iPhones. Not even on your birthday.',
        wrong: '😂 There is no free iPhone, Bobz. There never was.',
      },
      {
        name: '+20 10 0000 0000', av: '👤', scam: true,
        text: 'Hi Dad, it’s me! New number, I lost my phone 📱 Can you send 5,000 EGP to this account quickly? And don’t tell Mom 🤫',
        right: 'Scam! 🚩 Always call the old number first. (“Don’t tell Mom”? Please 😂)',
        wrong: 'Scam! 🚩 Always call the old number first, Bobz!',
      },
    ];
    let i = -1, caught = 0, correct = 0, lock = true, started = false;
    const hhmm = () => { const d = new Date(), p = v => String(v).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
    async function showMsg() {
      i++;
      const m = MSGS[i];
      phone.classList.remove('right', 'wrong');
      $('#sc-av').textContent = m.av;
      $('#sc-name').textContent = m.name;
      $('#sc-status').textContent = 'typing…';
      $('#sc-n').textContent = i + 1;
      body.innerHTML = '<div class="wa-typing"><i></i><i></i><i></i></div>';
      note.textContent = 'A new message… 👀';
      await wait(1100);
      $('#sc-status').textContent = 'online';
      body.innerHTML = `<div class="wa-msg in">${m.text}<span class="wa-time">${hhmm()}</span></div>`;
      Sound.waPop();
      note.innerHTML = 'Is this message a <b>scam</b>, or <b>legit</b>?';
      lock = false;
    }
    async function answer(saysScam) {
      if (lock) return;
      lock = true;
      Sound.unlock();
      const m = MSGS[i];
      const right = saysScam === m.scam;
      if (right) correct++;
      if (saysScam && m.scam) { caught++; $('#sc-caught').textContent = caught; }
      phone.classList.add(right ? 'right' : 'wrong');
      const b = $('.wa-msg', body);
      if (b) b.insertAdjacentHTML('beforeend', `<span class="sc-flag">${m.scam ? '🚩' : '✅'}</span>`);
      note.innerHTML = right ? m.right : m.wrong;
      if (right) { Sound.ok(); buzz(15); } else { Sound.buzzer(); buzz([40, 30, 40]); }
      await wait(2700);
      if (i < MSGS.length - 1) showMsg();
      else done();
    }
    function done() {
      $('#sc-verdict').hidden = true;
      phone.classList.remove('right', 'wrong');
      const [title, text] = correct === MSGS.length
        ? ['Certified Scam-Proof! 🛡️', '5 out of 5! Mabrook, Bobz. (We’re still keeping your credit card in Mom’s purse, just in case 😂)']
        : correct >= 3
          ? ['Almost Scam-Proof', `${correct} out of 5. Not bad, Bobz! Keep your card in your pocket, not on WhatsApp 😂`]
          : ['Card Confiscated 😂', `${correct} out of 5… Oh, Bobz. Mom is holding your credit card now, for your own safety.`];
      $('#sc-title').textContent = title;
      $('#sc-text').textContent = text;
      $('#sc-cert').classList.add('on');
      Sound.fanfare();
      const [x, y] = centre($('#sc-cert'));
      Confetti.burst({ x, y, n: 110, colors: ['#25d366', '#ffffff', '#128c7e', '#f2c14e'] });
      finish('scam');
      setTimeout(() => scrollTo($('#sc-cert'), 'center'), 200);
    }
    $('#sc-scam').addEventListener('click', () => answer(true));
    $('#sc-legit').addEventListener('click', () => answer(false));
    return { enter() { if (!started) { started = true; showMsg(); } } };
  })();

  /* ───────── E7 · The Good, the Bad & the Back Pain ───────── */
  ctrl.western = (() => {
    const S = screenEl('western');
    const duel = $('#duel'), btn = $('#duel-btn'), tap = $('#duel-tap'), voice = $('#cowboy-audio'), text = $('#duel-text');
    let state = 'idle', run = 0, drawAt = 0, timer = 0, voiced = false;
    const say = h => { text.innerHTML = h; };
    btn.addEventListener('click', async () => {
      if (state !== 'idle') return;
      Sound.unlock();
      const me = ++run;
      state = 'intro';
      btn.hidden = true;
      duel.classList.remove('draw', 'fired', 'won', 'flash', 'armed');
      if (!voiced) {
        voiced = true;
        voice.muted = Sound.muted;
        try { voice.currentTime = 0; } catch (e) { /* not loaded yet */ }
        const p = voice.play();
        if (p && p.catch) p.catch(() => { /* the captions still tell the story */ });
        say('“Well, well, well…”');
        await wait(2200); if (me !== run) return;
        say('“…Back Pain.”');
        await wait(1300); if (me !== run) return;
        say('“Sheriff Bobz is back in town, partner.”');
        await wait(3000); if (me !== run) return;
        say('“Yee-haw!” 🤠');
        await wait(1100); if (me !== run) return;
      }
      Sound.whistleTune();
      say('Ready…');
      await wait(1600); if (me !== run) return;
      say('Steady…');
      state = 'armed';
      duel.classList.add('armed');
      timer = setTimeout(() => {
        if (state !== 'armed' || me !== run) return;
        state = 'draw';
        drawAt = performance.now();
        duel.classList.add('draw');
        Sound.bell(); buzz(30);
        say('<b>DRAW!</b> Tap now!');
      }, rand(1500, 3600));
    });
    function fire() {
      if (state === 'armed') {
        clearTimeout(timer);
        state = 'idle';
        duel.classList.remove('armed');
        Sound.nope();
        say('Too early, partner! 🤠 A real cowboy waits for <b>DRAW!</b>');
        btn.textContent = '🤠 Try again';
        btn.hidden = false;
        return;
      }
      if (state !== 'draw') return;
      state = 'done';
      const ms = Math.round(performance.now() - drawAt);
      duel.classList.remove('armed', 'draw');
      duel.classList.add('fired', 'flash');
      Sound.gunshot(); Sound.ricochet(); buzz([30, 20, 80]);
      setTimeout(() => duel.classList.add('won'), 250);
      const rank = ms < 450 ? 'Fastest gun in Rehab! ⚡' : ms < 900 ? 'Quicker than Clint Eastwood! 🤠' : 'Slow and steady wins the West 🤠';
      say(`BANG! ${ms} ms. ${rank}<br>Back Pain has left town 🐎💨`);
      setTimeout(() => { $('#wanted').classList.add('caught'); Sound.thunk(); }, 1000);
      setTimeout(() => { $('#gift').classList.add('on'); Sound.sparkle(); scrollTo($('#gift'), 'center'); }, 2200);
    }
    tap.addEventListener('pointerdown', e => { e.preventDefault(); fire(); });
    tap.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
    $('#giftbox').addEventListener('click', () => {
      const g = $('#giftbox');
      if (g.classList.contains('open')) return;
      g.classList.add('open');
      Sound.sparkle(); Sound.fanfare(); buzz([30, 40, 60]);
      const [x, y] = centre(g);
      Confetti.burst({ x, y, n: 150, speed: 10 });
      setTimeout(() => {
        $('#gift-inside').hidden = false;
        $('#amigos').classList.add('on');
        finish('western');
      }, 600);
    });
    return {
      leave() {
        run++;
        clearTimeout(timer);
        voice.pause();
        if (state === 'armed' || state === 'draw' || state === 'intro') {
          state = 'idle';
          duel.classList.remove('armed', 'draw');
          btn.hidden = false;
          say('When you see <b>DRAW!</b>, tap the screen as fast as you can.');
        }
      },
    };
  })();

  /* ───────── E8 · Make 78 Great Again ───────── */
  ctrl.rally = (() => {
    const S = screenEl('rally'), crowd = $('#crowd'), cheer = $('#cheer');
    const PEOPLE = ['🙋🏻‍♂️', '🙋🏽‍♀️', '🧔🏻', '👳🏽‍♂️', '👩🏼', '🧕🏽', '👨🏾‍🦳', '👵🏻', '🧑🏻‍🦰', '👴🏽', '🙌🏻', '👱🏻‍♀️', '🧑🏽', '👨🏻‍🦲', '👩🏻‍🦳', '🇺🇸', '🇪🇬'];
    crowd.innerHTML = Array.from({ length: 36 }, (_, k) => `<span style="--d:${rand(0, 0.25).toFixed(2)}s;--r:${rand(-10, 10).toFixed(0)}deg">${PEOPLE[(k * 7 + (k >> 2)) % PEOPLE.length]}</span>`).join('');
    const SIZES = [1000, 25000, 400000, 3000000, 20000000, 78000000];
    let taps = 0, shown = false, numRaf = 0;
    function countTo(el, to) {
      cancelAnimationFrame(numRaf);
      const from = +(el.dataset.v || 0), t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 700);
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        el.textContent = v.toLocaleString('en-US');
        if (k < 1) numRaf = requestAnimationFrame(step); else el.dataset.v = to;
      };
      numRaf = requestAnimationFrame(step);
    }
    cheer.addEventListener('click', () => {
      Sound.unlock();
      taps++;
      restart(crowd, 'cheer');
      Sound.cheer(); Sound.drum(); setTimeout(() => Sound.drum(), 180); buzz(15);
      const chant = $('#chant');
      chant.textContent = taps % 2 ? 'BOBZ!' : 'BOBZ! BOBZ!';
      restart(chant, 'pop');
      countTo($('#crowd-n'), SIZES[Math.min(taps - 1, SIZES.length - 1)]);
      const [x, y] = centre(cheer);
      floaters(x, y - 20, ['📣', '🇺🇸', '🇪🇬', '🎉'], 4);
      if (taps === 4) {
        $('#crowd-note').textContent = '(the biggest crowd in history, period)';
        S.classList.add('hype');
        Confetti.burst({ x: innerWidth / 2, y: innerHeight * 0.3, n: 120, colors: USA_EG });
      }
      if (taps >= 6 && !shown) {
        shown = true;
        $('#crowd-note').textContent = '(78 million. Tremendous.)';
        cheer.textContent = '📣 BOBZ! BOBZ! BOBZ!';
        Sound.fanfare();
        Confetti.burst({ x: innerWidth / 2, y: innerHeight * 0.35, n: 170, speed: 11, colors: USA_EG });
        setTimeout(() => { $('#phone').classList.add('on'); scrollTo($('#phone'), 'start'); chat(); }, 1600);
      }
    });

    const body = $('#wa-body');
    const who = CONFIG.from;
    const MSGS = [
      { day: 'TODAY' },
      { out: true, fwd: true, html: '🇺🇸 MUST WATCH!!! The best speech EVER 🔥🔥🔥 Share with everyone!!!', vid: '12:47', time: '07:02' },
      { name: who, color: '#53bdeb', html: 'Dad, it’s 7am 😂', time: '07:05' },
      { name: who, color: '#53bdeb', html: 'But HAPPY BIRTHDAY BOBZ!!! 🎂🎉 78 and still the best!', time: '07:05' },
      { name: 'Mom', color: '#ff8fab', html: 'Happy birthday Sujooks ❤️🌭', time: '07:09' },
      { sys: '🎂 Everyone in the group reacted with ❤️' },
    ];
    const add = html => { body.insertAdjacentHTML('beforeend', html); body.lastElementChild.scrollIntoView({ block: 'nearest' }); };
    function bubble(m) {
      if (m.day) return `<p class="wa-day">${m.day}</p>`;
      if (m.sys) return `<p class="wa-sys">${m.sys}</p>`;
      return `<div class="wa-msg ${m.out ? 'out' : 'in'}">${m.name ? `<span class="wa-who" style="color:${m.color}">${m.name}</span>` : ''}${m.fwd ? '<span class="wa-fwd">↪ Forwarded many times</span>' : ''}${m.vid ? `<div class="wa-vid">▶<small>${m.vid}</small></div>` : ''}${m.html}<span class="wa-time">${m.time}${m.out ? '<span class="tk">✓✓</span>' : ''}</span></div>`;
    }
    async function chat() {
      for (const m of MSGS) {
        if (m.name) {
          add('<div class="wa-typing"><i></i><i></i><i></i></div>');
          await wait(1100);
          body.lastElementChild.remove();
        } else {
          await wait(600);
        }
        add(bubble(m));
        Sound.waPop();
      }
      await wait(500);
      $('#wa-replies').hidden = false;
      body.lastElementChild.scrollIntoView({ block: 'nearest' });
    }
    let replied = false;
    $$('.wa-quick', S).forEach(q => q.addEventListener('click', async () => {
      if (replied) return;
      replied = true;
      Sound.unlock();
      $('#wa-replies').hidden = true;
      const r = q.dataset.r;
      const d = new Date(), time = '07:1' + (d.getSeconds() % 10);
      if (r === 'fwd') {
        add(bubble({ out: true, fwd: true, html: '🇺🇸 WATCH THIS!!! 🔥🔥', vid: '48:02', time }));
        Sound.waPop();
        await wait(1200);
        add(bubble({ sys: '😂 Not today, Bobz! Today is all about <b>you</b>.' }));
      } else {
        add(bubble({ out: true, html: r === 'thumb' ? '<span style="font-size:40px;line-height:1">👍</span>' : 'Thank you all ❤️', time }));
        Sound.waPop();
        await wait(1100);
        add(bubble({ sys: r === 'thumb' ? 'Classic Dad reply 👍😂' : 'The whole family sends ❤️❤️❤️' }));
      }
      Sound.ok();
      finish('rally');
      setTimeout(() => scrollTo($('.nav', S), 'end'), 700);
    }));
    return {};
  })();

  /* ───────── E8 · The Birthday Special ───────── */
  ctrl.special = (() => {
    const S = screenEl('special');
    const flames = $$('.flame', S);
    let blown = false, stream = null, raf = 0;
    function blowOne(f) {
      if (!f) f = flames.find(x => !x.classList.contains('out'));
      if (!f || f.classList.contains('out')) return;
      f.classList.add('out');
      Sound.blow(); buzz(20);
      $(f.classList.contains('f7') ? '.smoke.s7' : '.smoke.s8', S).classList.add('on');
      if (flames.every(x => x.classList.contains('out'))) celebrate();
    }
    flames.forEach(f => f.addEventListener('click', () => { Sound.unlock(); blowOne(f); }));
    async function celebrate() {
      if (blown) return;
      blown = true;
      stopMic();
      await wait(600);
      $('#blow').hidden = true;
      Sound.happyBirthday(); buzz([40, 60, 40, 60, 80]);
      const [x, y] = centre($('#cake-stage'));
      Confetti.burst({ x, y: y - 40, n: 170, speed: 11, colors: GOLD });
      setTimeout(() => Confetti.burst({ x: innerWidth * 0.2, y: innerHeight * 0.3, n: 70, angle: -1.2, spread: 1.4 }), 500);
      setTimeout(() => Confetti.burst({ x: innerWidth * 0.8, y: innerHeight * 0.3, n: 70, angle: -1.9, spread: 1.4 }), 900);
      $('#hb').classList.add('on');
      await wait(300);
      scrollTo($('#hb'), 'center');
      await wait(2800);
      ['#letter', '.throwback', '#credits', '#end-actions'].forEach(sel => $(sel, S).classList.add('on'));
      finish('special');
    }
    $('#mic').addEventListener('click', async () => {
      Sound.unlock();
      const btn = $('#mic');
      const fallback = msg => { btn.hidden = true; $('#blow-or').textContent = msg; };
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !Sound.ctx) { fallback('Tap the flames to blow them out 🌬️'); return; }
      btn.disabled = true;
      btn.textContent = 'Listening… now blow! 🌬️';
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      } catch (e) {
        fallback('No mic? No problem. Tap the flames 🌬️');
        return;
      }
      const ctx = Sound.ctx;
      if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) { /* ignore */ } }
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      let hot = 0;
      $('#meter-wrap').hidden = false;
      const meter = $('#meter');
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        meter.style.width = Math.min(100, rms * 420) + '%';
        const lean = Math.min(1, rms * 5);
        flames.filter(f => !f.classList.contains('out')).forEach(f => { $('i', f).style.transform = `skewX(${(-lean * 24).toFixed(1)}deg) scale(${(1 - lean * 0.3).toFixed(2)}, ${(1 - lean * 0.45).toFixed(2)})`; });
        if (rms > 0.12) hot++; else hot = Math.max(0, hot - 1);
        if (hot > 9) { hot = 0; blowOne(); }
        if (flames.some(f => !f.classList.contains('out'))) raf = requestAnimationFrame(loop);
      };
      loop();
    });
    function stopMic() {
      cancelAnimationFrame(raf);
      if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ } stream = null; }
      $('#meter-wrap').hidden = true;
    }
    $('#roll').addEventListener('click', () => {
      Sound.unlock();
      const c = $('#credits');
      c.classList.remove('rolling');
      void c.offsetWidth;
      c.classList.add('rolling');
      $('#roll').textContent = '↺ Roll them again';
      Sound.happyBirthday();
    });
    $('#again').addEventListener('click', () => {
      Watched.clear();
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
      location.reload();
    });
    $('#trailer-end').addEventListener('click', () => { Sound.unlock(); Trailer.play(); });
    $('#home-end').addEventListener('click', () => { Sound.unlock(); show('home'); });
    $('#jukebox-end').addEventListener('click', () => openJukebox());
    return { leave: stopMic };
  })();

  /* ───────── Bobz's Jukebox ───────── */
  ctrl.jukebox = (() => {
    const screen = $('#jb-screen'), idle = $('#jb-idle'), now = $('#jb-now'), grid = $('#jb-grid');
    grid.innerHTML = SONGS.map((s, i) => `<button class="jb-rec" type="button" data-i="${i}"><span class="code">${s.code}</span><b>${s.title}</b><small>${s.year} · ${s.note}</small></button>`).join('');
    let frame = null;
    function play(i) {
      const s = SONGS[i];
      stopMedia();
      $$('.jb-rec', grid).forEach((b, k) => b.classList.toggle('on', k === i));
      if (!frame) {
        frame = document.createElement('iframe');
        frame.title = 'Santana on YouTube';
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        screen.appendChild(frame);
      }
      idle.hidden = true;
      frame.src = `https://www.youtube-nocookie.com/embed/${s.yt}?autoplay=1&playsinline=1&rel=0`;
      now.innerHTML = `Now playing: <b>${s.title}</b> · Santana, ${s.year} 🎸`;
    }
    // A player you can't see mustn't keep playing, so the music stops when he leaves
    function stop() {
      if (frame) { frame.remove(); frame = null; }
      idle.hidden = false;
      $$('.jb-rec', grid).forEach(b => b.classList.remove('on'));
      now.textContent = 'Nothing playing yet';
    }
    grid.addEventListener('click', ev => {
      const b = ev.target.closest('.jb-rec');
      if (!b) return;
      Sound.unlock();
      play(+b.dataset.i);
    });
    return { play, leave: stop };
  })();

  /* Deep link for previews, e.g. …/bobz/#western */
  const startKey = decodeURIComponent(location.hash.slice(1));
  if (startKey && startKey !== 'tv' && keys.includes(startKey)) swap(startKey);
  else document.body.dataset.screen = 'tv';

  window.__bobz = { show, swap, Sound, Trailer, Watched };
})();
