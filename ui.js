'use strict';
/* =====================================================================
   UI: board (pan/zoom SVG), tokens, sheets, dice, HUD, screens
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const para = s => esc(s).split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const app = $('#app');
const CELL = 140;
// art that has been dropped in (art/rooms/<id>.webp); everything else uses placeholder floors
const PCLIP = '<clipPath id="pclip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>';
const ART = {rooms: ['corr', 'hall', 'day', 'nurse', 'office', 'ward', 'chapel', 'stair', 'morgue', 'boiler', 'hydro'], portraits: ['mara', 'elias', 'dex', 'agnes', 'juno'], monsters: ['orderly']};

const G = {screen: 'home', mode: null, S: null, me: null, code: null, subs: [], seats: [], lobby: null, net: null, netText: '',
  busy: false, seenStory: null, seenR: null, myRolls: new Set(), localPicks: [], vb: null, fitKey: '', moveMode: false, sheet: null,
  drawer: false, storyQ: [], showingStory: false, secretsShown: {}};

// ------------------------------------------------------------ portraits
function hatShapes(hat, cx, cy, r) {
  const hy = cy - r * 0.2;
  switch (hat) {
    case 'cap': return `<rect x="${cx - r * 0.3}" y="${hy - r * 0.48}" width="${r * 0.6}" height="${r * 0.2}" rx="${r * 0.05}" fill="#f2efe6"/><rect x="${cx - r * 0.06}" y="${hy - r * 0.45}" width="${r * 0.12}" height="${r * 0.14}" fill="#b8423a"/>`;
    case 'specs': return `<circle cx="${cx - r * 0.13}" cy="${hy + r * 0.02}" r="${r * 0.1}" fill="none" stroke="#e8d9a8" stroke-width="${r * 0.04}"/><circle cx="${cx + r * 0.13}" cy="${hy + r * 0.02}" r="${r * 0.1}" fill="none" stroke="#e8d9a8" stroke-width="${r * 0.04}"/>`;
    case 'flatcap': return `<path d="M${cx - r * 0.36} ${hy - r * 0.1} Q${cx} ${hy - r * 0.62} ${cx + r * 0.36} ${hy - r * 0.1} L${cx + r * 0.46} ${hy - r * 0.06} L${cx - r * 0.36} ${hy - r * 0.04} Z" fill="#3a2a20"/>`;
    case 'veil': return `<path d="M${cx - r * 0.42} ${cy + r * 0.5} Q${cx - r * 0.5} ${hy - r * 0.55} ${cx} ${hy - r * 0.5} Q${cx + r * 0.5} ${hy - r * 0.55} ${cx + r * 0.42} ${cy + r * 0.5} L${cx + r * 0.28} ${cy + r * 0.5} Q${cx + r * 0.3} ${hy} ${cx} ${hy - r * 0.32} Q${cx - r * 0.3} ${hy} ${cx - r * 0.28} ${cy + r * 0.5} Z" fill="#14101c"/><rect x="${cx - r * 0.3}" y="${hy - r * 0.38}" width="${r * 0.6}" height="${r * 0.08}" fill="#f2efe6"/>`;
    case 'cloche': return `<path d="M${cx - r * 0.42} ${hy - r * 0.02} Q${cx - r * 0.4} ${hy - r * 0.55} ${cx} ${hy - r * 0.55} Q${cx + r * 0.4} ${hy - r * 0.55} ${cx + r * 0.42} ${hy - r * 0.02} Z" fill="#5a2f3c"/><rect x="${cx - r * 0.38}" y="${hy - r * 0.16}" width="${r * 0.76}" height="${r * 0.07}" fill="#d9b84a"/>`;
  }
  return '';
}
function portraitInner(id, cx, cy, r, gid) {
  const d = INVD(id);
  const hy = cy - r * 0.2;
  if (ART.portraits.includes(id)) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b130e"/><image href="art/portraits/${id}.webp" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" clip-path="url(#pclip)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.93}" fill="none" stroke="${d.color}" stroke-width="${r * 0.14}"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid})"/>
    <path d="M${cx - r * 0.66} ${cy + r * 0.74} Q${cx - r * 0.6} ${cy + r * 0.16} ${cx} ${cy + r * 0.13} Q${cx + r * 0.6} ${cy + r * 0.16} ${cx + r * 0.66} ${cy + r * 0.74} Z" fill="#1b130e"/>
    <circle cx="${cx}" cy="${hy}" r="${r * 0.31}" fill="#1b130e"/>${hatShapes(d.hat, cx, cy, r)}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.93}" fill="none" stroke="${d.color}" stroke-width="${r * 0.14}"/>`;
}
function portraitGrad(id, gid) {
  const d = INVD(id);
  return `<radialGradient id="${gid}" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="${d.color}"/><stop offset="1" stop-color="#2a1d15"/></radialGradient>`;
}
function portraitSVG(id, size, cls = '') {
  const gid = 'ph-' + id + '-' + size;
  return `<svg class="pt ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><defs>${PCLIP}${portraitGrad(id, gid)}</defs>${portraitInner(id, 50, 50, 48, gid)}</svg>`;
}

// ---------------------------------------------------------------- board
const FLOOR_DEFS = `
<pattern id="fl-wood" width="48" height="140" patternUnits="userSpaceOnUse"><rect width="48" height="140" fill="#4b3424"/><rect x="0" width="23" height="140" fill="#53392a"/><line x1="24" y1="0" x2="24" y2="140" stroke="#2a1c13" stroke-width="2"/><line x1="0" y1="70" x2="23" y2="70" stroke="#2a1c13" stroke-width="2"/><line x1="24" y1="30" x2="48" y2="30" stroke="#2a1c13" stroke-width="2"/></pattern>
<pattern id="fl-tile" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#5c5a52"/><rect width="35" height="35" fill="#4a4842"/><rect x="35" y="35" width="35" height="35" fill="#4a4842"/><path d="M0 0H70V70" fill="none" stroke="#2c2b27" stroke-width="2"/></pattern>
<pattern id="fl-carpet" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="#4a1f22"/><path d="M28 6 L50 28 L28 50 L6 28 Z" fill="none" stroke="#6e3a2c" stroke-width="3"/><circle cx="28" cy="28" r="4" fill="#8a5a2c"/></pattern>
<pattern id="fl-stone" width="140" height="70" patternUnits="userSpaceOnUse"><rect width="140" height="70" fill="#3f403f"/><path d="M0 35H140M70 0V35M35 35V70M105 35V70" stroke="#262726" stroke-width="3"/></pattern>
<radialGradient id="firegrad" cx="50%" cy="100%" r="90%"><stop offset="0" stop-color="#ff7a1a"/><stop offset="0.6" stop-color="#a3260b" stop-opacity="0.6"/><stop offset="1" stop-color="#3a0b05" stop-opacity="0.2"/></radialGradient>
<radialGradient id="vign" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

function reachable(S) {
  if (!canAct() || S.active < 0) return {};
  const inv = S.inv[S.active];
  let steps = 0;
  if (S.moveLeft > 0) steps = S.moveLeft;
  if (S.actions > 0 && !(inv.wounded && inv.moveActs >= 1)) steps = Math.max(steps, CONFIG.moveSpaces);
  if (!steps) return {};
  const {dist} = bfs(S, inv.space, {blockMon: true});
  const out = {};
  for (const [s, d] of Object.entries(dist)) if (d > 0 && d <= steps) out[s] = d;
  return out;
}
function slotPos(sp, i) {
  const s = SP[sp], w = s.w * CELL, h = s.h * CELL, pad = 18, cell = 56;
  const cols = Math.max(1, Math.floor((w - pad * 2) / cell));
  const x0 = s.x * CELL + pad + cell / 2 + ((w - pad * 2) - cols * cell) / 2;
  const y0 = s.y * CELL + pad + 6 + cell / 2;
  return [x0 + (i % cols) * cell, y0 + Math.floor(i / cols) * cell];
}
function tokenIcon(kind, cx, cy, r) {
  if (kind === 'search') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9b84a" stroke="#3b2a0c" stroke-width="3"/><circle cx="${cx - 3}" cy="${cy - 3}" r="${r * 0.4}" fill="none" stroke="#3b2a0c" stroke-width="3.5"/><line x1="${cx + r * 0.18}" y1="${cy + r * 0.18}" x2="${cx + r * 0.55}" y2="${cy + r * 0.55}" stroke="#3b2a0c" stroke-width="4" stroke-linecap="round"/>`;
  if (kind === 'interact') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#4f84c9" stroke="#0f2340" stroke-width="3"/><rect x="${cx - 2.6}" y="${cy - r * 0.55}" width="5.2" height="${r * 0.7}" rx="2" fill="#f2f6ff"/><circle cx="${cx}" cy="${cy + r * 0.42}" r="3.2" fill="#f2f6ff"/>`;
  if (kind === 'explore') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e7c25a" stroke="#4a3208" stroke-width="3"/><path d="M${cx - r * 0.45} ${cy + r * 0.5} V${cy - r * 0.1} Q${cx - r * 0.45} ${cy - r * 0.55} ${cx} ${cy - r * 0.55} Q${cx + r * 0.45} ${cy - r * 0.55} ${cx + r * 0.45} ${cy - r * 0.1} V${cy + r * 0.5} Z" fill="#4a3208"/><circle cx="${cx + r * 0.18}" cy="${cy + r * 0.12}" r="2.4" fill="#e7c25a"/>`;
  if (kind === 'stairs') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#6b5d50" stroke="#1d1712" stroke-width="3"/><path d="M${cx - r * 0.5} ${cy + r * 0.45} H${cx - r * 0.2} V${cy + r * 0.12} H${cx + r * 0.1} V${cy - r * 0.2} H${cx + r * 0.45} V${cy - r * 0.5}" fill="none" stroke="#f0e6d2" stroke-width="3.5"/>`;
  return '';
}
function boardSVG(S) {
  const reach = G.moveMode ? reachable(S) : {};
  const act = S.active >= 0 ? S.inv[S.active] : null;
  let defs = PCLIP + FLOOR_DEFS + INVESTIGATORS.map(d => portraitGrad(d.id, 'pg-' + d.id)).join('');
  let rooms = '', overlays = '', doors = '', toks = '';
  for (const [rid, R] of Object.entries(ROOMS)) {
    if (!S.rooms[rid].rev) continue;
    const x = R.x * CELL, y = R.y * CELL, w = R.w * CELL, h = R.h * CELL;
    rooms += `<g class="room"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#fl-${R.floor})"/>${ART.rooms.includes(rid) ? `<image href="art/rooms/${rid}.webp" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#vign)"/>`}`;
    for (const sid of Object.keys(R.sp)) {
      const s = SP[sid], sx = s.x * CELL, sy = s.y * CELL, sw = s.w * CELL, sh = s.h * CELL;
      const cls = ['space', reach[sid] ? 'reach' : '', act && act.space === sid && canAct() ? 'here' : ''].join(' ');
      if (S.flood && S.flood[sid]) rooms += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#1f4f7a" opacity="0.42"/>${Array.from({length: Math.max(1, s.h * 2)}, (_, k) => `<path d="M${sx + 14} ${sy + 40 + k * 60} q15 -9 30 0 t30 0 t30 0" fill="none" stroke="#9cc4ee" stroke-width="3" opacity="0.7"/>`).join('')}`;
      if (S.fire && S.fire[sid]) rooms += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="url(#firegrad)" opacity="0.6" class="fireov"/><path class="flame" d="M${sx + 30} ${sy + sh - 14} c-14 -12 -10 -26 0 -40 c2 12 10 14 12 6 c8 14 6 26 -12 34 z" fill="#ffb347" stroke="#7a2a08" stroke-width="2"/>`;
      if (S.dark[sid]) rooms += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#000" opacity="${lit(S, sid) ? 0.2 : 0.62}"/><g opacity="0.85"><circle cx="${sx + sw - 20}" cy="${sy + 20}" r="9" fill="#cfd6ff"/><circle cx="${sx + sw - 16}" cy="${sy + 17}" r="8" fill="#14121a"/></g>`;
      overlays += `<rect class="${cls}" data-act="space" data-sp="${sid}" x="${sx + 3}" y="${sy + 3}" width="${sw - 6}" height="${sh - 6}" rx="3"/>`;
    }
    rooms += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#120c08" stroke-width="10"/>`;
    const tw = Math.min(w - 20, R.n.length * 10.5 + 26);
    rooms += `<g class="tag"><rect x="${x + 30}" y="${y + h - 36}" width="${tw}" height="26" rx="3" fill="#e8dcc0" stroke="#3a2a1a" stroke-width="2"/><text x="${x + 43}" y="${y + h - 18}">${esc(R.n)}</text></g></g>`;
  }
  // doors
  for (const d of DOORS) {
    const ra = S.rooms[roomOf(d.sa)].rev, rb = S.rooms[roomOf(d.sb)].rev;
    if (!ra && !rb) continue;
    const [ax, ay] = d.a, [bx, by] = d.b;
    let dx, dy, dw, dh;
    if (ax !== bx) { dx = Math.max(ax, bx) * CELL - 9; dy = ay * CELL + CELL / 2 - 30; dw = 18; dh = 60; }
    else { dx = ax * CELL + CELL / 2 - 30; dy = Math.max(ay, by) * CELL - 9; dw = 60; dh = 18; }
    doors += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="3" fill="#7a5532" stroke="#1c120a" stroke-width="3"/>`;
    if (ra !== rb) {
      const key = 'd' + d.i, from = ra ? d.sa : d.sb;
      const on = act && act.space === from && canAct();
      toks += `<g class="tok explore ${on ? 'live' : ''}" data-act="tok" data-kind="explore" data-id="${key}">${tokenIcon('explore', dx + dw / 2, dy + dh / 2, 20)}</g>`;
    }
  }
  // tokens in spaces
  const bySpace = {};
  const add = (sp, html) => (bySpace[sp] = bySpace[sp] || []).push(html);
  S.inv.forEach((v, i) => {
    if (v.out) return;
    add(v.space, (cx, cy) => {
      const d = INVD(v.id);
      const cls = ['fig', i === S.active ? 'active' : '', S.done[i] ? 'done' : ''].join(' ');
      return `<g class="${cls}" data-act="tok" data-kind="inv" data-id="${v.id}">${i === S.active ? `<circle cx="${cx}" cy="${cy}" r="30" fill="${d.color}" opacity="0.45" filter="url(#glow)"/>` : ''}${portraitInner(v.id, cx, cy, 25, 'pg-' + v.id)}${v.wounded ? `<circle cx="${cx + 18}" cy="${cy - 18}" r="7" fill="#b8423a" stroke="#120c08" stroke-width="2"/>` : ''}${v.insane ? `<circle cx="${cx - 18}" cy="${cy - 18}" r="7" fill="#7f8fd4" stroke="#120c08" stroke-width="2"/>` : ''}</g>`;
    });
  });
  S.monsters.forEach(m => add(m.space, (cx, cy) => {
    const M = MONSTERS[m.type];
    const r = M.boss ? 28 : 24;
    return `<g class="mon ${M.boss ? 'boss' : ''}" data-act="tok" data-kind="mon" data-id="${m.mid}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${M.boss ? '#1d1430' : '#2a0809'}" stroke="${M.boss ? '#c9bdf5' : '#d23c3f'}" stroke-width="4"/>${ART.monsters.includes(m.type) ? `<image href="art/monsters/${m.type}.webp" x="${cx - r + 2}" y="${cy - r + 2}" width="${2 * r - 4}" height="${2 * r - 4}" clip-path="url(#pclip)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${M.boss ? '#c9bdf5' : '#d23c3f'}" stroke-width="4"/>` : `<text x="${cx}" y="${cy + 1}">${M.g}</text>`}${Array.from({length: Math.min(m.wounds, 8)}, (_, k) => `<circle cx="${cx - r + 6 + k * 7}" cy="${cy + r + 4}" r="3" fill="#ff5a55"/>`).join('')}</g>`;
  }));
  if (S.ada && S.ada.found) add(S.ada.space, (cx, cy) => `<g class="tok person" data-act="tok" data-kind="interact" data-id="ada"><circle cx="${cx}" cy="${cy}" r="22" fill="#e9e3d6" stroke="#6e5a3a" stroke-width="4"/><circle cx="${cx}" cy="${cy - 6}" r="7" fill="#3a2e24"/><path d="M${cx - 12} ${cy + 15} Q${cx} ${cy - 2} ${cx + 12} ${cy + 15} Z" fill="#3a2e24"/></g>`);
  for (const t of S.tokens) {
    const kind = t.k === 'person' ? 'interact' : t.k;
    add(t.sp, (cx, cy) => t.k === 'person'
      ? `<g class="tok person" data-act="tok" data-kind="interact" data-id="${t.id}"><circle cx="${cx}" cy="${cy}" r="22" fill="#cfd9e6" stroke="#2b4a6e" stroke-width="4"/><circle cx="${cx}" cy="${cy - 6}" r="7" fill="#2b3644"/><path d="M${cx - 12} ${cy + 15} Q${cx} ${cy - 2} ${cx + 12} ${cy + 15} Z" fill="#2b3644"/></g>`
      : `<g class="tok" data-act="tok" data-kind="${kind}" data-id="${t.id}">${tokenIcon(kind, cx, cy, 18)}</g>`);
  }
  for (const st of STAIRS) {
    for (const end of [st.a, st.b]) {
      if (!revealed(S, end)) continue;
      const other = end === st.a ? st.b : st.a;
      if (!revealed(S, other)) add(end, (cx, cy) => `<g class="tok explore ${act && act.space === end && canAct() ? 'live' : ''}" data-act="tok" data-kind="explore" data-id="s${STAIRS.indexOf(st)}">${tokenIcon('explore', cx, cy, 18)}</g>`);
      else add(end, (cx, cy) => `<g class="tok" data-act="tok" data-kind="stairs" data-id="${end}">${tokenIcon('stairs', cx, cy, 18)}</g>`);
    }
  }
  for (const [sp, list] of Object.entries(bySpace)) list.forEach((f, i) => { const [cx, cy] = slotPos(sp, i); toks += f(cx, cy); });
  return `<defs>${defs}</defs>${rooms}${doors}${overlays}${toks}`;
}
function fitView(S, force) {
  const rev = Object.keys(ROOMS).filter(r => S.rooms[r].rev);
  const key = rev.join(',');
  if (!force && G.vb && G.fitKey === key) return;
  G.fitKey = key;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const r of rev) { const R = ROOMS[r]; x0 = Math.min(x0, R.x); y0 = Math.min(y0, R.y); x1 = Math.max(x1, R.x + R.w); y1 = Math.max(y1, R.y + R.h); }
  const pad = 0.35;
  G.vb = {x: (x0 - pad) * CELL, y: (y0 - pad) * CELL, w: (x1 - x0 + pad * 2) * CELL, h: (y1 - y0 + pad * 2) * CELL};
  const el = $('#board');
  if (el) { const r = el.getBoundingClientRect(); const aspect = r.width / Math.max(1, r.height); if (G.vb.w / G.vb.h < aspect) { const nw = G.vb.h * aspect; G.vb.x -= (nw - G.vb.w) / 2; G.vb.w = nw; } else { const nh = G.vb.w / aspect; G.vb.y -= (nh - G.vb.h) / 2; G.vb.h = nh; } }
  // never zoom in further than ~7 x 5 squares, so a single room doesn't fill the screen with giant tokens
  const k = Math.max(7 * CELL / G.vb.w, 5 * CELL / G.vb.h);
  if (k > 1) { G.vb.x -= (G.vb.w * k - G.vb.w) / 2; G.vb.y -= (G.vb.h * k - G.vb.h) / 2; G.vb.w *= k; G.vb.h *= k; }
}
function applyVB() { const svg = $('#board svg'); if (svg && G.vb) svg.setAttribute('viewBox', `${G.vb.x} ${G.vb.y} ${G.vb.w} ${G.vb.h}`); }

// pan / zoom
const PTR = new Map();
let panStart = null, pinchStart = null, dragged = false;
function boardScale() { const r = $('#board').getBoundingClientRect(); return Math.max(G.vb.w / r.width, G.vb.h / r.height); }
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('#board')) return;
  PTR.set(e.pointerId, {x: e.clientX, y: e.clientY});
  dragged = false;
  if (PTR.size === 1) panStart = {x: e.clientX, y: e.clientY, vb: {...G.vb}};
  if (PTR.size === 2) { const [a, b] = [...PTR.values()]; pinchStart = {d: Math.hypot(a.x - b.x, a.y - b.y), vb: {...G.vb}, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2}; }
});
document.addEventListener('pointermove', e => {
  if (!PTR.has(e.pointerId) || !G.vb) return;
  PTR.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (PTR.size === 1 && panStart) {
    const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
    if (!dragged && Math.hypot(dx, dy) < 7) return;
    dragged = true;
    const k = boardScale();
    G.vb.x = panStart.vb.x - dx * k; G.vb.y = panStart.vb.y - dy * k; applyVB();
  } else if (PTR.size === 2 && pinchStart) {
    dragged = true;
    const [a, b] = [...PTR.values()];
    const f = pinchStart.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
    zoomAt(pinchStart.cx, pinchStart.cy, f, pinchStart.vb);
  }
});
const ptrUp = e => { PTR.delete(e.pointerId); if (PTR.size < 2) pinchStart = null; if (!PTR.size) panStart = null; };
document.addEventListener('pointerup', ptrUp); document.addEventListener('pointercancel', ptrUp);
function zoomAt(px, py, f, base) {
  const el = $('#board'), r = el.getBoundingClientRect();
  const b = base || G.vb;
  const k = Math.max(b.w / r.width, b.h / r.height);
  const ux = b.x + (px - r.left) * k - (r.width * k - b.w) / 2, uy = b.y + (py - r.top) * k - (r.height * k - b.h) / 2;
  const nw = Math.min(30 * CELL, Math.max(2.5 * CELL, b.w * f)), ff = nw / b.w;
  G.vb = {x: ux - (ux - b.x) * ff, y: uy - (uy - b.y) * ff, w: b.w * ff, h: b.h * ff};
  applyVB();
}
document.addEventListener('wheel', e => { if (!e.target.closest('#board') || !G.vb) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.pow(1.0018, e.deltaY)); }, {passive: false});
document.addEventListener('click', e => { if (dragged && e.target.closest('#board')) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);

// ------------------------------------------------------------------ HUD
function mineInv(v) { return G.mode === 'local' || v.owner === G.me; }
function canAct() {
  const S = G.S;
  if (!S || S.phase !== 'play' || G.busy || S.active < 0) return false;
  return mineInv(S.inv[S.active]);
}
const pname = id => id === 'local' ? '' : id === G.me ? 'You' : ((G.S && G.S.names && G.S.names[id]) || (G.lobby && (G.lobby.seats || []).find(s => s.uid === id)?.name) || 'A player');
function candles(n, max) { return Array.from({length: max}, (_, k) => `<span class="candle ${k < n ? 'on' : ''}"></span>`).join(''); }
function hudHTML(S) {
  const chips = S.inv.map((v, i) => {
    const d = INVD(v.id);
    let state = v.out ? 'Lost' : i === S.active ? 'Acting' : S.done[i] ? 'Done' : 'Ready';
    const cls = ['chip', v.out ? 'out' : '', i === S.active ? 'active' : '', S.done[i] ? 'done' : ''].join(' ');
    let btn = '';
    if (S.phase === 'play' && !v.out && S.active < 0 && !S.done[i] && mineInv(v) && !G.busy) btn = `<button class="small primary" data-act="start" data-i="${i}">Begin turn</button>`;
    return `<div class="${cls}" data-act="tok" data-kind="inv" data-id="${v.id}">
      ${portraitSVG(v.id, 46)}
      <div class="ci"><div class="cn">${esc(d.name.replace('Sister ', 'Sr. '))}</div>
        <div class="cs"><span class="h" title="Damage / Health">♥ ${d.hp - v.dmg.length}</span><span class="s" title="Horror / Sanity">✺ ${d.san - v.hor.length}</span><span class="c" title="Clues">🔍 ${v.clues}</span>${v.wounded ? '<span class="tag w">Wounded</span>' : ''}${v.insane ? '<span class="tag i">Insane</span>' : ''}</div>
        <div class="cst">${state}${G.mode === 'online' ? ' · ' + esc(pname(v.owner)) : ''}</div></div>${btn}</div>`;
  }).join('');
  let ctrl = '';
  if (S.phase === 'play') {
    if (S.active >= 0) {
      const v = S.inv[S.active];
      if (mineInv(v)) ctrl = `<div class="turnbox"><div><b>${esc(INVD(v.id).name)}</b> <span class="cands">${candles(S.actions, CONFIG.actions)}</span>${S.moveLeft ? `<small> · ${S.moveLeft} move left</small>` : ''}</div>
        <div class="row"><button class="small" data-act="movemode">${G.moveMode ? 'Cancel move' : 'Move'}</button><button class="small" data-act="tok" data-kind="inv" data-id="${v.id}">Items & card</button><button class="small ghost" data-act="endturn">End turn</button></div></div>`;
      else ctrl = `<div class="turnbox"><small>Waiting for ${esc(pname(v.owner))} — ${esc(INVD(v.id).name)}</small>${G.net && G.net.role === 'host' ? `<button class="small ghost" data-act="takeover" data-i="${S.active}">Take over this seat</button>` : ''}</div>`;
    } else if (allDone(S)) ctrl = `<div class="turnbox"><button class="primary" data-act="endphase" ${G.busy ? 'disabled' : ''}>End Phase → Mythos</button></div>`;
    else ctrl = `<div class="turnbox"><small>Choose who goes next — any order.</small></div>`;
  }
  return `<div class="chips">${chips}</div>${ctrl}`;
}
function topHTML(S) {
  return `<h1>Greywater</h1><span class="pill">Round ${S.round}</span><span class="pill goal">${esc(goalText(S))}</span>
    <span class="sp"></span><span class="net" id="net">${esc(G.netText || '')}</span>
    <button class="small ghost" data-act="fit" title="Fit map">⤢</button><button class="small ghost" data-act="drawer">Journal</button><button class="small ghost" data-act="rules">Rules</button><button class="small ghost" data-act="home">Menu</button>`;
}
function drawerHTML(S) {
  return `<div class="dh"><h3>Journal</h3><button class="small ghost" data-act="drawer">Close</button></div>
    <div class="ev"><div class="eyebrow">Evidence</div>${S.evidence.length ? S.evidence.map(e => `<div>• ${esc(e)}</div>`).join('') : '<small>None yet.</small>'}</div>
    <div class="log">${S.log.map(e => `<div class="${e.k || ''}">${esc(e.t)}</div>`).join('')}</div>`;
}
function renderGame() {
  const S = G.S; if (!S) return;
  if (!$('#gameroot')) {
    app.innerHTML = `<div class="g" id="gameroot"><div class="top" id="top"></div><div id="board"><svg preserveAspectRatio="xMidYMid meet"></svg><div class="sheet" id="sheet" hidden></div><div class="drawer" id="drawer" hidden></div></div><div class="hud" id="hud"></div></div>`;
    G.vb = null;
  }
  fitView(S);
  const svg = $('#board svg');
  svg.innerHTML = boardSVG(S);
  applyVB();
  $('#top').innerHTML = topHTML(S);
  $('#hud').innerHTML = hudHTML(S);
  const dr = $('#drawer'); dr.hidden = !G.drawer; if (G.drawer) dr.innerHTML = drawerHTML(S);
  renderSheet();
  document.body.classList.toggle('mad', S.active >= 0 && canAct() && S.inv[S.active].insane);
}

// ---------------------------------------------------------------- sheets
function openSheet(kind, id) { G.sheet = {kind, id}; renderSheet(); }
function closeSheet() { G.sheet = null; const el = $('#sheet'); if (el) el.hidden = true; }
function btn(label, act, data = {}, ok = true, sub = '') {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="${ok ? '' : 'off'}" ${ok ? `data-act="${act}" ${attrs}` : 'disabled'}>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</button>`;
}
function renderSheet() {
  const el = $('#sheet');
  if (!el) return;
  if (!G.sheet || !G.S) { el.hidden = true; return; }
  const S = G.S, {kind, id} = G.sheet;
  const act = S.active >= 0 ? S.inv[S.active] : null;
  const me = canAct() ? act : null;
  const hasAct = me && S.actions > 0;
  let h = '';
  if (kind === 'inv') {
    const v = S.inv.find(x => x.id === id); if (!v) return closeSheet();
    const d = INVD(v.id);
    const up = [...v.dmg.filter(c => DMG_CARDS[c].up).map(c => DMG_CARDS[c]), ...v.hor.filter(c => HOR_CARDS[c].up).map(c => HOR_CARDS[c])];
    h += `<div class="sh-head">${portraitSVG(v.id, 64)}<div><h2>${esc(d.name)}</h2><div class="role">${esc(d.role)}${v.out ? ' · Lost' : ''}${v.wounded ? ' · <b class="w">Wounded</b>' : ''}${v.insane ? ' · <b class="i">Insane</b>' : ''}</div></div></div>
      <div class="stats">${SKILLS.map(s => { const val = skillVal(S, v, s); return `<span class="stat ${val < d[s] ? 'low' : val > d[s] ? 'high' : ''}">${SKILL_SHORT[s]} <b>${val}</b></span>`; }).join('')}</div>
      <div class="bars"><span>Health</span><div class="bar hp"><i style="width:${100 * Math.max(0, d.hp - v.dmg.length) / d.hp}%"></i></div><span>${d.hp - v.dmg.length}/${d.hp}</span>
      <span>Sanity</span><div class="bar san"><i style="width:${100 * Math.max(0, d.san - v.hor.length) / d.san}%"></i></div><span>${d.san - v.hor.length}/${d.san}</span></div>
      <p class="abil"><b>${esc(d.ability)}.</b> ${esc(d.text)}</p>
      ${up.length ? `<div class="eyebrow">Face-up cards</div><div class="chips2">${up.map(c => `<span class="chip2 bad" title="${esc(c.t)}">${esc(c.n)}</span>`).join('')}</div>` : ''}
      <div class="eyebrow">Possessions · ${v.clues} Clue${v.clues === 1 ? '' : 's'}</div>`;
    const mineActive = me === v;
    h += v.items.length ? `<div class="items">${v.items.map(k => {
      const I = ITEMS[k];
      let b = '';
      if (mineActive && I.use) b = hasAct ? `<button class="small" data-act="useitem" data-k="${k}">Use</button>` : '';
      return `<div class="it"><div><b>${esc(I.n)}</b><small>${esc(I.t)}</small></div>${b}</div>`;
    }).join('')}</div>` : '<small>Nothing.</small>';
    h += (v.spells || []).length ? `<div class="eyebrow">Spells</div><div class="items">${v.spells.map(id => {
      const Sp = SPELLS[id];
      let b = '';
      if (mineActive && Sp.type === 'action' && Sp.target !== 'monster') b = hasAct ? `<button class="small" data-act="cast" data-spell="${id}">Cast</button>` : '';
      const note = Sp.type === 'reaction' ? ' (reaction)' : Sp.type === 'attack' || Sp.target === 'monster' ? ' (cast it from a monster’s card)' : '';
      return `<div class="it spell"><div><b>${esc(Sp.n)}</b><small>${esc(Sp.front)}${note}</small></div>${b}</div>`;
    }).join('')}</div>` : '';
    const bs = [];
    if (mineActive && v.id === 'mara') bs.push(btn('Field Medic', 'medic', {}, hasAct, 'Discard 1 face-down Damage here'));
    if (mineActive && Object.keys(S.fire || {}).some(f => roomOf(f) === roomOf(v.space) || ADJ[v.space].some(a => a.to === f))) bs.push(btn('Extinguish', 'extinguish', {}, hasAct, `Agility ${skillVal(S, v, 'agi')}: each ✦ puts out a fire here or where you move this turn`));
    if (mineActive && (v.items.includes('matches') || v.items.includes('oillamp')) && !fireAt(S, v.space)) bs.push(btn('Set fire here', 'setfire', {}, hasAct, v.items.includes('matches') ? 'Uses up the matches' : 'With the Oil Lamp'));
    if (me && me !== v && me.space === v.space && !v.out) bs.push(btn(`Trade with ${d.name.split(' ')[0]}`, 'trade', {with: v.id}, hasAct, '1 action'));
    if (mineInv(v) && v.insane) bs.push(btn('Read your insanity card', 'secret', {inv: v.id}, true, 'Only you'));
    if (bs.length) h += `<div class="acts">${bs.join('')}</div>`;
  } else if (kind === 'mon') {
    const m = S.monsters.find(x => x.mid == id); if (!m) return closeSheet();
    const M = MONSTERS[m.type];
    h += `<h2>${esc(M.n)}</h2><p class="flav">${esc(M.bio)}</p>
      <div class="stats"><span class="stat">Awareness <b>${M.aware}</b></span><span class="stat">Horror <b>${M.horror}</b></span><span class="stat">Damage <b>${M.dmg}</b></span><span class="stat">Wounds <b>${m.wounds}</b></span></div>`;
    if (me) {
      const sameSpace = m.space === me.space, sameRoom = roomOf(m.space) === roomOf(me.space);
      const opts = [];
      if (sameSpace) opts.push(btn('Attack with fists', 'attack', {mid: m.mid, w: 'fists'}, hasAct, `Strength ${skillVal(S, me, 'str')}`));
      for (const k of [...new Set(me.items)]) {
        const W = ITEMS[k].w; if (!W) continue;
        const ok = W.melee ? sameSpace : sameRoom;
        if (W.melee && !sameSpace) continue;
        if (W.ranged && !sameRoom) continue;
        opts.push(btn(`Attack with ${ITEMS[k].n}`, 'attack', {mid: m.mid, w: k}, hasAct && ok, `${SKILL_NAMES[W.skill]} ${skillVal(S, me, W.skill)} +${W.bonus}`));
      }
      if (sameSpace && me.items.includes('holywater')) opts.push(btn('Throw Holy Water', 'holy', {mid: m.mid}, hasAct, '2 damage, no roll'));
      for (const id of (me.spells || [])) { const Sp = SPELLS[id]; if ((Sp.type === 'attack' || Sp.target === 'monster') && sameRoom) opts.push(btn(`Cast ${Sp.n}`, 'cast', {spell: id, mid: m.mid}, hasAct, `Lore ${skillVal(S, me, 'lore')} · hidden back`)); }
      h += opts.length ? `<div class="acts">${opts.join('')}</div>` : `<small>Get into its space to fight it (or its room, with a ranged weapon).</small>`;
    }
  } else if (kind === 'search') {
    const t = S.tokens.find(x => x.id === id); if (!t) return closeSheet();
    const info = SEARCH[id] || {n: 'Dropped belongings', t: 'What someone left behind.'};
    h += `<div class="sh-head">${'<svg width="44" height="44" viewBox="0 0 44 44">' + tokenIcon('search', 22, 22, 19) + '</svg>'}<div><h2>${esc(info.n)}</h2><div class="role">Search · ${esc(SP[t.sp].n)}</div></div></div><p class="flav">${esc(info.t)}</p>`;
    if (me) h += `<div class="acts">${me.space === t.sp ? btn(info.test ? info.test[2] : 'Search', 'search', {id}, hasAct, '1 action' + (monAt(S, me.space).length ? ' · evade first' : '')) : '<small>Stand in this space to search it.</small>'}</div>`;
  } else if (kind === 'interact') {
    const I = INTERACT[id];
    const sp = id === 'ada' ? S.ada?.space : S.tokens.find(x => x.id === id)?.sp;
    if (!I || !sp) return closeSheet();
    h += `<div class="sh-head">${I.person ? '' : '<svg width="44" height="44" viewBox="0 0 44 44">' + tokenIcon('interact', 22, 22, 19) + '</svg>'}<div><h2>${esc(I.n)}</h2><div class="role">${I.person ? 'Person' : 'Interact'} · ${esc(SP[sp].n)}</div></div></div><p class="flav">${esc(I.info(S))}</p>`;
    if (me) {
      if (me.space !== sp) h += '<small>Stand in this space to interact.</small>';
      else { const c = I.can ? I.can(S, me) : [true]; h += `<div class="acts">${btn(I.label(S), 'interact', {id}, hasAct && c[0], c[0] ? '1 action' + (monAt(S, me.space).length ? ' · evade first' : '') : c[1])}</div>`; }
    }
  } else if (kind === 'explore') {
    const t = exploreTargets(S).find(x => x.key === id); if (!t) return closeSheet();
    const jam = t.link.door != null && DOORS[t.link.door].jam;
    h += `<div class="sh-head"><svg width="44" height="44" viewBox="0 0 44 44">${tokenIcon('explore', 22, 22, 19)}</svg><div><h2>${t.link.stairs != null ? 'Stairs down' : 'A closed door'}</h2><div class="role">Explore · from ${esc(SP[t.from].n)}</div></div></div>
      <p class="flav">${t.link.stairs != null ? 'The stairs descend into cold, wet dark.' : jam ? `The door is swollen in its frame. You will have to force it (Strength, ${CONFIG.jamNeed} success${CONFIG.jamNeed > 1 ? 'es' : ''}).` : 'You don’t know what is on the other side.'}</p>`;
    if (me) h += `<div class="acts">${me.space === t.from ? btn(jam ? 'Force the door (Strength)' : 'Explore', 'explore', {id}, hasAct, '1 action') : '<small>Stand in the space next to this door to explore.</small>'}</div>`;
  } else if (kind === 'stairs') {
    h += `<h2>Stairs</h2><p class="flav">They connect the Stairwell and the Boiler Room. Moving along them counts as moving one space.</p>`;
  }
  el.innerHTML = `<button class="x" data-act="closesheet" aria-label="Close">×</button>${h}`;
  el.hidden = false;
}

// ----------------------------------------------------------------- modals
function openModal(html, cls = '') {
  const back = document.createElement('div');
  back.className = 'mback';
  back.innerHTML = `<div class="modal ${cls}">${html}</div>`;
  document.body.appendChild(back);
  return back;
}
function info(title, html, btnLabel = 'Continue', cls = '') {
  return new Promise(res => {
    const m = openModal(`<h2>${title}</h2>${html}<div class="btns"><button class="primary" data-x="ok">${btnLabel}</button></div>`, cls);
    m.addEventListener('click', e => { if (e.target.closest('[data-x="ok"]')) { m.remove(); res(); } });
  });
}
function confirmBox(title, text) {
  return new Promise(res => {
    const m = openModal(`<h2>${title}</h2><p>${esc(text)}</p><div class="btns"><button data-x="no">Cancel</button><button class="primary" data-x="yes">Yes</button></div>`);
    m.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) { m.remove(); res(b.dataset.x === 'yes'); } });
  });
}
function choose(title, opts, note = '') {
  return new Promise(res => {
    const m = openModal(`<h2>${title}</h2>${note ? `<p class="dim">${note}</p>` : ''}<div class="list">${opts.map((o, i) => `<button data-i="${i}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>
      <div class="btns"><button class="ghost" data-x="cancel">Cancel</button></div>`);
    m.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; m.remove(); res(b.dataset.i != null ? opts[+b.dataset.i].v : null); });
  });
}
function toast(t, ms = 3800) {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = esc(t);
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), ms);
}
function rollToast(r) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<b>${esc(INVD(r.who).name)}</b> · ${esc(r.label)}<br><span class="tf">${r.faces.map(f => `<i class="f ${f}">${FACE[f] || '·'}</i>`).join('')}</span> <small>${r.succ} success${r.succ === 1 ? '' : 'es'}</small>`;
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), 4500);
}

// dice
function rollTest(D, inv, sk, o = {}) {
  const n = Math.max(1, skillVal(D, inv, sk) + (o.bonus || 0));
  let faces = Array.from({length: n}, rollD8);
  let rerolled = false;
  if (sk === 'lore' && inv.id === 'elias' && faces.includes('B')) { faces = faces.map(f => f === 'B' ? rollD8() : f); rerolled = true; }
  const keen = sk === 'obs' && inv.id === 'juno';
  const dark = inDark(D, inv);
  return new Promise(resolve => {
    let spent = 0;
    const d = INVD(inv.id);
    const m = openModal(`<div class="eyebrow">${esc(d.name)} · ${SKILL_NAMES[sk]} ${n} ${n === 1 ? 'die' : 'dice'}${o.need ? ` · need ${o.need}` : ''}</div><h2>${esc(o.label || SKILL_NAMES[sk])}</h2>
      <div class="dice" id="dice"></div><div class="dsum" id="dsum">&nbsp;</div><div class="btns" id="dctrl" style="justify-content:center"></div>`, 'dicem');
    const diceEl = $('#dice', m);
    diceEl.innerHTML = faces.map(() => `<div class="die rolling"></div>`).join('');
    const glyphs = ['✦', '🔍', '', ''];
    const iv = setInterval(() => diceEl.querySelectorAll('.die').forEach(e => e.textContent = pick(glyphs)), 70);
    const succ = () => faces.filter(f => f === 'S' || f === 'X' || (f === 'C' && keen)).length;
    const drawD = () => {
      diceEl.innerHTML = faces.map(f => `<div class="die ${f}${f === 'C' && keen ? ' K' : ''}">${FACE[f]}</div>`).join('');
      const s = succ(), notes = [];
      if (rerolled) notes.push('Erudite: blanks rerolled once.');
      if (keen) notes.push('Keen Eye: 🔍 counts as a success.');
      if (dark && faces.includes('C') && !keen) notes.push('Darkness: you cannot spend Clues here.');
      $('#dsum', m).innerHTML = `${s} success${s === 1 ? '' : 'es'}${o.need ? (s >= o.need ? ' — <span class="pass">passed</span>' : ' — <span class="fail">failed</span>') : ''}${notes.length ? `<br><small>${notes.join(' ')}</small>` : ''}`;
      const left = inv.clues - spent;
      const canSpend = !keen && !dark && faces.includes('C') && left > 0;
      $('#dctrl', m).innerHTML = `${canSpend ? `<button data-x="spend">Spend a Clue: 🔍 → ✦ <small>(${left} left)</small></button>` : ''}<button class="primary" data-x="ok">Continue</button>`;
    };
    setTimeout(() => { clearInterval(iv); drawD(); }, 650);
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'spend') { const i = faces.indexOf('C'); if (i >= 0 && inv.clues - spent > 0) { faces[i] = 'X'; spent++; drawD(); } }
      else {
        m.remove();
        inv.clues -= spent;
        const s = succ();
        D.rseq = (D.rseq || 0) + 1;
        D.roll = {seq: D.rseq, who: inv.id, label: o.label || SKILL_NAMES[sk], faces: faces.slice(), succ: s};
        G.myRolls.add(D.rseq);
        if (o.noisy && s < (o.need || 1)) D.noise = inv.id;
        resolve(s);
      }
    });
  });
}

// story queue
function queueStories(S) {
  if (G.seenStory == null) G.seenStory = S.stories.length ? S.stories[S.stories.length - 1].seq - (S.round === 1 && S.storySeq <= 1 ? 1 : 0) : 0;
  for (const s of S.stories) if (s.seq > G.seenStory) { G.storyQ.push(s); G.seenStory = s.seq; }
  pumpStories();
}
async function pumpStories() {
  if (G.showingStory) return;
  G.showingStory = true;
  while (G.storyQ.length) {
    const s = G.storyQ.shift();
    if (s.kind === 'mythos') { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 500); }
    const label = {mythos: 'Mythos', reveal: 'The Reveal', evidence: 'Evidence', room: 'Explored', intro: 'Chapter 1', insane: 'Madness', dire: 'Doom', won: 'Victory', lost: 'Defeat'}[s.kind] || 'Greywater';
    await info(esc(s.title), `<div class="eyebrow">${label}</div>${para(s.text)}`, s.kind === 'mythos' ? 'Face the night' : 'Continue', 'story ' + s.kind);
    if ((s.kind === 'won' || s.kind === 'lost') && G.S) await showInsanityResults(G.S);
  }
  G.showingStory = false;
}

// trade
function tradeModal(S, a, b) {
  return new Promise(res => {
    const give = [], take = []; let clues = 0;
    const m = openModal('<div id="tr"></div>');
    const draw = () => {
      const mine = a.items.map((k, i) => ({k, i, moved: give.includes(i)})), theirs = b.items.map((k, i) => ({k, i, moved: take.includes(i)}));
      $('#tr', m).innerHTML = `<h2>Trade</h2><p class="dim">Tap a possession to move it across. Costs 1 action.</p>
        <div class="trade"><div><div class="eyebrow">${esc(INVD(a.id).name)}</div>${mine.map(x => `<button class="small ${x.moved ? 'moved' : ''}" data-g="${x.i}">${esc(ITEMS[x.k].n)} ${x.moved ? '→' : ''}</button>`).join('') || '<small>—</small>'}</div>
        <div><div class="eyebrow">${esc(INVD(b.id).name)}</div>${theirs.map(x => `<button class="small ${x.moved ? 'moved' : ''}" data-t="${x.i}">${x.moved ? '←' : ''} ${esc(ITEMS[x.k].n)}</button>`).join('') || '<small>—</small>'}</div></div>
        <div class="row" style="justify-content:center;margin-top:10px"><button class="small" data-c="-1">◀</button><span>Clues: ${clues > 0 ? `give ${clues}` : clues < 0 ? `take ${-clues}` : 'none'}</span><button class="small" data-c="1">▶</button></div>
        <div class="btns"><button class="ghost" data-x="no">Cancel</button><button class="primary" data-x="ok">Trade</button></div>`;
    };
    draw();
    m.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.g != null) { const i = +t.dataset.g; give.includes(i) ? give.splice(give.indexOf(i), 1) : give.push(i); draw(); }
      else if (t.dataset.t != null) { const i = +t.dataset.t; take.includes(i) ? take.splice(take.indexOf(i), 1) : take.push(i); draw(); }
      else if (t.dataset.c) { clues = Math.max(-b.clues, Math.min(a.clues, clues + +t.dataset.c)); draw(); }
      else if (t.dataset.x) { m.remove(); res(t.dataset.x === 'ok' ? {give: give.map(i => a.items[i]), take: take.map(i => b.items[i]), clues} : null); }
    });
  });
}

// --------------------------------------------------------- action glue
async function doAction(kind, arg) {
  const S = G.S;
  if (!S || G.busy || S.phase !== 'play') return;
  if (!['start', 'endphase'].includes(kind) && !canAct()) return;
  G.busy = true; G.moveMode = kind === 'move' ? false : G.moveMode;
  let committed = false;
  try {
    const D = clone(S);
    const inv = D.active >= 0 ? D.inv[D.active] : null;
    if (needsAction(D, kind)) { toast('No actions left this turn.'); return; }
    let gated = false, passed = true;
    const ctx = {
      test: (sk, o) => rollTest(D, inv, sk, o),
      toast,
      puzzle: (id, who) => runPuzzle(D, id, who),
      ask: (title, text) => confirmBox(title, text),
      gate: async () => { if (gated) return passed; gated = true; if (NO_EVADE.includes(kind) || !monAt(D, inv.space).length) return true; passed = await evade(D, inv, ctx); return passed; },
    };
    const res = await ACT[kind](D, inv, arg, ctx);
    if (res === false) return;
    if (res !== 'free') D.actions--;
    afterAction(D, kind);
    G.busy = false; committed = true;
    if (kind === 'start') G.moveMode = false;
    await commit(D);
  } catch (e) { console.error(e); toast('Something went wrong: ' + (e && e.message || e)); }
  finally { G.busy = false; if (!committed) render(); }
}

async function commit(D) {
  D.rev = (G.S && G.S.rev || 0) + 1;
  if (G.mode === 'local') { saveLocal(D); onState(D); return; }
  if (G.net && G.net.role === 'host') { hostAccept(D); return; }
  const prev = G.S;
  if (!send(G.net && G.net.conn, {t: 'commit', S: D})) { toast('Not connected to the host, so that move was not sent. Try again in a moment.'); onState(prev, true); return; }
  onState(D);
}
function onState(S, force) {
  if (!force && G.S && S.gid === G.S.gid && S.rev < G.S.rev) return;
  if (G.S && G.S.gid !== S.gid) { G.seenStory = null; G.vb = null; }
  G.S = S; G.screen = 'game';
  if (G.seenR == null) G.seenR = S.rseq;
  render();
  if (S.rseq > G.seenR) { G.seenR = S.rseq; if (S.roll && !G.myRolls.has(S.roll.seq) && G.mode === 'online') rollToast(S.roll); }
  if (S.flip && G.seenFlip !== S.flip.seq) { if (G.seenFlip != null && G.mode === 'online' && !mineInv(S.inv.find(i => i.id === S.flip.who) || {})) toast(`${INVD(S.flip.who).name} cast ${SPELLS[S.flip.spell].n}: “${SPELLS[S.flip.spell].backs[S.flip.back].t}”`, 6000); G.seenFlip = S.flip.seq; }
  if (G.seenFlip === undefined) G.seenFlip = S.flip ? S.flip.seq : null;
  queueStories(S);
  checkSecrets(S);
}
function saveLocal(S) { try { localStorage.setItem('gw-local', JSON.stringify(S)); } catch (e) {} }
function loadLocal() { try { const s = localStorage.getItem('gw-local'); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

// ------------------------------------------------------- secret insanity
async function sha(s) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h; }
}
function secretKey(S, invId) { return `gw-sec-${S.gid}-${invId}`; }
function getSecret(S, invId) { try { return JSON.parse(localStorage.getItem(secretKey(S, invId)) || 'null'); } catch (e) { return null; } }
async function checkSecrets(S) {
  for (const v of S.inv) {
    if (!v.insane || !mineInv(v)) continue;
    let sec = getSecret(S, v.id);
    if (!sec) {
      sec = {card: pick(INSANITY).id, salt: Math.random().toString(36).slice(2)};
      try { localStorage.setItem(secretKey(S, v.id), JSON.stringify(sec)); } catch (e) {}
      const hash = await sha(sec.card + ':' + sec.salt);
      if (G.mode === 'online') { if (G.net && G.net.role === 'host') hostSecret(G.me, v.id, hash); else send(G.net && G.net.conn, {t: 'secret', inv: v.id, hash}); }
      G.secretsShown[v.id] = false;
    }
    if (!G.secretsShown[v.id]) { G.secretsShown[v.id] = true; await showSecret(S, v.id, true); }
    if (S.phase !== 'play' && !(S.revealed && S.revealed[v.id])) {
      if (G.mode === 'local') { S.revealed = S.revealed || {}; S.revealed[v.id] = {card: sec.card, ok: true}; saveLocal(S); }
      else if (G.net && G.net.role === 'host') hostReveal(G.me, v.id, sec.card, sec.salt);
      else send(G.net && G.net.conn, {t: 'reveal', inv: v.id, card: sec.card, salt: sec.salt});
    }
  }
}
async function showSecret(S, invId, fresh) {
  const sec = getSecret(S, invId); if (!sec) return;
  const v = S.inv.find(x => x.id === invId), C = INSANITY.find(c => c.id === sec.card);
  if (G.mode === 'local' && fresh) await info('Insanity card', `<p>${esc(INVD(invId).name)} has gone insane. <b>Only the player controlling ${esc(INVD(invId).name)} should look at the next screen.</b></p>`, 'I am that player — show me');
  await info(`Insanity: ${esc(C.n)}`, `<div class="eyebrow">Secret · ${esc(INVD(invId).name)}</div><p class="flav">${esc(C.t)}</p><p class="dim">Keep this to yourself. It is revealed when the game ends.</p>`, 'Hide it', 'insane');
}
async function showInsanityResults(S) {
  const ins = S.inv.filter(v => v.insane);
  if (!ins.length) return;
  await new Promise(r => setTimeout(r, 900));
  const rows = ins.map(v => {
    const rv = S.revealed && S.revealed[v.id];
    if (!rv) return `<li>${esc(INVD(v.id).name)}: card not yet revealed.</li>`;
    const C = INSANITY.find(c => c.id === rv.card);
    return `<li><b>${esc(INVD(v.id).name)}</b> — ${esc(C.n)}: ${C.win(S, v) ? '<span class="pass">wins</span>' : '<span class="fail">loses</span>'}${rv.ok ? '' : ' <small>(could not be verified)</small>'}</li>`;
  }).join('');
  await info('Insanity revealed', `<p>Insane investigators win or lose by their own card:</p><ul>${rows}</ul>`, 'Close');
}

// --------------------------------------------------------------- screens
function render() {
  if (G.screen === 'game') return renderGame();
  if (G.screen === 'home') renderHome();
  else if (G.screen === 'setup') renderSetup();
  else if (G.screen === 'lobby') renderLobby();
  else if (G.screen === 'loading') app.innerHTML = `<div class="home"><div class="title"><h1>Greywater</h1><p id="loadmsg">Knocking on the door…</p></div></div>`;
}
function invCard(d, extra = '', cls = '', act = '') {
  return `<button class="invc ${cls}" ${act}>${extra}
    <div class="nm">${portraitSVG(d.id, 40)}<div>${esc(d.name)}<div class="role">${esc(d.role)}</div></div></div>
    <div class="stats">${SKILLS.map(s => `<span class="stat">${SKILL_SHORT[s]} <b>${d[s]}</b></span>`).join('')}<span class="stat h">HP <b>${d.hp}</b></span><span class="stat s">SAN <b>${d.san}</b></span></div>
    <div class="abil"><b>${esc(d.ability)}.</b> ${esc(d.text)}</div></button>`;
}
function renderHome() {
  const local = loadLocal(), hosted = typeof loadHost === 'function' ? loadHost() : null, recent = typeof lsGet === 'function' ? lsGet('gw-recent') : null;
  const codeVal = $('#code') ? $('#code').value : '';
  const nameVal = $('#pname') ? $('#pname').value : (typeof myName === 'function' ? myName() : '');
  app.innerHTML = `<div class="home">
    <div class="title"><div class="eyebrow">Chapter 1 · a cooperative horror for 1–4 players</div><h1>Greywater</h1>
      <p>“Come quickly. The patients have begun to sing.” A letter from the director of Greywater Sanatorium brought you to the black lake. The doors locked behind you.</p></div>
    <div class="card"><h2>Play online</h2>
      <p class="dim" style="margin-top:0">Everyone plays on their own phone or computer — iPhone, Android or Windows. No accounts. One player hosts, and their screen must stay open.</p>
      <div class="row" style="margin-bottom:12px"><label class="dim" for="pname">Your name</label><input id="pname" maxlength="24" autocomplete="nickname" class="nm-in" placeholder="e.g. Sam"></div>
      <div class="row"><button class="primary" data-act="host">Host a game</button><input id="code" placeholder="CODE" maxlength="8" autocomplete="off" autocapitalize="characters"><button data-act="joincode">Join</button></div>
      ${(hosted && hosted.phase === 'play') || recent ? `<div class="list">${hosted && hosted.phase === 'play' ? `<button data-act="rehost"><span>Resume hosting game ${esc(hosted.code)}</span><small>round ${hosted.round}</small></button>` : ''}${recent && (!hosted || hosted.code !== recent) ? `<button data-act="join" data-code="${esc(recent)}"><span>Rejoin game ${esc(recent)}</span><small>last joined</small></button>` : ''}</div>` : ''}
    </div>
    <div class="card"><h2>Play on this device</h2>
      <p class="dim" style="margin-top:0">Pass the device around, or play solo with two investigators.</p>
      <div class="row"><button data-act="setup">New game</button>${local && local.phase === 'play' && local.v === 2 ? `<button data-act="resume">Resume (round ${local.round})</button>` : ''}</div></div>
    <div class="card"><div class="row"><button class="ghost" data-act="rules">How to play</button><button class="ghost" data-act="install">Install as an app</button></div></div>
  </div>`;
  $('#code').value = codeVal; $('#pname').value = nameVal;
}
function renderSetup() {
  const p = G.localPicks;
  app.innerHTML = `<div class="home">
    <div class="row" style="justify-content:space-between"><h2 style="font-size:30px">Choose investigators</h2><button class="ghost small" data-act="home">Back</button></div>
    <p class="dim">Pick 2 to 4. Playing alone? Pick two and control both.</p>
    <div class="invgrid">${INVESTIGATORS.map(d => { const i = p.indexOf(d.id); return invCard(d, i >= 0 ? `<span class="tag">#${i + 1}</span>` : '', i >= 0 ? 'mine' : '', `data-act="lpick" data-id="${d.id}"`); }).join('')}</div>
    <div class="row" style="margin-top:16px"><button class="primary" data-act="lbegin" ${p.length >= 2 ? '' : 'disabled'}>Enter Greywater</button></div></div>`;
}
function renderLobby() {
  const L = G.lobby; if (!L) return;
  const c = claims(), isHost = L.host === G.me, seated = (L.seats || []).some(s => s.uid === G.me);
  const n = Object.keys(c).length;
  app.innerHTML = `<div class="home">
    <div class="row" style="justify-content:space-between"><div><div class="eyebrow">Game code</div><div class="code">${esc(L.code)}</div></div><button class="ghost small" data-act="home">Leave</button></div>
    <div class="row"><button data-act="invite">Share invite link</button><small class="dim">or tell friends the code: they open this site and tap Join.</small></div>
    <p class="dim" id="net">${esc(G.netText || '')}</p>
    <div class="card"><h2>At the door</h2><div class="list">${(L.seats || []).map(s => `<div class="row" style="justify-content:space-between"><span>${esc(pname(s.uid))}${s.uid === L.host ? ' <small>(host)</small>' : ''}</span><small>${(s.picks || []).filter(id => c[id] === s.uid).map(id => INVD(id).name).join(', ') || 'choosing…'}</small></div>`).join('')}</div></div>
    <div class="card"><h2>Choose your investigators</h2><p class="dim" style="margin:0">Tap to claim. 2 to 4 in total — one player may control several.</p>
      <div class="invgrid">${INVESTIGATORS.map(d => { const o = c[d.id], mine = o === G.me, taken = o && !mine; return invCard(d, mine ? '<span class="tag">Yours</span>' : taken ? `<span class="tag">${esc(pname(o))}</span>` : '', mine ? 'mine' : taken ? 'taken' : '', seated && !taken ? `data-act="spick" data-id="${d.id}"` : 'disabled'); }).join('')}</div>
      <div class="row" style="margin-top:16px">${isHost ? `<button class="primary" data-act="obegin" ${n >= 2 ? '' : 'disabled'}>Enter Greywater</button>${n < 2 ? '<small class="dim">At least 2 investigators.</small>' : ''}` : `<small>Waiting for ${esc(pname(L.host))} to begin…</small>`}</div></div></div>`;
}
function showRules() {
  info('How to play', `<div class="rules">
    <p>Greywater plays like Mansions of Madness. Work together — everyone wins or loses as one (unless madness gives you other plans).</p>
    <h3>A round</h3><p><b>Investigator phase:</b> in any order you like, each investigator takes a turn of <b>2 actions</b>. When everyone is done, press <b>End Phase</b>. <b>Mythos phase:</b> an event happens, monsters move and attack, then anyone in a room with a monster resolves a horror check.</p>
    <h3>Actions</h3><p><b>Move</b> up to 2 spaces (tap Move, then a lit space; you can split it around another action). <b>Explore</b> a door token. <b>Search</b> a 🔍 token. <b>Interact</b> with a ❗ or person. <b>Attack</b> a monster (tap it). <b>Trade</b> with someone in your space. <b>Use</b> items from your card. Tap any token for details.</p>
    <h3>Evading</h3><p>If a monster is in your space, you must pass an evade test before any action except Attack. Fail and the action is lost — and it hits you.</p>
    <h3>Tests</h3><p>Roll one die per point of skill: ✦ is a success, 🔍 can be turned into a success by spending a Clue (not in Darkness), blank is nothing.</p>
    <h3>Damage & Horror</h3><p>Taken as cards; some stay face up with lasting effects. When Damage reaches Health you are <b>Wounded</b> (one Move action per round); when Horror reaches Sanity you go <b>Insane</b> and draw a secret card. The second time either happens, you are eliminated — and the rest of you have until the end of the next investigator phase to win.</p>
    <h3>Spells</h3><p>You see a spell’s front; its back stays hidden until you cast it, then you resolve the back — a bonus or a price — and gain a fresh copy with a new hidden back. Anyone can cast; Lore helps.</p>
    <h3>Puzzles</h3><p>Some ❗ tokens are puzzles. You get steps equal to the skill shown (+1 per Clue, not in Darkness). Stop any time — progress is kept, and anyone can carry on later.</p>
    <h3>Darkness, fire & flood</h3><p><b>Darkness:</b> no spending Clues unless you or someone next to you has a light, or fire is near. <b>Fire:</b> entering it, or acting in it, costs 1 Damage; it spreads each Mythos phase; <i>Extinguish</i> with Agility, or <i>Set fire</i> with matches or an oil lamp. <b>Flood:</b> Drowned Patients move freely through it; fire and water cancel out.</p>
    <h3>Winning</h3><p>Find out what happened. Your true goal is revealed once you have gathered enough evidence. Don’t take too long: something is keeping time.</p></div>`, 'Understood');
}
function showInstall() {
  info('Install as an app', `<p><b>iPhone / iPad (Safari):</b> Share button → <i>Add to Home Screen</i>.</p><p><b>Android (Chrome):</b> ⋮ menu → <i>Install app</i> or <i>Add to Home screen</i>.</p><p><b>Windows (Chrome or Edge):</b> the install icon in the address bar, or ⋯ menu → <i>Apps</i> → <i>Install</i>.</p>`, 'Got it');
}

// ---------------------------------------------------------------- events
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.act, S = G.S;
  switch (a) {
    case 'home': if (G.screen === 'game' && G.mode === 'local' && S) saveLocal(S); closeSheet(); goHome(true); break;
    case 'rules': showRules(); break;
    case 'install': showInstall(); break;
    case 'setup': G.localPicks = []; G.screen = 'setup'; render(); break;
    case 'lpick': { const i = G.localPicks.indexOf(b.dataset.id); if (i >= 0) G.localPicks.splice(i, 1); else if (G.localPicks.length < 4) G.localPicks.push(b.dataset.id); render(); break; }
    case 'lbegin': { clearSubs(); G.mode = 'local'; G.seenStory = null; G.seenR = null; G.S = null; app.innerHTML = ''; const N = newGame(G.localPicks.map(id => ({id, owner: 'local'}))); N.mode = 'local'; saveLocal(N); onState(N); break; }
    case 'resume': { const L = loadLocal(); if (L) { clearSubs(); G.mode = 'local'; G.seenStory = L.storySeq; G.seenR = L.rseq; G.S = null; app.innerHTML = ''; onState(L); } break; }
    case 'host': hostGame(); break;
    case 'rehost': { const h = loadHost(); if (h) hostGame(h); break; }
    case 'joincode': joinGame($('#code') && $('#code').value); break;
    case 'join': joinGame(b.dataset.code); break;
    case 'invite': invite(); break;
    case 'spick': toggleSeatPick(b.dataset.id); break;
    case 'obegin': beginOnline(); break;
    case 'fit': if (S) { fitView(S, true); applyVB(); } break;
    case 'drawer': G.drawer = !G.drawer; render(); break;
    case 'closesheet': closeSheet(); break;
    case 'movemode': G.moveMode = !G.moveMode; closeSheet(); render(); break;
    case 'start': closeSheet(); doAction('start', +b.dataset.i); break;
    case 'endturn': closeSheet(); doAction('endturn'); break;
    case 'endphase': closeSheet(); doAction('endphase'); break;
    case 'space': {
      if (!S) break;
      const sp = b.dataset.sp;
      if (G.moveMode && reachable(S)[sp]) { closeSheet(); doAction('move', sp); }
      else if (canAct() && S.inv[S.active].space !== sp && reachable(S)[sp] && !G.moveMode) { G.moveMode = true; render(); }
      break;
    }
    case 'tok': {
      const k = b.dataset.kind, id = b.dataset.id;
      if (k === 'inv' && canAct() && S.inv[S.active].id === id && e.target.closest('#board')) { G.moveMode = !G.moveMode; render(); if (G.moveMode) { closeSheet(); break; } }
      openSheet(k, id); break;
    }
    case 'search': closeSheet(); doAction('search', b.dataset.id); break;
    case 'interact': closeSheet(); doAction('interact', b.dataset.id); break;
    case 'explore': closeSheet(); doAction('explore', b.dataset.id); break;
    case 'attack': closeSheet(); doAction('attack', {mid: +b.dataset.mid, weapon: b.dataset.w}); break;
    case 'holy': closeSheet(); doAction('use', {item: 'holywater', mid: +b.dataset.mid}); break;
    case 'useitem': {
      const me = S.inv[S.active], k = b.dataset.k;
      if (k === 'holywater') { const ms = monAt(S, me.space); if (!ms.length) { toast('There is no monster in your space.'); break; } const m = ms.length === 1 ? ms[0] : await choose('Throw it at…', ms.map(x => ({label: MONSTERS[x.type].n, v: x}))); if (m) { closeSheet(); doAction('use', {item: k, mid: m.mid}); } break; }
      const people = invAt(S, me.space);
      const t = people.length === 1 ? people[0] : await choose(`${ITEMS[k].n}: who?`, people.map(p => ({label: INVD(p.id).name + (p === me ? ' (you)' : ''), sub: k === 'bandages' ? `${p.dmg.length} Damage` : `${p.hor.length} Horror`, v: p})));
      if (t) { closeSheet(); doAction('use', {item: k, target: t.id}); }
      break;
    }
    case 'medic': {
      const me = S.inv[S.active], people = invAt(S, me.space);
      const t = people.length === 1 ? people[0] : await choose('Field Medic: who?', people.map(p => ({label: INVD(p.id).name, sub: `${p.dmg.length} Damage`, v: p})));
      if (t) { closeSheet(); doAction('medic', {target: t.id}); }
      break;
    }
    case 'trade': {
      const me = S.inv[S.active], o = S.inv.find(x => x.id === b.dataset.with);
      if (hasFlag(me, 'notrade') || hasFlag(o, 'notrade')) { toast('Paranoia: one of you refuses to trade.'); break; }
      const r = await tradeModal(S, me, o);
      if (r) { closeSheet(); doAction('trade', {with: o.id, ...r}); }
      break;
    }
    case 'secret': showSecret(S, b.dataset.inv, false); break;
    case 'extinguish': closeSheet(); doAction('extinguish'); break;
    case 'setfire': closeSheet(); doAction('setfire'); break;
    case 'cast': {
      const me = S.inv[S.active], id = b.dataset.spell, Sp = SPELLS[id];
      if (b.dataset.mid) { closeSheet(); doAction('cast', {spell: id, mid: +b.dataset.mid}); break; }
      if (Sp.target === 'ally') { const people = invAt(S, me.space); const t = people.length === 1 ? people[0] : await choose(`${Sp.n}: on whom?`, people.map(p => ({label: INVD(p.id).name + (p === me ? ' (you)' : ''), sub: `${p.dmg.length} Damage · ${p.hor.length} Horror`, v: p}))); if (t) { closeSheet(); doAction('cast', {spell: id, target: t.id}); } break; }
      closeSheet(); doAction('cast', {spell: id}); break;
    }
    case 'takeover': takeover(+b.dataset.i); break;
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); if (e.key === 'Enter' && e.target && e.target.id === 'code') joinGame(e.target.value); });
window.addEventListener('resize', () => { if (G.S && G.screen === 'game') { fitView(G.S, true); applyVB(); } });
