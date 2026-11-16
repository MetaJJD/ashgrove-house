/* Greywater — sound (generated in the browser, no audio files) and first-game hints. Loaded after ui.js. */
const Snd = {
  ctx: null, master: null, amb: null, tension: 0,
  ok() { return !!this.ctx && this.ctx.state === 'running'; },
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      this.ctx = new C(); audioCtx = this.ctx;
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.sync();
    } catch (e) {}
  },
  noise(sec) { const c = this.ctx, b = c.createBuffer(1, Math.max(1, c.sampleRate * sec | 0), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; },
  env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); },
  tone(f, t, dur, peak, type = 'sine', to = null) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur); this.env(g, t, 0.02, peak, dur); o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.1); },
  burst(t, dur, peak, freq, q = 1, type = 'bandpass') { const c = this.ctx, n = this.noise(dur + 0.05), f = c.createBiquadFilter(), g = c.createGain(); f.type = type; f.frequency.value = freq; f.Q.value = q; this.env(g, t, 0.005, peak, dur); n.connect(f).connect(g).connect(this.master); n.start(t); },
  play(name) {
    if (!SET.sound || !this.ok() || document.hidden) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'dice': for (let i = 0; i < 6; i++) this.burst(t + i * 0.07 + Math.random() * 0.03, 0.05, 0.22, 1800 + Math.random() * 1800, 3); break;
      case 'pass': this.tone(523, t, 0.25, 0.1); this.tone(784, t + 0.1, 0.4, 0.1); break;
      case 'fail': this.tone(196, t, 0.45, 0.12, 'triangle', 130); break;
      case 'step': this.burst(t, 0.09, 0.2, 140, 1, 'lowpass'); this.burst(t + 0.16, 0.09, 0.16, 120, 1, 'lowpass'); break;
      case 'door': { const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(115, t + 0.5); o.frequency.linearRampToValueAtTime(62, t + 1.0); f.type = 'bandpass'; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1500, t + 0.9); f.Q.value = 9; this.env(g, t, 0.08, 0.16, 1.0); o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + 1.2); this.burst(t + 1.0, 0.12, 0.2, 180, 1, 'lowpass'); break; }
      case 'sting': [110, 155.6, 233, 329.6].forEach((f, i) => this.tone(f, t + i * 0.015, 1.4, 0.09, 'sawtooth', f * 0.94)); this.burst(t, 0.5, 0.12, 3000, 0.7, 'highpass'); break;
      case 'gong': this.tone(65, t, 3.2, 0.3); this.tone(98.5, t, 2.6, 0.12); this.tone(163, t, 1.8, 0.06); this.burst(t, 0.6, 0.1, 400, 0.5); break;
      case 'chime': [880, 1318, 1760, 2637].forEach((f, i) => this.tone(f, t + i * 0.09, 1.6, 0.07)); break;
      case 'reveal': [146.8, 220, 293.7, 440].forEach((f, i) => this.tone(f, t + i * 0.25, 2.8, 0.09, 'triangle')); break;
      case 'hurt': this.burst(t, 0.18, 0.3, 220, 1, 'lowpass'); this.tone(90, t, 0.3, 0.2, 'sine', 50); break;
      case 'win': [261.6, 329.6, 392, 523.3].forEach((f, i) => this.tone(f, t + i * 0.22, 3, 0.1, 'triangle')); break;
      case 'lose': [220, 207.7, 174.6, 110].forEach((f, i) => this.tone(f, t + i * 0.4, 3, 0.12, 'sawtooth')); break;
    }
  },
  // ambience: a low drone that never stops, and the hymn — a held chord that swells as the night runs out
  startAmb() {
    if (this.amb || !this.ok()) return;
    const c = this.ctx, out = c.createGain(); out.gain.value = 0.0001; out.connect(this.master);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; lp.connect(out);
    const dr = [55, 55.4, 82.6].map(f => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; g.gain.value = 0.11; o.connect(g).connect(lp); o.start(); return o; });
    const wind = this.noise(4); wind.loop = true; const wf = c.createBiquadFilter(), wg = c.createGain(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6; wg.gain.value = 0.035; wind.connect(wf).connect(wg).connect(out); wind.start();
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 160; lfo.connect(lg).connect(wf.frequency); lfo.start();
    const hymn = c.createGain(); hymn.gain.value = 0.0001; hymn.connect(out);
    const hv = [220, 261.6, 329.6, 440].map((f, i) => { const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain(); o.type = 'sine'; o.frequency.value = f; v.frequency.value = 4.2 + i * 0.5; vg.gain.value = f * 0.006; v.connect(vg).connect(o.frequency); g.gain.value = 0.2 / (i + 1); o.connect(g).connect(hymn); o.start(); v.start(); return [o, v]; }).flat();
    out.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 3);
    this.amb = {out, hymn, nodes: [...dr, wind, lfo, ...hv]};
    this.setTension(this.tension);
  },
  stopAmb() {
    const a = this.amb; if (!a) return; this.amb = null;
    try { a.out.gain.cancelScheduledValues(this.ctx.currentTime); a.out.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4); setTimeout(() => { a.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); a.out.disconnect(); }, 1800); } catch (e) {}
  },
  setTension(x) { this.tension = Math.max(0, Math.min(1, x || 0)); if (this.amb) this.amb.hymn.gain.setTargetAtTime(0.0001 + 0.5 * Math.pow(this.tension, 1.6), this.ctx.currentTime, 2.5); },
  sync() {
    const want = SET.ambience && G.screen === 'game' && G.S && G.S.phase === 'play' && !document.hidden;
    if (want) { this.startAmb(); if (G.S) this.setTension(G.S.threat / (G.S.threatMax || 15)); } else this.stopAmb();
  },
};
document.addEventListener('pointerdown', () => { Snd.init(); Snd.sync(); }, true);
document.addEventListener('visibilitychange', () => Snd.sync());

// ----------------------------------------------------------- first-game hints
const HINTS = {
  start: ['Your first turn', 'Tap “Begin turn” on one of your investigators. Take turns in any order. Each turn gives 2 actions (the two candles).'],
  turn: ['Acting', 'Tokens on the board are your actions: 🔍 Search, ❗ Interact, and the door token Explores a new room. Tap one in your own space. To walk, tap Move, then a highlighted space (up to 2 spaces per action).'],
  dice: ['Reading the dice', '✦ is a success. 🔍 can be turned into a success by spending one of your Clues. Blank faces do nothing.'],
  mythos: ['The Mythos phase', 'When everyone has acted, the house takes its turn: one event, then monsters move and attack, then anyone near a monster checks their nerve.'],
  monster: ['A monster', 'Tap a monster to see its stats. If one shares your space, you must pass an evade test before doing anything except attacking it.'],
  dark: ['Darkness', 'The moon marks a dark space. There you cannot spend Clues on dice unless someone in or next to your space carries a light (lamp, lantern, matches).'],
  evidence: ['Evidence', 'Find 3 pieces of evidence to learn what you must do to escape. The Journal (top right) keeps your goal and your leads.'],
  reveal: ['Act II', 'You now have a goal. It is shown in the top bar, and the Journal explains the steps. The night is running out — you cannot see how long is left, but you can hear it.'],
  hurt: ['Wounded and Insane', 'When Damage reaches Health you become Wounded; when Horror reaches Sanity you go Insane and draw a secret card. If either happens a second time, that investigator is lost.'],
  fire: ['Fire', 'Entering or acting in a burning space costs 1 Damage. Fire can spread, but it also gives light and hurts monsters. Use Extinguish from your investigator’s card to fight it.'],
};
const Hint = {
  seen: (() => { try { return JSON.parse(localStorage.getItem('gw-hints') || '{}'); } catch (e) { return {}; } })(), q: [], el: null,
  show(id) {
    if (!SET.hints || this.seen[id] || this.q.includes(id) || !HINTS[id]) return;
    this.seen[id] = 1; try { localStorage.setItem('gw-hints', JSON.stringify(this.seen)); } catch (e) {}
    this.q.push(id); this.pump();
  },
  pump() {
    if (this.el || !this.q.length) return;
    const id = this.q.shift(), [t, body] = HINTS[id];
    const el = this.el = document.createElement('div'); el.className = 'hintcard';
    el.innerHTML = `<div class="eyebrow">Hint · ${esc(t)}</div><p>${esc(body)}</p><div class="row"><button class="small primary" data-h="ok">Got it</button><button class="small ghost" data-h="off">No more hints</button></div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (!b) return; if (b.dataset.h === 'off') { SET.hints = false; applySettings(); this.q = []; } el.remove(); this.el = null; this.pump(); });
    document.body.appendChild(el);
  },
  clear() { this.q = []; if (this.el) { this.el.remove(); this.el = null; } },
  reset() { this.seen = {}; try { localStorage.removeItem('gw-hints'); } catch (e) {} },
  check(prev, S) {
    if (!SET.hints || !S || S.phase !== 'play') return;
    const mine = S.inv.filter(v => !v.out && mineInv(v));
    if (S.round === 1 && S.active < 0 && !S.done.some(Boolean)) this.show('start');
    if (S.active >= 0 && mineInv(S.inv[S.active])) { this.show('turn'); if (inDark(S, S.inv[S.active])) this.show('dark'); }
    if (S.round >= 2) this.show('mythos');
    if (S.monsters.length) this.show('monster');
    if (S.evidence.length && !S.goal) this.show('evidence');
    if (S.goal) this.show('reveal');
    if (mine.some(v => v.wounded || v.insane)) this.show('hurt');
    if (Object.keys(S.fire || {}).length) this.show('fire');
  },
};
