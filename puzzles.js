'use strict';
/* Puzzle screens (MOM-style: steps = your skill, +1 per Clue, progress is kept).
   runPuzzle(D, id, inv) -> Promise<{state, wrong}>. Other players watch live (read-only). */

function photoSVG(clipX, clipY) {
  // a sepia photograph of the ward, drawn in a 300×300 frame; a tile shows a 100×100 part of it
  return `<svg viewBox="${clipX} ${clipY} 100 100" width="100%" height="100%" preserveAspectRatio="none">
    <defs><linearGradient id="sep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c39a"/><stop offset="1" stop-color="#a88d62"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#sep)"/>
    <rect y="185" width="300" height="115" fill="#8a6f48"/>
    ${[30, 125, 220].map(x => `<path d="M${x} 120 V60 Q${x + 25} 25 ${x + 50} 60 V120 Z" fill="#efe2c4" stroke="#5a442a" stroke-width="4"/><line x1="${x + 25}" y1="40" x2="${x + 25}" y2="120" stroke="#5a442a" stroke-width="3"/>`).join('')}
    ${[10, 85, 160, 235].map((x, i) => `<rect x="${x}" y="200" width="58" height="30" rx="4" fill="#f4ead2" stroke="#4a3622" stroke-width="3"/><rect x="${x}" y="190" width="6" height="45" fill="#4a3622"/><rect x="${x + 52}" y="190" width="6" height="45" fill="#4a3622"/>`).join('')}
    ${[38, 113, 188, 263].map((x, i) => `<circle cx="${x}" cy="${150 + (i % 2) * 6}" r="11" fill="#3d2c1c"/><path d="M${x - 16} ${200} Q${x} ${158 + (i % 2) * 6} ${x + 16} 200 Z" fill="#3d2c1c"/>`).join('')}
    <circle cx="188" cy="168" r="30" fill="none" stroke="#7a1b14" stroke-width="5"/>
    <text x="150" y="285" font-family="IM Fell English SC, serif" font-size="20" fill="#3a2a18" text-anchor="middle">Greywater — Ward II, 1925</text>
    <rect width="300" height="300" fill="none" stroke="#3a2a18" stroke-width="6"/></svg>`;
}
function pipeTileSVG(t, wet) {
  const ds = pipeDirs(t), c = wet ? '#5b8fd9' : '#8b7a63';
  const seg = {0: 'M50 50 V0', 1: 'M50 50 H100', 2: 'M50 50 V100', 3: 'M50 50 H0'};
  return `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="#2a2420"/>${ds.map(d => `<path d="${seg[d]}" stroke="#14100d" stroke-width="30" stroke-linecap="round"/><path d="${seg[d]}" stroke="${c}" stroke-width="20" stroke-linecap="round"/>`).join('')}<circle cx="50" cy="50" r="14" fill="${c}" stroke="#14100d" stroke-width="5"/></svg>`;
}
function wetCells(st) {
  const {W, H, grid} = st, wet = new Set();
  let x = 0, y = st.r0, from = 3;
  for (let g = 0; g < 40; g++) {
    if (x < 0 || x >= W || y < 0 || y >= H) break;
    const t = grid[y * W + x], ds = pipeDirs(t);
    if (!ds.includes(from)) break;
    wet.add(y * W + x);
    const out = ds.find(d => d !== from);
    if (out === 0) y--; else if (out === 2) y++; else if (out === 1) x++; else x--;
    from = (out + 2) % 4;
  }
  return wet;
}
const SLIDE_COLORS = {K: '#d9b84a', A: '#8b5a2b', B: '#4f7487', C: '#7d4a6e', D: '#5b7d47', E: '#a0773a', F: '#665a9e', G: '#9a4a3c'};

function puzzleBody(id, st, ui) {
  if (id === 'organ') {
    const hist = st.guesses.map(g => { const f = codeFeedback(st.code, g); return `<div class="pg"><span>${g.map(i => `<i class="stop s${i}">${STOPS[i]}</i>`).join('')}</span><b title="right stop, right place">${'●'.repeat(f.exact)}</b><b class="nr" title="right stop, wrong place">${'○'.repeat(f.near)}</b></div>`; }).join('');
    return `<p class="dim">Four of these five stops, in the right order. ● = right stop in the right place · ○ = right stop, wrong place.</p>
      <div class="pgh">${hist || '<small>No attempts yet.</small>'}</div>
      ${ui ? `<div class="slots">${[0, 1, 2, 3].map(i => `<span class="slot" data-pz="unslot" data-i="${i}">${ui.cur[i] != null ? `<i class="stop s${ui.cur[i]}">${STOPS[ui.cur[i]]}</i>` : '—'}</span>`).join('')}</div>
        <div class="palette">${STOPS.map((n, i) => `<button class="small stop s${i}" data-pz="pick" data-i="${i}">${n}</button>`).join('')}</div>` : ''}`;
  }
  if (id === 'desk') {
    let cells = '';
    st.grid.forEach((row, y) => [...row].forEach((ch, x) => {
      const sel = ui && ui.sel === ch && ch !== '.';
      cells += `<div class="sc ${ch === '.' ? 'e' : 'p'} ${sel ? 'sel' : ''}" data-pz="cell" data-x="${x}" data-y="${y}" style="${ch !== '.' ? `background:${SLIDE_COLORS[ch] || '#6b4a2e'}` : ''}">${ch === 'K' ? '⚿' : ''}</div>`;
    }));
    return `<p class="dim">Slide the brass key bar (⚿) out through the gap on the right. Tap a bolt, then tap an empty square along its line. Each slide is 1 step.</p><div class="slide"><div class="sgrid">${cells}</div><div class="sexit">gap ▶</div></div>`;
  }
  if (id === 'photo') {
    return `<p class="dim">Rebuild the photograph. Tap two pieces to swap them, or tap one and press Rotate. Each swap or rotation is 1 step.</p>
      <div class="pgrid">${st.tiles.map((t, i) => `<div class="pt ${ui && ui.sel === i ? 'sel' : ''}" data-pz="tile" data-i="${i}"><div style="transform:rotate(${t.r * 90}deg);width:100%;height:100%">${photoSVG((t.p % 3) * 100, Math.floor(t.p / 3) * 100)}</div></div>`).join('')}</div>
      ${ui ? `<div class="row" style="justify-content:center;margin-top:8px"><button class="small" data-pz="rotate" ${ui.sel == null ? 'disabled' : ''}>Rotate ↻</button></div>` : ''}`;
  }
  if (id === 'engine') {
    const wet = wetCells(st);
    return `<p class="dim">Turn the valves until water runs from the inlet (left) to the drain (right). Tap a pipe to turn it a quarter. Each turn is 1 step.</p>
      <div class="pipes"><div class="pin" style="grid-row:${st.r0 + 1}">▶</div><div class="pg4">${st.grid.map((t, i) => `<div class="pp" data-pz="pipe" data-i="${i}">${pipeTileSVG(t, wet.has(i))}</div>`).join('')}</div><div class="pout" style="grid-row:${st.r1 + 1}">▶</div></div>`;
  }
  return '';
}
function puzzleSolvedNow(id, st) {
  if (id === 'organ') return st.guesses.some(g => codeFeedback(st.code, g).exact === 4);
  if (id === 'desk') return slideSolved(st.grid);
  if (id === 'photo') return st.tiles.every((t, i) => t.p === i && t.r === 0);
  if (id === 'engine') return pipesSolved(st);
}

function runPuzzle(D, id, inv) {
  const P = PUZZLES[id];
  const st = clone(D.puzzles[id]);
  let steps = skillVal(D, inv, P.skill), wrong = 0;
  const dark = inDark(D, inv);
  const ui = {cur: [], sel: null};
  return new Promise(resolve => {
    const m = openModal('<div id="pz"></div>', 'puzzle');
    const finish = () => { st.solved = puzzleSolvedNow(id, st); m.remove(); pzBroadcast(null); resolve({state: st, wrong}); };
    const spend = () => { inv.clues--; steps++; draw(); };
    const use = () => { steps--; if (puzzleSolvedNow(id, st)) { st.solved = true; draw(); setTimeout(finish, 900); return; } draw(); };
    const draw = () => {
      const solved = puzzleSolvedNow(id, st);
      const canClue = !solved && !dark && inv.clues > 0;
      $('#pz', m).innerHTML = `<div class="eyebrow">${esc(INVD(inv.id).name)} · ${SKILL_NAMES[P.skill]} puzzle</div><h2>${esc(P.n)}</h2>
        <div class="pzbar"><span class="steps">${solved ? '<b class="pass">Solved!</b>' : `Steps left: <b>${steps}</b>`}</span>
        ${canClue ? `<button class="small" data-pz="clue">Spend a Clue: +1 step <small>(${inv.clues} left)</small></button>` : dark && !solved ? '<small>Darkness: no Clues.</small>' : ''}</div>
        ${puzzleBody(id, st, solved || steps <= 0 ? null : ui)}
        ${id === 'organ' && !solved && steps > 0 ? `<div class="row" style="justify-content:center"><button class="primary" data-pz="guess" ${ui.cur.filter(x => x != null).length === 4 ? '' : 'disabled'}>Pull the stops (1 step)</button></div>` : ''}
        <div class="btns"><button class="${solved || steps <= 0 ? 'primary' : 'ghost'}" data-pz="quit">${solved ? 'Continue' : steps <= 0 ? 'Out of steps — progress is kept' : 'Stop for now (progress is kept)'}</button></div>`;
      pzBroadcast({id, st, who: inv.id, steps});
    };
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-pz]'); if (!b || b.disabled) return;
      const a = b.dataset.pz;
      if (a === 'quit') return finish();
      if (a === 'clue') return spend();
      if (steps <= 0 || puzzleSolvedNow(id, st)) return;
      if (id === 'organ') {
        if (a === 'pick') { const i = +b.dataset.i; const k = ui.cur.findIndex(x => x == null); if (k >= 0) ui.cur[k] = i; else if (ui.cur.length < 4) ui.cur.push(i); draw(); }
        else if (a === 'unslot') { ui.cur[+b.dataset.i] = null; draw(); }
        else if (a === 'guess') { const g = ui.cur.slice(0, 4); if (g.some(x => x == null)) return; st.guesses.push(g); if (codeFeedback(st.code, g).exact < 4) wrong++; ui.cur = []; use(); }
      } else if (id === 'desk' && a === 'cell') {
        const x = +b.dataset.x, y = +b.dataset.y, ch = st.grid[y][x];
        if (ch !== '.') { ui.sel = ui.sel === ch ? null : ch; draw(); return; }
        if (!ui.sel) return;
        const Pc = slidePieces(st.grid)[ui.sel]; if (!Pc) { ui.sel = null; draw(); return; }
        const xs = Pc.cells.map(c => c[0]), ys = Pc.cells.map(c => c[1]);
        let dist = 0;
        if (Pc.horiz && y === ys[0]) dist = x > Math.max(...xs) ? x - Math.max(...xs) : x < Math.min(...xs) ? x - Math.min(...xs) : 0;
        if (!Pc.horiz && x === xs[0]) dist = y > Math.max(...ys) ? y - Math.max(...ys) : y < Math.min(...ys) ? y - Math.min(...ys) : 0;
        if (ui.sel === 'K' && Pc.horiz && y === ys[0] && x === 4 && !dist) dist = 5 - Math.min(...xs);
        if (ui.sel === 'K' && dist > 0 && Math.max(...xs) + dist >= 4) { const out = slideMove(st.grid, 'K', 5 - Math.min(...xs)); if (out) { st.grid = out; st.moves++; use(); return; } }
        const n = dist && slideMove(st.grid, ui.sel, dist);
        if (n) { st.grid = n; st.moves++; use(); } else toast('Something is in the way.');
      } else if (id === 'photo') {
        if (a === 'tile') { const i = +b.dataset.i; if (ui.sel == null) ui.sel = i; else if (ui.sel === i) ui.sel = null; else { [st.tiles[ui.sel], st.tiles[i]] = [st.tiles[i], st.tiles[ui.sel]]; ui.sel = null; use(); return; } draw(); }
        else if (a === 'rotate' && ui.sel != null) { st.tiles[ui.sel].r = (st.tiles[ui.sel].r + 1) % 4; use(); }
      } else if (id === 'engine' && a === 'pipe') { const t = st.grid[+b.dataset.i]; t.r = (t.r + 1) % 4; st.turns++; use(); }
    });
    draw();
  });
}

// ---------- watching someone else solve a puzzle (online)
let pzWatch = null;
function pzBroadcast(p) {
  if (G.mode !== 'online' || !G.net) return;
  const msg = {t: 'pz', p};
  if (G.net.role === 'host') broadcast(msg); else send(G.net.conn, msg);
}
function pzShow(p) {
  if (!p) { if (pzWatch) { pzWatch.remove(); pzWatch = null; } return; }
  if (!pzWatch) pzWatch = openModal('<div id="pzw"></div>', 'puzzle watch');
  const P = PUZZLES[p.id];
  $('#pzw', pzWatch).innerHTML = `<div class="eyebrow">Watching · ${esc(INVD(p.who).name)}</div><h2>${esc(P.n)}</h2><div class="pzbar"><span>Steps left: <b>${p.steps}</b></span></div>${puzzleBody(p.id, p.st, null)}<p class="dim" style="text-align:center">Only ${esc(INVD(p.who).name.split(' ')[0])}'s player can move the pieces.</p>`;
}
