/* Flight BD40 · a birthday card for Cookies */
(() => {
  'use strict';

  // Names used all over the card. Change them here.
  const CONFIG = {
    name: 'Cookies',       // main pet name
    alias: 'Nadoodies',    // second pet name
    from: 'Your caveman',  // signature
  };

  document.documentElement.classList.add('js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* no vibration */ } };
  const restart = (el, cls) => { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };
  const scrollTo = (el, block = 'center') => {
    if (!el) return;
    try { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block }); } catch (e) { el.scrollIntoView(); }
  };

  $$('.nm').forEach(el => { el.textContent = CONFIG.name; });
  $$('.nm2').forEach(el => { el.textContent = CONFIG.alias; });
  $$('.sign').forEach(el => { el.textContent = CONFIG.from; });

  /* ───────── Sound (all synthesised, no audio files) ───────── */
  const Sound = (() => {
    let ctx = null, master = null, fx = null, noiseBuf = null;
    let muted = false;
    try { muted = localStorage.getItem('bd40-muted') === '1'; } catch (e) { /* storage blocked */ }

    function init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { return false; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
      // a soft echo that makes chimes sparkle
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.14;
      const fb = ctx.createGain(); fb.gain.value = 0.3;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500;
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
    function noise({ t = 0, dur = 0.2, vol = 0.2, type = 'lowpass', f = 1200, to = 0, q = 0.7 } = {}) {
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
      g.gain.exponentialRampToValueAtTime(vol, s + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      src.connect(fl); fl.connect(g); g.connect(master);
      src.start(s); src.stop(s + dur + 0.05);
    }

    return {
      unlock,
      get ctx() { return ctx; },
      get muted() { return muted; },
      setMuted(m) {
        muted = m;
        try { localStorage.setItem('bd40-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
        if (master) master.gain.value = m ? 0 : 0.6;
      },
      chime() { // cabin "ding-dong"
        tone(659.25, { dur: 1.4, vol: 0.2, echo: 0.4 }); tone(1318.5, { dur: 0.7, vol: 0.03 });
        tone(523.25, { t: 0.42, dur: 1.8, vol: 0.2, echo: 0.4 }); tone(1046.5, { t: 0.42, dur: 0.9, vol: 0.03 });
      },
      pop(n = 0) {
        const f = 660 * Math.pow(2, (n % 10) / 12);
        tone(f, { dur: 0.09, vol: 0.11, type: 'triangle' });
        tone(f * 1.5, { t: 0.06, dur: 0.16, vol: 0.08, type: 'triangle', echo: 0.3 });
      },
      ok() { tone(880, { dur: 0.12, vol: 0.09, type: 'triangle' }); tone(1320, { t: 0.08, dur: 0.2, vol: 0.09, type: 'triangle' }); },
      nope() { tone(233, { dur: 0.28, vol: 0.09, type: 'square', to: 150 }); },
      thunk() { noise({ dur: 0.12, vol: 0.45, f: 900, to: 180 }); tone(95, { dur: 0.18, vol: 0.32, to: 50 }); },
      sparkle() {
        noise({ dur: 0.5, vol: 0.09, type: 'highpass', f: 5200 });
        [0, 0.07, 0.15, 0.24].forEach((t, i) => tone(2300 + i * 430, { t, dur: 0.25, vol: 0.045, echo: 0.5 }));
      },
      squish() { noise({ dur: 0.22, vol: 0.16, type: 'bandpass', f: 800, to: 260, q: 2 }); tone(330, { dur: 0.2, vol: 0.09, to: 140 }); },
      whoosh() { noise({ dur: 0.9, vol: 0.32, type: 'lowpass', f: 2600, to: 250 }); },
      breeze() { noise({ dur: 0.9, vol: 0.05, type: 'bandpass', f: 500, to: 1600, q: 0.6 }); },
      ding() { tone(1760, { dur: 1.2, vol: 0.13, echo: 0.5 }); tone(2637, { dur: 0.8, vol: 0.05 }); },
      chop() { noise({ dur: 0.07, vol: 0.28, f: 2500, type: 'bandpass', q: 1.5 }); tone(170, { dur: 0.1, vol: 0.18, to: 90 }); },
      star(i) { tone(880 * Math.pow(2, (i * 4) / 12), { dur: 0.35, vol: 0.11, type: 'triangle', echo: 0.35 }); },
      charge() { tone(300, { dur: 1.5, vol: 0.05, type: 'triangle', to: 1200 }); },
      fanfare() {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { t: i * 0.09, dur: 0.28, vol: 0.09, type: 'square', echo: 0.2 }));
        [1046.5, 1318.5, 1568].forEach(f => tone(f, { t: 0.42, dur: 1, vol: 0.05, type: 'triangle', echo: 0.4 }));
      },
      peacock(k = 1) { // a nasal little "may-AWW!"
        if (!ok()) return;
        const s = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, s);
        out.gain.exponentialRampToValueAtTime(0.22, s + 0.03);
        out.gain.exponentialRampToValueAtTime(0.03, s + 0.12);
        out.gain.exponentialRampToValueAtTime(0.3, s + 0.18);
        out.gain.setValueAtTime(0.3, s + 0.5);
        out.gain.exponentialRampToValueAtTime(0.0001, s + 0.85);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500 * k; bp.Q.value = 1.6;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
        o1.type = 'sawtooth'; o2.type = 'square';
        [[o1, 0], [o2, 5]].forEach(([o, d]) => {
          o.frequency.setValueAtTime(640 * k + d, s);
          o.frequency.linearRampToValueAtTime(700 * k + d, s + 0.1);
          o.frequency.setValueAtTime(880 * k + d, s + 0.16);
          o.frequency.linearRampToValueAtTime(1010 * k + d, s + 0.3);
          o.frequency.linearRampToValueAtTime(700 * k + d, s + 0.85);
        });
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 38; lg.gain.value = 24 * k;
        lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
        const m2 = ctx.createGain(); m2.gain.value = 0.35;
        o1.connect(bp); o2.connect(m2); m2.connect(bp); bp.connect(lp); lp.connect(out);
        out.connect(master);
        const e = ctx.createGain(); e.gain.value = 0.25; out.connect(e); e.connect(fx);
        [o1, o2, lfo].forEach(o => { o.start(s); o.stop(s + 0.9); });
      },
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

  const muteBtn = $('#mute');
  const syncMute = () => {
    muteBtn.setAttribute('aria-pressed', Sound.muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', Sound.muted ? 'Turn sound on' : 'Mute sound');
  };
  /* ───────── Her song (a real <audio> element, so it also plays nicely on iPhone) ───────── */
  const Music = (() => {
    const a = $('#track');
    const topBtn = $('#musicbtn'), ifeBtn = $('#ife-play'), letterBtn = $('#track-letter');
    const fmt = s => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
    let started = false;
    function sync() {
      const on = !a.paused;
      document.body.classList.toggle('music-on', on);
      ifeBtn.classList.toggle('on', on);
      ifeBtn.setAttribute('aria-label', on ? 'Pause your song' : 'Play your song');
      topBtn.hidden = !started;
      topBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      topBtn.setAttribute('aria-label', on ? 'Pause your song' : 'Play your song');
      letterBtn.textContent = on ? '❚❚ Pause your song' : '🎧 Play your song';
    }
    async function play() {
      started = true;
      a.muted = Sound.muted;
      try { a.volume = 0.7; } catch (e) { /* iPhone ignores volume */ }
      try { await a.play(); } catch (e) { /* blocked or failed to load */ }
      sync();
    }
    function pause() { a.pause(); sync(); }
    const toggle = () => (a.paused ? play() : pause());
    [topBtn, ifeBtn, letterBtn].forEach(b => b.addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); toggle(); }));
    a.addEventListener('play', sync);
    a.addEventListener('pause', sync);
    a.addEventListener('loadedmetadata', () => { $('#ife-dur').textContent = fmt(a.duration); });
    a.addEventListener('timeupdate', () => {
      if (a.duration) $('#ife-fill').style.width = (a.currentTime / a.duration) * 100 + '%';
      $('#ife-cur').textContent = fmt(a.currentTime);
    });
    return { play, pause, get playing() { return !a.paused; }, setMuted(m) { a.muted = m; } };
  })();

  muteBtn.addEventListener('click', () => {
    Sound.unlock();
    Sound.setMuted(!Sound.muted);
    Music.setMuted(Sound.muted);
    syncMute();
    Sound.pop(4);
  });
  syncMute();

  /* ───────── Confetti ───────── */
  const Confetti = (() => {
    const cv = $('#confetti');
    const cx = cv.getContext('2d');
    const COLORS = ['#ff6fab', '#ffc7de', '#f0438e', '#f3d98b', '#e5c065', '#9fd0ff', '#39c6c0', '#ffffff', '#c3a1ff'];
    let parts = [], raf = 0, W = 0, H = 0;
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener('resize', size);
    function heart(s) {
      cx.beginPath();
      cx.moveTo(0, s * 0.35);
      cx.bezierCurveTo(-s, -s * 0.25, -s * 0.45, -s, 0, -s * 0.4);
      cx.bezierCurveTo(s * 0.45, -s, s, -s * 0.25, 0, s * 0.35);
      cx.fill();
    }
    const PETALS = ['#e0245e', '#c2185b', '#ff6fab', '#ff9cc5', '#ff4f7a', '#f7a8c4'];
    function petal(s) {
      cx.beginPath();
      cx.moveTo(0, -s * 0.62);
      cx.bezierCurveTo(s * 0.58, -s * 0.42, s * 0.46, s * 0.5, 0, s * 0.62);
      cx.bezierCurveTo(-s * 0.46, s * 0.5, -s * 0.58, -s * 0.42, 0, -s * 0.62);
      cx.fill();
    }
    function add(p) { parts.push(p); if (!raf) raf = requestAnimationFrame(tick); }
    function burst({ x = W / 2, y = H / 3, n = 120, spread = Math.PI * 2, angle = -Math.PI / 2, speed = 9, hearts = 0.22, petals = 0 } = {}) {
      if (reduced) n = Math.round(n / 3);
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = speed * (0.45 + Math.random() * 0.8);
        add({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.16 + Math.random() * 0.1,
          r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, s: 5 + Math.random() * 6,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          shape: Math.random() < hearts ? 2 : (Math.random() < 0.55 ? 0 : 1), w: Math.random() * 6.28, life: 0,
        });
        if (Math.random() < petals) { const p = parts[parts.length - 1]; p.shape = 3; p.c = PETALS[(Math.random() * PETALS.length) | 0]; p.s += 4; }
      }
    }
    function rain(n = 50, hearts = 0.6, petals = 0) {
      if (reduced) n = Math.round(n / 3);
      for (let i = 0; i < n; i++) {
        add({
          x: Math.random() * W, y: -20 - Math.random() * H * 0.8, vx: (Math.random() - 0.5) * 0.6, vy: 1 + Math.random() * 1.5, g: 0.012,
          r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.08, s: 7 + Math.random() * 7,
          c: COLORS[(Math.random() * 5) | 0], shape: Math.random() < hearts ? 2 : 1, w: Math.random() * 6.28, life: 0,
        });
        if (Math.random() < petals) { const p = parts[parts.length - 1]; p.shape = 3; p.c = PETALS[(Math.random() * PETALS.length) | 0]; }
      }
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
        else if (p.shape === 1) { cx.beginPath(); cx.arc(0, 0, p.s / 2.6, 0, 6.283); cx.fill(); }
        else if (p.shape === 2) heart(p.s * 0.9);
        else petal(p.s);
        cx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(tick);
      else { raf = 0; cx.clearRect(0, 0, W, H); }
    }
    return { burst, rain };
  })();

  function hearts(x, y, n = 6) {
    const chars = ['💗', '💖', '💕', '💞'];
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span');
      h.className = 'heart-float';
      h.textContent = chars[i % chars.length];
      h.style.left = (x + rand(-34, 34) - 11) + 'px';
      h.style.top = (y + rand(-16, 12) - 11) + 'px';
      h.style.setProperty('--dx', rand(-44, 44) + 'px');
      h.style.animationDelay = (i * 55) + 'ms';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1400 + i * 55);
    }
  }
  const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  /* ───────── Fly-through-clouds transition ───────── */
  const Wipe = (() => {
    const root = $('#wipe'), veil = $('.veil', root), clouds = $$('.wc', root);
    let anims = [];
    const clear = () => { anims.forEach(a => a.cancel()); anims = []; };
    const canAnimate = !reduced && typeof root.animate === 'function';
    async function cover() {
      clear();
      root.style.visibility = 'visible';
      if (!canAnimate) { veil.style.opacity = '1'; await wait(220); return; }
      anims = clouds.map((c, k) => c.animate(
        [{ transform: `translateX(${110 + k * 8}vw)` }, { transform: 'translateX(0)' }],
        { duration: 560, delay: k * 35, easing: 'cubic-bezier(.2,.75,.3,1)', fill: 'forwards' }));
      anims.push(veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay: 260, easing: 'ease-in', fill: 'forwards' }));
      await Promise.all(anims.map(a => a.finished)).catch(() => {});
    }
    async function reveal() {
      if (!canAnimate) { veil.style.opacity = '0'; await wait(160); root.style.visibility = 'hidden'; return; }
      const out = clouds.map((c, k) => c.animate(
        [{ transform: 'translateX(0)' }, { transform: `translateX(${-125 - k * 8}vw)` }],
        { duration: 720, delay: 60 + k * 30, easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' }));
      out.push(veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 440, easing: 'ease-out', fill: 'forwards' }));
      anims = anims.concat(out);
      await Promise.all(out.map(a => a.finished)).catch(() => {});
      clear();
      root.style.visibility = 'hidden';
    }
    return { cover, reveal };
  })();

  /* ───────── Scenes ───────── */
  const scenes = $$('.scene');
  const keys = scenes.map(s => s.dataset.key);
  const sceneEl = key => scenes[keys.indexOf(key)];
  const ctrl = {};
  let cur = 0, busy = false;

  function progress() {
    const p = (cur / (scenes.length - 1)) * 100;
    $('#fp-fill').style.width = p + '%';
    $('#fp-plane').style.left = p + '%';
    document.body.dataset.scene = keys[cur];
  }
  function finish(scene) {
    const n = $('.nav .next', scene), s = $('.nav .skip', scene);
    if (n) n.hidden = false;
    if (s) s.hidden = true;
  }
  async function go(i) {
    if (busy || i === cur || i < 0 || i >= scenes.length) return;
    busy = true;
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    const cv = $('#captain-voice');
    if (cv && !cv.paused) cv.pause();
    Sound.breeze();
    await Wipe.cover();
    const leaving = keys[cur];
    scenes[cur].classList.remove('active');
    if (ctrl[leaving] && ctrl[leaving].leave) ctrl[leaving].leave();
    cur = i;
    scenes[cur].classList.add('active');
    scenes[cur].scrollTop = 0;
    progress();
    if (ctrl[keys[cur]] && ctrl[keys[cur]].enter) ctrl[keys[cur]].enter();
    await Wipe.reveal();
    busy = false;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-next]');
    if (!b) return;
    Sound.unlock();
    go(cur + 1);
  });

  /* 1 · Envelope, boarding pass and the ID check */
  ctrl.envelope = (() => {
    const S = $('#s-envelope');
    const bc = $('#barcode');
    let seed = 40;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 58; i++) {
      const b = document.createElement('i');
      const r = rnd();
      b.style.width = (r < 0.25 ? 3 : r < 0.6 ? 2 : 1) + 'px';
      if (rnd() < 0.1) b.style.opacity = '0';
      bc.appendChild(b);
    }

    let opened = false;
    $('#envelope').addEventListener('click', async () => {
      if (opened) return;
      opened = true;
      Sound.unlock(); Sound.pop(5); buzz(15);
      S.classList.add('opened');
      await wait(650);
      S.classList.add('peek'); Sound.sparkle();
      await wait(1150);
      S.classList.add('passing');
      await wait(480);
      $('#env-wrap').hidden = true;
      const pw = $('#pass-wrap');
      pw.hidden = false; pw.classList.add('enter');
      document.body.classList.add('started');
      Sound.chime();
      Confetti.burst({ x: innerWidth / 2, y: innerHeight * 0.3, n: 70, speed: 8 });
    });

    const sheet = $('#idsheet');
    $('#checkin').addEventListener('click', async () => {
      Sound.unlock();
      const btn = $('#checkin');
      if (btn.disabled) return;
      btn.disabled = true;
      sheet.hidden = false;
      await wait(550);
      for (const li of $$('#checks li')) {
        li.classList.add('on');
        if (li.dataset.ok === '1') Sound.ok(); else { Sound.nope(); buzz([30, 40, 30]); }
        await wait(li.dataset.ok === '1' ? 560 : 1000);
      }
      $('#verdict').classList.add('on');
      await wait(700);
      const lm = $('#letmein');
      lm.hidden = false; lm.classList.add('fade-up');
    });
    $('#letmein').addEventListener('click', async () => {
      sheet.hidden = true;
      $('#checkin').hidden = true;
      await wait(250);
      const st = $('#bp-stamp');
      st.classList.add('on'); Sound.thunk(); buzz(40);
      const [x, y] = centre(st);
      Confetti.burst({ x, y, n: 60, speed: 7 });
      await wait(500);
      const b = $('#board'); b.hidden = false; b.classList.add('fade-up');
      scrollTo(b, 'end');
    });
    return {};
  })();

  /* 2 · Seat 1A: window shade, captain's announcement, welcome spritz */
  ctrl.seat = (() => {
    const S = sceneEl('seat');
    const win = $('#window'), shade = $('#shade');
    const CAPTAIN = `Ding-dong! This is your captain speaking… yes, your caveman. UGH. 🦴\nWelcome aboard flight BD40, non-stop from Thirty-nine to Forty. Expect zero turbulence, lots of pink and a completely unreasonable amount of love. Sit back, relax and enjoy the clouds, ${CONFIG.name}.`;
    let open = false, startY = 0, dragging = false, h = 1;

    shade.addEventListener('pointerdown', e => {
      if (open) return;
      dragging = true; startY = e.clientY; h = shade.offsetHeight || 1;
      win.classList.add('dragging');
      try { shade.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    shade.addEventListener('pointermove', e => {
      if (!dragging) return;
      const moved = Math.max(0, startY - e.clientY);
      shade.style.transform = `translateY(${-Math.min(moved, h * 0.93)}px)`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      win.classList.remove('dragging');
      shade.style.transform = '';
      openShade();
    };
    shade.addEventListener('pointerup', endDrag);
    shade.addEventListener('pointercancel', endDrag);
    shade.addEventListener('click', openShade);

    async function openShade() {
      if (open) return;
      open = true;
      Sound.unlock();
      win.classList.add('open');
      shade.tabIndex = -1; shade.setAttribute('aria-hidden', 'true');
      buzz(10);
      await wait(450);
      Sound.chime();
      $('#win-cap').classList.add('on');
      await wait(1000);
      const cap = $('#captain');
      cap.classList.add('on');
      scrollTo(cap, 'center');
      await typeCaptain();
      $('#hear').hidden = false;
      await wait(500);
      const ife = $('#ife');
      ife.classList.add('on');
      await wait(200);
      scrollTo(ife, 'center');
      await wait(700);
      $('#spritz').classList.add('on');
      finish(S);
    }

    async function typeCaptain() {
      const el = $('#cap-text');
      const chars = Array.from(CAPTAIN);
      let skip = false;
      $('#captain').addEventListener('click', () => { skip = true; }, { once: true });
      for (let i = 1; i <= chars.length && !skip; i++) {
        el.textContent = chars.slice(0, i).join('');
        el.insertAdjacentHTML('beforeend', '<span class="caret"></span>');
        const c = chars[i - 1];
        await wait(c === '\n' ? 380 : /[.!?…]/.test(c) ? 240 : 17);
      }
      el.textContent = CAPTAIN;
    }

    const voice = $('#captain-voice');
    let resumeAfterVoice = false;
    voice.addEventListener('ended', () => { if (resumeAfterVoice) { resumeAfterVoice = false; Music.play(); } });
    function speakFallback() {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(`Ugh. This is your captain speaking. Your caveman. Happy birthday, ${CONFIG.name}. Me love you. Ugh.`);
        u.rate = 0.8; u.pitch = 0.1;
        speechSynthesis.speak(u);
      } catch (err) { /* no speech on this device */ }
    }
    $('#hear').addEventListener('click', async e => {
      e.stopPropagation();
      Sound.unlock();
      if (Music.playing) { Music.pause(); resumeAfterVoice = true; }
      voice.muted = Sound.muted;
      try { voice.currentTime = 0; await voice.play(); } catch (err) { speakFallback(); if (resumeAfterVoice) { resumeAfterVoice = false; setTimeout(() => Music.play(), 4000); } }
    });

    let sprayed = false;
    $('#bottle').addEventListener('click', () => {
      Sound.unlock(); Sound.sparkle(); buzz(12);
      const b = $('#bottle');
      restart(b, 'spray');
      const m = $('#mist');
      for (let k = 0; k < 20; k++) {
        const p = document.createElement('i');
        m.appendChild(p);
        const dx = rand(10, 95), dy = rand(-80, -15), sc = rand(0.6, 1.8);
        if (!p.animate) { p.remove(); continue; }
        const a = p.animate(
          [{ transform: 'translate(0,0) scale(.3)', opacity: 0.95 }, { transform: `translate(${dx}px,${dy}px) scale(${sc})`, opacity: 0 }],
          { duration: rand(800, 1400), delay: k * 14, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
        a.onfinish = () => p.remove();
      }
      if (!sprayed) {
        sprayed = true;
        $('#notes-hint').hidden = true;
        const nb = $('#notes-body');
        nb.hidden = false; nb.classList.add('fade-up');
      }
    });
    return {};
  })();

  /* 3 · First class menu */
  ctrl.menu = (() => {
    const S = sceneEl('menu');
    $$('.dish', S).forEach(d => d.addEventListener('click', async () => {
      Sound.unlock();
      const k = d.dataset.dish;
      const reply = $(`.reply[data-for="${k}"]`, S);
      if (d.classList.contains('done') || d.classList.contains('busy')) return;
      if (k !== 'steak') {
        d.classList.add('done'); Sound.pop(3); buzz(8);
        reply.hidden = false;
        return;
      }
      d.classList.add('busy', 'stamped');
      const st = $('#steak-stamp');
      st.className = 'dish-stamp bad'; st.textContent = 'Well done?! 😤';
      restart(st, 'on');
      Sound.nope(); buzz([30, 30, 30]);
      reply.hidden = false; reply.textContent = 'Uh-oh… it came out WELL DONE. Again.';
      await wait(1700);
      st.className = 'dish-stamp good'; st.textContent = 'On the house ✓';
      restart(st, 'on');
      Sound.thunk(); Sound.ok();
      reply.textContent = 'Don’t worry, it’s free. As always 😏';
      const r = d.getBoundingClientRect();
      Confetti.burst({ x: r.right - 60, y: r.top + r.height / 2, n: 45, speed: 6 });
      d.classList.remove('busy'); d.classList.add('done');
      finish(S);
    }));
    return {};
  })();

  /* 4 · Passport stamps + postcards */
  ctrl.passport = (() => {
    const S = sceneEl('passport');
    const mrz = s => s.toUpperCase().replace(/[^A-Z]/g, '<');
    const pad = (s, n) => (s + '<'.repeat(n)).slice(0, n);
    $('#mrz').innerHTML = pad(`P<BD40${mrz(CONFIG.name)}<<${mrz(CONFIG.alias)}`, 44).replace(/</g, '&lt;') + '<br>' +
      pad('4040BD40<<TITANIUM<ELITE<<UPGRADED<ALWAYS', 44).replace(/</g, '&lt;');

    const P = {
      bali: { t: 'Bali 🌺', p: 'Pink frangipani, sunsets and a pool villa. Upgraded, obviously.', art: ['postcard-bali.jpg', 'A painted postcard of a Balinese temple gate at sunset', 'wish you were here 💌'] },
      hk: { t: 'Hong Kong 🌃', p: 'Skyline sparkle, dim sum and a harbour-view suite. Your Rich Girl era.', art: ['postcard-hk.jpg', 'A painted postcard of Victoria Harbour with a red-sailed junk', 'harbour-view suite, please ✨'] },
      london: { t: 'London 💕', p: 'Home of your Loolies & Mayoosh, and the world’s most important squishy exchange.', ph: [['nieces.jpg', 'Loolies & Mayoosh', -3], ['niece-hearts.jpg', 'heart gems 💗', 3]] },
      lampung: { t: 'Lampung 🦚', p: 'Peacocks on our porch, an infinity pool under the stars… and a volcano that couldn’t stop us.', ph: [['lampung-pool.jpg', 'Lampung nights 🌙', -2]] },
      jakarta: { t: 'Jakarta 🌏', p: 'The ground literally shook. We didn’t. Nothing can keep us down.', art: ['postcard-jakarta.jpg', 'A painted postcard of Jakarta’s Monas monument at golden hour', 'still standing 💪'] },
    };
    const sheet = $('#pc-sheet'), card = $('#postcard');
    const done = new Set();
    function show(k) {
      const d = P[k];
      const all = done.size === Object.keys(P).length;
      card.innerHTML =
        `<p class="kicker">Postcard from</p><h3>${d.t}</h3><p class="pc-text">${d.p}</p>` +
        (d.art ? `<figure class="pc-art"><img src="assets/ai/${d.art[0]}" alt="${d.art[1]}"><figcaption>${d.art[2]}</figcaption></figure>` : '') +
        (d.ph ? `<div class="pc-photos">${d.ph.map(([f, c, r]) => `<figure class="polaroid" style="--r:${r}deg"><img src="assets/photos/${f}" alt="${c}"><figcaption>${c}</figcaption></figure>`).join('')}</div>` : '') +
        `<button class="btn" type="button" data-close>${all ? 'All stamped ✈️' : 'Next stamp ›'}</button>`;
      sheet.hidden = false;
    }
    sheet.addEventListener('click', e => {
      if (e.target === sheet || e.target.closest('[data-close]')) {
        sheet.hidden = true;
        if (done.size === Object.keys(P).length) {
          const dn = $('#pp-done');
          if (dn.hidden) { dn.hidden = false; dn.classList.add('fade-up'); finish(S); scrollTo($('.nav', S), 'end'); }
        }
      }
    });
    $$('.slot', S).forEach(sl => sl.addEventListener('click', async () => {
      Sound.unlock();
      const k = sl.dataset.place;
      if (!sl.classList.contains('stamped')) {
        sl.classList.add('stamped'); Sound.thunk(); buzz(35);
        done.add(k);
        await wait(520);
      }
      show(k);
    }));
    return {};
  })();

  /* 5 · Peacock porch + the case of the missing squishies */
  ctrl.peacocks = (() => {
    const S = sceneEl('peacocks');
    const porch = $('#porch'), tail = $('#pk-tail'), pk = $('#pk'), bubble = $('#pk-bubble');
    const NS = 'http://www.w3.org/2000/svg';
    const X = 228, Y = 296;
    let idx = 0;
    [{ n: 17, from: -80, to: 80, s: 1, c0: 100 }, { n: 12, from: -64, to: 64, s: 0.8, c0: 104 }].forEach(L => {
      for (let k = 0; k < L.n; k++) {
        const a = L.from + ((L.to - L.from) * k) / (L.n - 1);
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'fth');
        g.style.setProperty('--a', a + 'deg');
        g.style.setProperty('--s', L.s);
        g.style.setProperty('--c', (L.c0 + k * 1.3) + 'deg');
        g.style.setProperty('--i', idx++);
        g.innerHTML =
          `<path class="f-shaft" d="M${X} ${Y}V${Y - 150}"/>` +
          `<path class="f-barb" d="M${X} ${Y - 16}C${X + 9} ${Y - 70} ${X + 9} ${Y - 118} ${X} ${Y - 136}C${X - 9} ${Y - 118} ${X - 9} ${Y - 70} ${X} ${Y - 16}Z"/>` +
          `<path class="f-vane" d="M${X} ${Y - 126}C${X + 16} ${Y - 140} ${X + 18} ${Y - 163} ${X} ${Y - 178}C${X - 18} ${Y - 163} ${X - 16} ${Y - 140} ${X} ${Y - 126}Z"/>` +
          `<ellipse class="f-e1" cx="${X}" cy="${Y - 155}" rx="8" ry="11"/>` +
          `<ellipse class="f-e2" cx="${X}" cy="${Y - 154}" rx="4.6" ry="6.6"/>` +
          `<ellipse class="f-e3" cx="${X}" cy="${Y - 153}" rx="2.2" ry="3.2"/>`;
        tail.appendChild(g);
      }
    });

    let taps = 0, locked = false;
    const say = t => { bubble.hidden = false; bubble.textContent = t; bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = ''; };
    async function tap() {
      if (locked) return;
      Sound.unlock();
      taps++;
      pk.classList.remove('call');
      requestAnimationFrame(() => pk.classList.add('call'));
      if (taps === 1) {
        tail.classList.add('open'); say('Cahhhh! 🦚'); Sound.peacock(1); buzz(20);
        $('#pk-sub').textContent = 'Again! Tap the peacock 🦚';
      } else if (taps === 2) {
        restart(tail, 'shake'); say(`Cahhh-ppy birthday, ${CONFIG.name}!`); Sound.peacock(1.1); buzz(20);
      } else if (taps === 3) {
        porch.classList.add('squad'); say('The whole porch squad came to sing!');
        Sound.peacock(1); setTimeout(() => Sound.peacock(1.22), 260); setTimeout(() => Sound.peacock(0.88), 520);
        $$('.bubble.mini', porch).forEach(b => { b.hidden = false; });
        $('#pk-sub').textContent = 'One more tap… 👀';
      } else if (taps === 4) {
        locked = true;
        $$('.bubble.mini', porch).forEach(b => { b.hidden = true; });
        restart(tail, 'shake');
        porch.classList.add('found');
        Sound.squish();
        await wait(900);
        say('…wait. Is that a SQUISHY?! 🔍'); buzz([20, 40, 20]);
        await wait(1500);
        const cf = $('#casefile');
        cf.hidden = false;
        $('#pk-sub').textContent = 'Case closed 🔍';
        await wait(150);
        scrollTo(cf, 'start');
      }
    }
    porch.addEventListener('click', tap);
    porch.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });

    const sq = $('#squishy');
    let squeezes = 0, pressed = false;
    const press = () => { pressed = true; Sound.unlock(); sq.classList.add('pressed'); Sound.squish(); buzz(15); };
    const release = () => {
      if (!pressed) return;
      pressed = false;
      sq.classList.remove('pressed');
      const r = sq.getBoundingClientRect();
      hearts(r.left + r.width / 2, r.top + r.height * 0.3, 5);
      squeezes++;
      if (squeezes === 3) {
        $('#sq-hint').textContent = 'Squishy officially returned to its rightful owner 💗 (Still innocent, by the way.)';
        finish(S);
      }
    };
    sq.addEventListener('pointerdown', press);
    sq.addEventListener('pointerup', release);
    sq.addEventListener('pointerleave', release);
    sq.addEventListener('pointercancel', release);
    sq.addEventListener('contextmenu', e => e.preventDefault());
    sq.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(); setTimeout(release, 220); } });
    return {};
  })();

  /* 6 · Lampung friends: feed the turtle, and the cockatoo who fell for me */
  ctrl.friends = (() => {
    const S = sceneEl('friends');
    const nom = $('#nom'), feed = $('#feed'), treply = $('#turtle-reply');
    let fed = 0, talking = false, answered = false;
    feed.addEventListener('click', async () => {
      if (talking) return;
      Sound.unlock();
      fed++;
      // a leaf flies to the turtle
      const photo = $('img', nom.parentElement);
      const [fx, fy] = centre(feed), [tx, ty] = centre(photo);
      const leaf = document.createElement('span');
      leaf.className = 'fly-leaf'; leaf.textContent = '🥬';
      leaf.style.left = (fx - 15) + 'px'; leaf.style.top = (fy - 15) + 'px';
      document.body.appendChild(leaf);
      if (leaf.animate) {
        await leaf.animate([{ transform: 'translate(0,0) rotate(0) scale(1)' }, { transform: `translate(${tx - fx}px, ${ty - fy - 30}px) rotate(200deg) scale(.7)` }],
          { duration: 650, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'forwards' }).finished.catch(() => {});
      }
      leaf.remove();
      Sound.chop(); setTimeout(() => Sound.chop(), 180); setTimeout(() => Sound.chop(), 360); buzz([15, 40, 15]);
      nom.hidden = false;
      nom.textContent = ['Nom nom nom 🥬', 'More please… 🐢', 'Nom. Nom. NOM. 💚'][Math.min(fed, 3) - 1];
      nom.style.animation = 'none'; void nom.offsetWidth; nom.style.animation = '';
      hearts(tx, ty, 4);
      if (fed === 3) {
        talking = true;
        feed.disabled = true;
        await wait(900);
        treply.hidden = false;
        treply.classList.add('turtle-talk');
        const msg = `t h a n k   y o u ,   ${CONFIG.name.toLowerCase().split('').join(' ')}`;
        for (let i = 1; i <= msg.length; i++) { treply.textContent = msg.slice(0, i); await wait(msg[i - 1] === ' ' ? 60 : 170); }
        await wait(500);
        treply.classList.remove('turtle-talk');
        treply.textContent = `“Thank you, ${CONFIG.name}.” (He talks slowly. He’s been rehearsing that since Lampung.)`;
        feed.textContent = 'Best friends forever 🐢💚';
      }
    });
    $$('#choices .chip').forEach(b => b.addEventListener('click', async () => {
      if (answered) return;
      answered = true;
      Sound.unlock();
      b.classList.add('picked');
      $('#choices').classList.add('done');
      const r = $('#jealous-reply');
      r.hidden = false;
      if (b.dataset.j === 'yes') {
        r.textContent = 'Good. That means you love me 😌 Don’t worry: my shoulder, my heart and my (terrible) squishy-finding skills all belong to you.';
        Sound.peacock(1.45);
      } else {
        r.textContent = 'Correct. Nobody competes with you. Not even a very fluffy cockatoo. (He took it badly 🦜💔)';
        Sound.nope();
      }
      buzz([20, 30, 20]);
      await wait(900);
      const hello = $('#hello');
      hello.hidden = false;
      finish(S);
      await wait(300);
      scrollTo($('.nav', S), 'end');
    }));
    return {};
  })();

  /* 7 · Level 40 */
  ctrl.level = (() => {
    const S = sceneEl('level');
    const ACH = [
      ['✈️', 'Globetrotter', 'Flew business & first class around the world'],
      ['🏨', 'Titanium Elite', 'Marriott Bonvoy’s top tier. Suite upgrades: always.'],
      ['🌺', 'Island Girl', 'Bali, Lampung & beyond'],
      ['🌃', 'City Lights', 'Took Hong Kong by storm'],
      ['🌋', 'Volcano Survivor', 'An eruption near Lampung? Handled.'],
      ['🌏', 'Unshakeable', 'Survived an earthquake in Jakarta'],
      ['🎧', 'Genre Inventor', 'Created Arabic × UK garage on Suno'],
      ['💕', 'Best Auntie Ever', 'Adored by Loolies & Mayoosh'],
      ['🧸', 'Squishy Diplomat', 'Runs an international squishy exchange'],
      ['🦚', 'Peacock Whisperer', 'Peacocks lined up on your porch to say hi'],
      ['🐢', 'Turtle Feeder', 'Fed a giant turtle by hand. He’s still talking about it (slowly).'],
      ['🥩', 'Free Steak Legend', 'Sent back a well-done steak. Paid nothing. Repeatedly.'],
      ['🌶️', 'Spice Warrior', 'Took on laksa & satay. Bravely. Tearfully.'],
      ['🤠', 'Outlaw', 'Rode with Arthur Morgan'],
      ['🍳', 'Kitchen Chaos', 'Survived Overcooked (and your co-chefs)'],
      ['🛂', 'Head Bouncer', 'Said “Not Tonight” like a pro'],
      ['🌸', 'Scent Sommelier', 'Knows her Dior from her Chanel'],
      ['🌷', 'Bouquet Boss', 'Peonies, roses & tulips. Pink or red only. White need not apply.'],
      ['🦴', 'Caveman Tamer', 'Made one caveman fall hopelessly in love'],
    ];
    $('#g-count').textContent = ACH.length;
    let started = false;
    $('#loadsave').addEventListener('click', async () => {
      if (started) return;
      started = true;
      Sound.unlock(); Sound.pop(0);
      const btn = $('#loadsave');
      btn.disabled = true; btn.textContent = 'Loading…';
      const g = $('#game');
      g.hidden = false;
      await wait(150);
      scrollTo(g, 'start');
      await wait(450);
      $('#g-fill').style.width = '100%';
      Sound.charge();
      await wait(1700);
      $('#g-lv').textContent = 'LV 40!';
      $('#g-levelup').hidden = false;
      Sound.fanfare(); buzz([30, 30, 60]);
      Confetti.burst({ x: innerWidth / 2, y: innerHeight * 0.35, n: 90 });
      btn.hidden = true;
      await wait(900);
      const ul = $('#g-ach');
      for (let i = 0; i < ACH.length; i++) {
        const [ico, title, desc] = ACH[i];
        const li = document.createElement('li');
        li.innerHTML = `<span class="g-ico" aria-hidden="true">${ico}</span><span class="g-txt"><b>${title}</b><span>${desc}</span></span><span class="g-trophy" aria-hidden="true">🏆</span>`;
        ul.appendChild(li);
        Sound.pop(i);
        try { li.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
        await wait(360);
      }
      $('#g-foot').hidden = false;
      await wait(450);
      $('#g-note').hidden = false;
      finish(S);
      await wait(100);
      scrollTo($('.nav', S), 'end');
    });
    return {};
  })();

  /* 8 · The 40+ Club */
  ctrl.club = (() => {
    const S = sceneEl('club');
    const CLUB = [
      [40, '✈️', 'Isabella Bird set off to see the world (Hawaii, the Rockies, Japan) and became a legendary explorer.'],
      [40, '👰', 'Vera Wang designed her very first wedding dress: her own. Now she’s the queen of bridal.'],
      [43, '🚀', 'Katherine Johnson checked the maths that sent John Glenn into orbit.'],
      [45, '📖', 'J.R.R. Tolkien published <i>The Hobbit</i>.'],
      [45, '🎬', 'Samuel L. Jackson became a star with <i>Pulp Fiction</i>.'],
      [46, '🎤', 'Gwen Stefani got her first solo #1 album.'],
      [48, '🍜', 'Momofuku Ando invented instant noodles.'],
      [49, '🍳', 'Julia Child published her first cookbook.'],
      [53, '🏛️', 'Zaha Hadid became the first woman to win the Pritzker Prize for architecture.'],
      [76, '📚', 'Naguib Mahfouz won the Nobel Prize in Literature.'],
    ];
    const wrap = $('#flips');
    CLUB.forEach(([age, emo, txt]) => wrap.insertAdjacentHTML('beforeend',
      `<button class="flip" type="button" aria-label="At ${age}. Tap to flip."><span class="flip-in"><span class="face front"><span class="at">At</span><span class="age">${age}</span><span class="emo" aria-hidden="true">${emo}</span></span><span class="face back"><span class="bt">${txt}</span></span></span></button>`));
    wrap.insertAdjacentHTML('beforeend',
      `<button class="flip special" type="button" aria-label="And at 40… tap to see who."><span class="flip-in"><span class="face front"><span class="at">And at</span><span class="age">40</span><span class="tap">tap to see who ✨</span></span><span class="face back"><span class="bt"><b>You.</b> Just getting started.<br>The best chapters are still ahead 💗</span></span></span></button>`);
    let celebrated = false;
    $$('.flip', wrap).forEach(f => f.addEventListener('click', () => {
      Sound.unlock();
      const on = f.classList.toggle('on');
      Sound.pop(on ? 7 : 2);
      if (f.classList.contains('special') && on && !celebrated) {
        celebrated = true;
        const [x, y] = centre(f);
        Confetti.burst({ x, y, n: 120, speed: 9 });
        Sound.fanfare(); buzz([30, 30, 60]);
        setTimeout(() => {
          $('#arthur').classList.add('on');
          finish(S);
          scrollTo($('#arthur'), 'center');
        }, 1000);
      }
    }));
    return {};
  })();

  /* 9 · Count your blessings */
  ctrl.blessings = (() => {
    const S = sceneEl('blessings');
    const B = [
      'We’re alive. A volcano and an earthquake tried, and here we are.',
      'Your health, your laugh and your beautiful heart.',
      'Loolies & Mayoosh, and every squishy ever swapped.',
      'Every flight above the clouds, and every single upgrade.',
      'Peacock mornings on our porch in Lampung.',
      'Cute nieces that adore you, and a caveman too!',
      'Forty whole years of you in this world.',
      'Your music, your style, your sparkle.',
      'Us. Always us.',
    ];
    // x%, y%, width%, cloud shape
    const POS = [[3, 3, 38, 'a'], [55, 5, 40, 'b'], [27, 20, 36, 'a'], [66, 27, 31, 'c'], [2, 36, 36, 'b'], [41, 42, 38, 'a'], [71, 53, 27, 'b'], [7, 58, 34, 'c'], [45, 66, 34, 'a']];
    const sky = $('#blsky');
    const clouds = POS.map(([x, y, w, shape], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bcloud';
      b.setAttribute('aria-label', `Blessing ${i + 1}`);
      b.style.cssText = `--x:${x}%;--y:${y}%;--w:${w}%;--bd:${(2.6 + (i % 4) * 0.5).toFixed(1)}s`;
      b.innerHTML = `<svg viewBox="0 0 220 120" aria-hidden="true"><use href="#cloud-${shape}"/></svg><span class="spark" aria-hidden="true">✨</span>`;
      sky.appendChild(b);
      return b;
    });
    let n = 0, toastT = 0;
    function toast(t) {
      const old = $('.bl-toast', sky);
      if (old) old.remove();
      const el = document.createElement('div');
      el.className = 'bl-toast';
      el.innerHTML = `<small>Alhamdulillah for…</small>${t}`;
      sky.appendChild(el);
      clearTimeout(toastT);
      toastT = setTimeout(() => el.remove(), 4200);
    }
    clouds.forEach((c, i) => c.addEventListener('click', async () => {
      Sound.unlock();
      toast(B[i]);
      if (c.classList.contains('done')) return;
      c.classList.add('done');
      n++;
      Sound.pop(n + 2); buzz(10);
      $('#bl-count').textContent = `${n} / ${B.length}`;
      const list = $('#bl-list');
      list.hidden = false;
      $('#bl-ul').insertAdjacentHTML('beforeend', `<li>${B[i]}</li>`);
      if (n === B.length) {
        await wait(1500);
        const fin = $('#bl-final');
        fin.hidden = false;
        Sound.chime(); buzz([20, 40, 20]);
        const [x, y] = centre(sky);
        Confetti.burst({ x, y, n: 90, speed: 8, hearts: 0.4 });
        finish(S);
        await wait(200);
        scrollTo(fin, 'center');
      }
    }));
    return {};
  })();

  /* 10 · Overcooked: build the cake, then blow out the candles */
  ctrl.cake = (() => {
    const S = $('#s-cake');
    const NS = 'http://www.w3.org/2000/svg';
    const svg = (tag, attrs, parent) => {
      const el = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
      if (parent) parent.appendChild(el);
      return el;
    };
    const f1 = n => n.toFixed(1);
    function dripPath(cx, cy, rx, ry, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = Math.PI - (Math.PI * i) / n;
        pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
      }
      let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
      for (let i = 0; i < n; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        const L = [14, 22, 10, 18, 26, 12, 20][i % 7];
        d += `C${f1(x1)} ${f1(y1 + L)} ${f1(x2)} ${f1(y2 + L)} ${f1(x2)} ${f1(y2)}`;
      }
      d += `A${rx} ${ry} 0 0 0 ${f1(pts[0][0])} ${f1(pts[0][1])}Z`;
      return d;
    }
    $('#ck-drip1').setAttribute('d', dripPath(150, 178, 104, 15, 12));
    $('#ck-drip2').setAttribute('d', dripPath(150, 118, 68, 11, 8));
    const ros = $('#ck-rosettes');
    const rosettes = (cx, cy, rx, ry, n) => {
      for (let i = 0; i <= n; i++) {
        const t = Math.PI - (Math.PI * i) / n;
        const x = cx + rx * Math.cos(t), y = cy + ry * Math.sin(t);
        const red = i % 2 === 1;
        svg('circle', { cx: f1(x), cy: f1(y), r: 6.6, fill: red ? '#e0457a' : '#ff8fbd' }, ros);
        svg('path', { d: `M${f1(x - 3.4)} ${f1(y + 0.6)}a3.5 3.5 0 1 1 3.5 3.1a2.3 2.3 0 1 1-2-2.3a1 1 0 1 1 1 1`, fill: 'none', stroke: red ? '#a3164a' : '#e2558f', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, ros);
      }
    };
    rosettes(150, 262, 104, 15, 14);
    rosettes(150, 180, 68, 11, 9);

    const candy = $('#ck-candy-l');
    const COLORS = ['#ffd166', '#7bdff2', '#b8f2e6', '#ff4f9a', '#c3a1ff', '#ffffff', '#8be38b'];
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const sprinkle = (cx, topY, botY, rx, ry, n) => {
      for (let i = 0; i < n; i++) {
        const x = cx - rx + 12 + rnd() * (2 * rx - 24);
        const dy = ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
        const y = topY + dy + 26 + rnd() * (botY - topY - 40);
        svg('rect', { x: f1(x - 3.5), y: f1(y - 1.3), width: 7, height: 2.6, rx: 1.3, fill: COLORS[(rnd() * COLORS.length) | 0], transform: `rotate(${(rnd() * 180) | 0} ${f1(x)} ${f1(y)})` }, candy);
      }
    };
    sprinkle(150, 178, 262, 104, 15, 34);
    sprinkle(150, 118, 180, 68, 11, 16);
    const heart = (x, y, s, c) => svg('path', { d: `M${x} ${y + s * 0.35}C${x - s} ${y - s * 0.25} ${x - s * 0.45} ${y - s} ${x} ${y - s * 0.4}C${x + s * 0.45} ${y - s} ${x + s} ${y - s * 0.25} ${x} ${y + s * 0.35}Z`, fill: c }, candy);
    heart(100, 115, 9, '#ff4f9a'); heart(204, 114, 8, '#c3a1ff'); heart(66, 184, 9, '#ff4f9a'); heart(236, 184, 9, '#ffd166');
    [[90, 190], [212, 191]].forEach(([x, y]) => {
      svg('path', { d: `M${x} ${y}v-22`, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, candy);
      svg('circle', { cx: x, cy: y - 28, r: 9, fill: '#7bdff2' }, candy);
      svg('path', { d: `M${x} ${y - 28}m-5 0a5 5 0 1 1 5 5a3 3 0 1 1 -3 -3`, stroke: '#fff', 'stroke-width': 2, fill: 'none' }, candy);
    });
    // a little white peacock feather tucked into the top tier
    const fe = svg('g', { transform: 'rotate(26 206 118)' }, candy);
    svg('path', { d: 'M206 118V70', stroke: '#e5dfd6', 'stroke-width': 1.6 }, fe);
    svg('path', { d: 'M206 84c9-8 10-20 0-28-10 8-9 20 0 28z', fill: '#fff', stroke: '#dcd3c8' }, fe);
    svg('ellipse', { cx: 206, cy: 71, rx: 4.5, ry: 6.5, fill: '#e2f4f2' }, fe);
    svg('ellipse', { cx: 206, cy: 71.5, rx: 2.4, ry: 3.6, fill: '#fbe3ee' }, fe);
    svg('path', { d: 'M152 121l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z', fill: '#ffd166' }, candy);

    const layers = ['#ck-sponge-l', '#ck-cream-l', '#ck-candy-l', '#ck-candle-l'].map(s => $(s));
    const words = ['Chop chop!', 'Whisk whisk!', 'Sprinkle!', 'Light it up!'];
    const sts = $$('.st', S);
    const counter = $('#counter');
    let step = 0;
    const pow = t => { const p = $('#pow'); p.textContent = t; restart(p, 'on'); };
    sts.forEach((b, i) => b.addEventListener('click', async () => {
      if (i !== step) return;
      Sound.unlock();
      b.classList.remove('ready'); b.classList.add('used'); b.disabled = true;
      layers[i].classList.add('on');
      Sound.chop(); buzz(15);
      pow(words[i]);
      step++;
      if (step < sts.length) { sts[step].disabled = false; sts[step].classList.add('ready'); return; }
      await wait(1000);
      Sound.ding();
      $('#stations').hidden = true;
      const ou = $('#orderup');
      ou.hidden = false;
      const stars = $$('.stars i', ou);
      for (let k = 0; k < 3; k++) { await wait(380); stars[k].classList.add('on'); Sound.star(k); }
      await wait(1000);
      resumeSong = Music.playing;
      if (resumeSong) Music.pause();
      S.classList.add('dim');
      counter.classList.add('lit', 'blowable');
      ou.hidden = true;
      $('#blow').hidden = false;
      await wait(100);
      scrollTo(counter, 'center');
    }));

    let resumeSong = false;
    counter.addEventListener('click', () => { if (counter.classList.contains('blowable')) blowOne(); });
    function blowOne() {
      const f = $$('.flame:not(.out)', S)[0];
      if (!f) return;
      f.classList.add('out');
      Sound.whoosh(); buzz(20);
      $(f.classList.contains('f1') ? '.smoke.s1' : '.smoke.s2', S).classList.add('on');
      if (!$$('.flame:not(.out)', S).length) celebrate();
    }
    async function celebrate() {
      stopMic();
      counter.classList.remove('blowable');
      await wait(800);
      S.classList.remove('dim');
      counter.classList.remove('lit');
      $('#blow').hidden = true;
      $('#ticket').hidden = true;
      const hb = $('#hb');
      hb.hidden = false;
      Sound.happyBirthday(); buzz([40, 60, 40, 60, 80]);
      if (resumeSong) setTimeout(() => { if (!Music.playing) Music.play(); }, 11500);
      const [x, y] = centre(counter);
      Confetti.burst({ x, y: y - 40, n: 160, speed: 11 });
      setTimeout(() => Confetti.burst({ x: innerWidth * 0.2, y: innerHeight * 0.3, n: 70, angle: -1.2, spread: 1.4 }), 500);
      setTimeout(() => Confetti.burst({ x: innerWidth * 0.8, y: innerHeight * 0.3, n: 70, angle: -1.9, spread: 1.4 }), 900);
      finish(S);
      await wait(300);
      scrollTo(hb, 'center');
    }

    let stream = null, raf = 0;
    $('#mic').addEventListener('click', async () => {
      Sound.unlock();
      const btn = $('#mic');
      const fallback = msg => { btn.hidden = true; $('#blow-or').textContent = msg; };
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !Sound.ctx) { fallback('Tap the flames to blow them out 🌬️'); return; }
      btn.disabled = true; btn.textContent = 'Listening… now blow! 🌬️';
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
        $$('.flame:not(.out)', S).forEach(f => { f.style.transform = `skewX(${(-lean * 24).toFixed(1)}deg) scale(${(1 - lean * 0.3).toFixed(2)}, ${(1 - lean * 0.45).toFixed(2)})`; });
        if (rms > 0.12) hot++; else hot = Math.max(0, hot - 1);
        if (hot > 9) { hot = 0; blowOne(); }
        if ($$('.flame:not(.out)', S).length) raf = requestAnimationFrame(loop);
      };
      loop();
    });
    function stopMic() {
      cancelAnimationFrame(raf);
      if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ } stream = null; }
      $('#meter-wrap').hidden = true;
    }
    return { leave: stopMic };
  })();

  /* 11 · The letter */
  ctrl.letter = (() => {
    const S = sceneEl('letter');
    const ps = $$('#letter-body p');
    let io = null;
    function enter() {
      Confetti.rain(36, 0.35, 0.5);
      if ('IntersectionObserver' in window) {
        if (io) io.disconnect();
        io = new IntersectionObserver(entries => entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        }), { root: S, threshold: 0.15 });
        ps.forEach(p => io.observe(p));
      } else ps.forEach(p => p.classList.add('in'));
    }
    const bq = $('#bq');
    bq.addEventListener('click', () => {
      if (bq.classList.contains('open')) return;
      Sound.unlock(); Sound.sparkle(); buzz([20, 40, 20]);
      bq.classList.add('open');
      bq.setAttribute('aria-label', 'Your flowers');
      const [x, y] = centre(bq);
      Confetti.burst({ x, y, n: 90, speed: 8, hearts: 0.15, petals: 0.75 });
      setTimeout(() => { $('#bq-note').classList.add('on'); }, 700);
    });

    const hug = $('#hug');
    let timer = 0, hugged = false;
    const start = () => {
      if (hugged) return;
      Sound.unlock();
      hug.classList.add('holding'); buzz(10);
      timer = setTimeout(done, 1300);
    };
    const cancel = () => { if (hugged) return; clearTimeout(timer); hug.classList.remove('holding'); };
    function done() {
      hugged = true;
      hug.classList.remove('holding'); hug.classList.add('done');
      $('.hug-label', hug).textContent = 'Hug received 💞';
      const m = $('#hug-msg'); m.hidden = false;
      Sound.chime(); buzz([40, 60, 40]);
      const [x, y] = centre(hug);
      hearts(x, y - 10, 10);
      Confetti.burst({ x, y, n: 60, speed: 7, hearts: 0.9 });
    }
    hug.addEventListener('pointerdown', start);
    hug.addEventListener('pointerup', cancel);
    hug.addEventListener('pointerleave', cancel);
    hug.addEventListener('pointercancel', cancel);
    hug.addEventListener('contextmenu', e => e.preventDefault());
    hug.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start(); } });
    hug.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') cancel(); });
    // Her Suno song shouldn't keep playing under John Mayer
    $$('.song-link').forEach(a => a.addEventListener('click', () => Music.pause()));
    $('#replay').addEventListener('click', () => {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
      location.reload();
    });
    return { enter };
  })();

  /* Deep link for previews, e.g. …/#peacocks */
  const startKey = decodeURIComponent(location.hash.slice(1));
  if (startKey && startKey !== 'envelope' && keys.includes(startKey)) {
    scenes[0].classList.remove('active');
    cur = keys.indexOf(startKey);
    scenes[cur].classList.add('active');
    document.body.classList.add('started');
    if (ctrl[startKey] && ctrl[startKey].enter) ctrl[startKey].enter();
  }
  progress();

  window.__card = { go, get scene() { return keys[cur]; }, keys, CONFIG };
})();
