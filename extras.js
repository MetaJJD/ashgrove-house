'use strict';
/* Stage 2 rules: spells (hidden backs), fire & flood, puzzle state. Loaded after actions.js. */

// ================================================================ SPELLS
// Each spell's back is drawn at random only at the moment it is cast; afterwards you "gain a fresh copy".
const SPELLS = {
  wither: {n: 'Withering Word', type: 'attack', front: 'Attack a monster within range (your room), testing Lore. Then flip.',
    backs: [
      {t: 'Deal damage equal to your successes. If you rolled 3 or more, you also suffer 1 Horror.', fx: (D, inv, s, m) => { hitMonster(D, m, s, `${nm(inv)}'s Withering Word strikes`, inv.id); if (s >= 3) scare(D, inv, 1, 'the word takes something back'); }},
      {t: 'Deal your successes +1 damage. If you rolled 0, suffer 2 Horror.', fx: (D, inv, s, m) => { if (s === 0) scare(D, inv, 2, 'the word turns inward'); else hitMonster(D, m, s + 1, `${nm(inv)}'s Withering Word strikes`, inv.id); }},
      {t: 'Deal damage equal to your successes. If the monster is destroyed, gain 1 Clue.', fx: (D, inv, s, m) => { const before = D.monsters.includes(m); hitMonster(D, m, s, `${nm(inv)}'s Withering Word strikes`, inv.id); if (before && !D.monsters.includes(m)) { inv.clues++; log(D, `${nm(inv)} understands it a little better as it dies (+1 Clue).`, 'clue'); } }},
    ]},
  binding: {n: 'Binding Thread', type: 'action', target: 'monster', front: 'Choose a monster within range (your room). Test Lore, then flip.',
    backs: [
      {t: '1+ successes: it cannot move during the next Mythos phase.', fx: (D, inv, s, m) => { if (s >= 1) { m.bound = 'move'; log(D, `The ${MONSTERS[m.type].n} is bound in place.`, 'good'); } else log(D, 'The thread slips loose.'); }},
      {t: '2+ successes: it cannot move or attack during the next Mythos phase. 0 successes: you become Restrained (only 1 action next turn).', fx: (D, inv, s, m) => { if (s >= 2) { m.bound = 'all'; log(D, `The ${MONSTERS[m.type].n} is bound completely.`, 'good'); } else if (s === 0) { inv.restrained = true; log(D, `The thread wraps around ${nm(inv)} instead. Restrained.`, 'bad'); } else log(D, 'The thread holds for a moment, then fails.'); }},
      {t: '1+ successes: it cannot move during the next Mythos phase, but you suffer 1 Horror.', fx: (D, inv, s, m) => { if (s >= 1) { m.bound = 'move'; log(D, `The ${MONSTERS[m.type].n} is bound in place.`, 'good'); scare(D, inv, 1, 'holding the thread'); } else log(D, 'The thread slips loose.'); }},
    ]},
  mend: {n: 'Mend the Flesh', type: 'action', target: 'ally', front: 'You or an investigator in your space. Flip.',
    backs: [
      {t: 'Discard 2 face-down Damage from them. You suffer 1 Horror.', test: null, fx: (D, inv, s, t) => { const n = discardDown(t, 'dmg', 2); log(D, `${nm(t)}'s wounds close (${n} Damage discarded).`, 'good'); scare(D, inv, 1, 'the flesh moves under your hands'); }},
      {t: 'Test Lore. Discard that many Damage from them (face-up cards too).', test: 'lore', fx: (D, inv, s, t) => { let k = 0; while (k < s && t.dmg.length) { t.dmg.pop(); k++; } log(D, `${nm(t)}'s wounds close (${k} Damage discarded).`, k ? 'good' : ''); }},
      {t: 'Discard 1 face-down Damage from them. The hidden clock moves forward.', fx: (D, inv, s, t) => { discardDown(t, 'dmg', 1); D.threat++; log(D, `${nm(t)} is mended, but the building noticed.`, 'bad'); }},
    ]},
  quiet: {n: 'Quiet the Mind', type: 'action', target: 'ally', front: 'You or an investigator in your space. Flip.',
    backs: [
      {t: 'Discard 2 face-down Horror from them.', fx: (D, inv, s, t) => { const n = discardDown(t, 'hor', 2); log(D, `${nm(t)}'s thoughts go still (${n} Horror discarded).`, 'good'); }},
      {t: 'Test Will. Discard that many Horror from them (face-up cards too). If you rolled 0, suffer 1 Damage.', test: 'will', fx: (D, inv, s, t) => { let k = 0; while (k < s && t.hor.length) { t.hor.pop(); k++; } log(D, `${nm(t)} breathes again (${k} Horror discarded).`, k ? 'good' : ''); if (s === 0) hurt(D, inv, 1, 'a nosebleed that won’t stop'); }},
      {t: 'Discard 1 face-down Horror from them, and you gain 1 Clue.', fx: (D, inv, s, t) => { discardDown(t, 'hor', 1); inv.clues++; log(D, `${nm(inv)} glimpses something in ${t === inv ? 'their own' : nm(t) + "'s"} mind (+1 Clue).`, 'clue'); }},
    ]},
  veil: {n: 'Veil of Fog', type: 'reaction', front: 'When you evade, you may test Lore instead of Agility. Then flip.',
    backs: [
      {t: 'No further effect.', fx: () => {}},
      {t: 'If you passed, you may move 1 extra space this turn.', fx: (D, inv, ok) => { if (ok) { D.moveLeft += 1; log(D, `${nm(inv)} drifts through the fog (+1 move).`, 'good'); } }},
      {t: 'If you failed, you also suffer 1 Horror.', fx: (D, inv, ok) => { if (!ok) scare(D, inv, 1, 'the fog closes over their face'); }},
    ]},
  hymn: {n: 'Hear the Hymn', type: 'action', front: 'Test Lore, then flip.',
    backs: [
      {t: '2+ successes: learn where one piece of Evidence lies.', fx: (D, inv, s) => { if (s >= 2) hearEvidence(D, inv); else log(D, 'The hymn is too faint to follow.'); }},
      {t: '1+ successes: peek into an unexplored room. 0 successes: a Choir appears nearby.', fx: (D, inv, s) => { if (s >= 1) peekRoom(D, inv); else log(D, spawn(D, 'choir', nearSpace(D, inv)), 'bad'); }},
      {t: '2+ successes: gain 2 Clues. Otherwise suffer 1 Horror.', fx: (D, inv, s) => { if (s >= 2) { inv.clues += 2; log(D, `${nm(inv)} hums along and understands (+2 Clues).`, 'clue'); } else scare(D, inv, 1, 'the hymn hums back'); }},
    ]},
  still: {n: 'Still Water', type: 'reaction', front: 'When you would suffer 2 or more Damage, this is cast automatically. Flip.',
    backs: [
      {t: 'Prevent 2 of that Damage.', prevent: n => Math.max(0, n - 2)},
      {t: 'Prevent all of that Damage, but suffer 1 Horror instead.', prevent: n => 0, horror: 1},
      {t: 'Prevent 1 of that Damage.', prevent: n => Math.max(0, n - 1)},
    ]},
};
const spellsOf = inv => inv.spells || (inv.spells = []);
function gainSpell(D, inv, id) {
  if (spellsOf(inv).includes(id)) { inv.clues++; log(D, `${nm(inv)} already knows ${SPELLS[id].n} (+1 Clue instead).`, 'clue'); return; }
  inv.spells.push(id);
  story(D, `Spell: ${SPELLS[id].n}`, `${nm(inv)} learns a spell.\n\n${SPELLS[id].front}\n\nWhat happens when it is cast stays hidden until then.`, 'spell');
  log(D, `${nm(inv)} learns ${SPELLS[id].n}.`, 'clue');
}
function flipSpell(D, inv, id) {
  const S = SPELLS[id], i = rnd(S.backs.length), b = S.backs[i];
  log(D, `${nm(inv)} casts ${S.n}. Flipped: “${b.t}”`, 'myth');
  D.flip = {seq: (D.flip ? D.flip.seq : 0) + 1, who: inv.id, spell: id, back: i};
  return b;
}
function hearEvidence(D, inv) {
  const open = D.evLive.filter(k => !D.evidence.includes(EVIDENCE[k].n));
  if (!open.length) { inv.clues++; log(D, 'The hymn has nothing left to tell (+1 Clue).', 'clue'); return; }
  const k = pick(open);
  const where = SEARCH[k] ? `${SEARCH[k].n} in the ${ROOMS[Object.keys(ROOMS).find(r => ROOMS[r].tokens.some(t => t[2] === k))].n}` : `${INTERACT[k].n} in the ${ROOMS[Object.keys(ROOMS).find(r => ROOMS[r].tokens.some(t => t[2] === k))].n}`;
  story(D, 'Hear the Hymn', `Under the singing, a single clear voice tells ${first(inv)} where to look: the ${where}.`, 'spell');
}
function peekRoom(D, inv) {
  const t = exploreTargets(D)[0];
  if (!t) { log(D, 'Every door is already open.'); return; }
  const R = ROOMS[t.room];
  story(D, 'Hear the Hymn', `In the song, ${first(inv)} sees the ${R.n}: “${R.d}”${R.spawn ? ' Something is waiting in there.' : ''}`, 'spell');
}
function nearSpace(D, inv) {
  const n = ADJ[inv.space].filter(a => passable(D, a.link)).map(a => a.to);
  return n.length ? pick(n) : inv.space;
}

// ============================================================ FIRE & FLOOD
const fireAt = (D, s) => !!(D.fire && D.fire[s]);
const floodAt = (D, s) => !!(D.flood && D.flood[s]) || waterAt(D, s) >= 1;
// the tide puts out fires in the spaces it reaches
function floodFromTide(D, L) {
  for (const s of Object.keys(D.fire || {})) if (waterAt(D, s) >= 1) { delete D.fire[s]; if (L) say(D, L, `The tide puts out the fire in ${SP[s].n}.`); }
}
function setFire(D, s, L) {
  D.fire = D.fire || {}; D.flood = D.flood || {};
  if (D.flood[s]) { delete D.flood[s]; say(D, L, `Fire meets water in ${SP[s].n}: steam, and both are gone.`); return; }
  if (waterAt(D, s) >= 1) { say(D, L, `Sparks hiss out in the water in ${SP[s].n}.`); return; }
  if (D.fire[s]) return;
  D.fire[s] = true;
  say(D, L, `Fire breaks out in the ${ROOMS[roomOf(s)].n} (${SP[s].n}).`, 'bad');
}
function setFlood(D, s, L) {
  D.fire = D.fire || {}; D.flood = D.flood || {};
  if (D.fire[s]) { delete D.fire[s]; say(D, L, `Water pours over the fire in ${SP[s].n} and puts it out.`); }
  if (D.flood[s]) return;
  D.flood[s] = true;
  say(D, L, `Black water floods the ${ROOMS[roomOf(s)].n} (${SP[s].n}).`, 'bad');
}
function spreadFire(D, L) {
  const fires = Object.keys(D.fire || {});
  if (!fires.length || Math.random() >= CONFIG.fireSpread * (1 - DIRECTOR.cap * dirMood(D))) return;
  if (CONFIG.fireCap && fires.length >= CONFIG.fireCap) return;
  const opts = [];
  for (const f of fires) for (const a of ADJ[f]) if (passable(D, a.link) && !fireAt(D, a.to)) opts.push(a.to);
  if (!opts.length) return;
  const s = pick(opts);
  say(D, L, 'The fire spreads.', 'bad');
  setFire(D, s, L);
}
function fireHurtsInv(D, inv, L, why) { if (!inv.out && fireAt(D, inv.space)) hurt(D, inv, 1, why || 'the flames', L); }
function fireHurtsMon(D, m, L) {
  if (!fireAt(D, m.space)) return;
  const M = MONSTERS[m.type];
  m.wounds += 1;
  say(D, L, `The ${M.n.replace(/^The /, "")} burns.`, 'good');
  if (m.wounds >= monHp(m)) { D.monsters = D.monsters.filter(x => x !== m); say(D, L, `The ${M.n.replace(/^The /, "")} is destroyed by the fire.`, 'good'); if (M.boss) bossDown(D); }
}

// ================================================================ PUZZLES
// Puzzle state lives in D.puzzles[id]. Generators are deterministic given Math.random at setup.
const PUZZLES = {
  organ: {n: 'The Hymn Stops', type: 'code', skill: 'lore'},
  desk: {n: "Marrow's Desk", type: 'slide', skill: 'obs'},
  photo: {n: 'The Torn Photograph', type: 'picture', skill: 'obs'},
  engine: {n: 'The Engine Valves', type: 'pipes', skill: 'str'},
  // Chapter 2
  lens: {n: 'The Lens', type: 'lens', skill: 'obs'},
  signal: {n: 'The Signal Key', type: 'signal', skill: 'lore'},
  tidelock: {n: 'The Tide-Lock', type: 'code', skill: 'lore', syms: ['Ebb', 'Flood', 'Neap', 'Spring', 'Slack'],
    hint: 'The strongbox lock turns through the tide words. Four of these five, in the right order. ● = right word in the right place · ○ = right word, wrong place.'},
  knots: {n: 'Thirteen Knots', type: 'slide', skill: 'agi', piece: '⚓', text: 'Work the bell clapper (⚓) free of the knotted rope: slide it out through the gap on the right. Tap a knot, then tap an empty square along its line. Each slide is 1 step.'},
};
const STOPS = ['Vox', 'Flute', 'Reed', 'Bourdon', 'Celeste'];
// Sliding-block layouts: 5×5, key bar 'K' on row 2 must slide out to the right. Verified solvable.
const SLIDE_LEVELS = [ // solver-verified, 5–6 moves
  ['.DCC.', '.DE..', 'KKEFB', '...FB', '.AA..'],
  ['EAAA.', 'E..D.', 'KK.D.', '...B.', '...B.'],
  ['..BBB', '..EGC', 'KKEGC', '....A', '..FFA'],
  ['.CCC.', '..F..', 'KKFD.', '.A.D.', '.AEE.'],
  ['A.BBB', 'A..C.', 'KK.C.', '.DDE.', '...E.'],
];
const makeCode = () => ({code: shuffle([0, 1, 2, 3, 4]).slice(0, 4), guesses: [], solved: false});
const makeSlide = () => ({grid: pick(SLIDE_LEVELS).slice(), moves: 0, solved: false});
function makePuzzles() {
  const P = {};
  P.organ = makeCode();
  P.desk = makeSlide();
  let tiles = Array.from({length: 9}, (_, i) => ({p: i, r: 0}));
  for (let k = 0; k < 6; k++) {
    if (Math.random() < 0.5) { const a = rnd(9), b = rnd(9); [tiles[a], tiles[b]] = [tiles[b], tiles[a]]; }
    else tiles[rnd(9)].r = (tiles[rnd(9)].r + 1) % 4;
  }
  if (tiles.every((t, i) => t.p === i && t.r === 0)) { [tiles[0], tiles[4]] = [tiles[4], tiles[0]]; tiles[2].r = 1; }
  P.photo = {tiles, solved: false};
  P.engine = makePipes();
  return P;
}
// pipes: 4×4 grid; inlet left of (0, r0), outlet right of (3, r1). Tile = {c: [dirs], r: rot}; dirs 0=N,1=E,2=S,3=W
function makePipes() {
  const W = 4, H = 4, r0 = rnd(H);
  const cells = {}; let x = 0, y = r0, from = 3;
  const path = [];
  while (true) {
    const ty = x === W - 1 ? rnd(H) : rnd(H);
    while (y !== ty) { const d = ty > y ? 2 : 0; path.push({x, y, a: from, b: d}); from = (d + 2) % 4; y += d === 2 ? 1 : -1; }
    path.push({x, y, a: from, b: 1}); from = 3;
    if (x === W - 1) break; x++;
  }
  const grid = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const p = path.find(q => q.x === i && q.y === j);
    let c = p ? [p.a, p.b] : (Math.random() < 0.5 ? [0, 2] : [0, 1]);
    grid.push({c, r: p ? 0 : rnd(4), path: !!p});
  }
  // scramble about half the path tiles by 1–2 clockwise turns (so each needs 2–3 more turns to fix)
  const pathIdx = grid.map((t, i) => t.path ? i : -1).filter(i => i >= 0);
  shuffle(pathIdx).slice(0, Math.max(3, Math.ceil(pathIdx.length / 2))).forEach(i => grid[i].r = 2 + rnd(2));
  const st = {grid, r0, r1: path[path.length - 1].y, W, H, solved: false, turns: 0};
  if (pipesSolved(st)) st.grid[path[0].y * W + path[0].x].r = (st.grid[path[0].y * W + path[0].x].r + 1) % 4;
  return st;
}
const pipeDirs = t => t.c.map(d => (d + t.r) % 4);

// lens: a 4×4 grid of glass. The beam enters from the left on row r0, moving east; '/' and '\\' mirrors turn it.
// Tap a mirror to flip it. Solved when the beam leaves through the right edge on row r1 — out to sea.
const LENS_TURN = {'/': {1: 0, 0: 1, 3: 2, 2: 3}, '\\': {1: 2, 2: 1, 3: 0, 0: 3}};   // moving dir -> new dir (0 N, 1 E, 2 S, 3 W)
function makeLens() {
  const W = 4, H = 4, r0 = rnd(H);
  let x = 0, y = r0, from = 3; const path = [];
  while (true) {
    const ty = rnd(H);
    while (y !== ty) { const d = ty > y ? 2 : 0; path.push({x, y, a: from, b: d}); from = (d + 2) % 4; y += d === 2 ? 1 : -1; }
    path.push({x, y, a: from, b: 1}); from = 3;
    if (x === W - 1) break; x++;
  }
  const grid = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const p = path.find(q => q.x === i && q.y === j);
    if (p) {
      const move = (p.a + 2) % 4;
      if (move === p.b) grid.push({m: null, path: true});
      else grid.push({m: LENS_TURN['/'][move] === p.b ? '/' : '\\', path: true});
    } else grid.push({m: Math.random() < 0.5 ? null : pick(['/', '\\']), path: false});
  }
  const mirrors = grid.map((t, i) => t.path && t.m ? i : -1).filter(i => i >= 0);
  shuffle(mirrors).slice(0, Math.max(2, Math.ceil(mirrors.length * 0.6))).forEach(i => grid[i].m = grid[i].m === '/' ? '\\' : '/');
  const st = {grid, r0, r1: path[path.length - 1].y, W, H, solved: false, flips: 0};
  if (lensSolved(st)) { const i = mirrors[0]; if (i != null) grid[i].m = grid[i].m === '/' ? '\\' : '/'; }
  return st;
}
function lensBeam(st) {
  const {W, H, grid} = st, lit = [];
  let x = 0, y = st.r0, dir = 1;
  for (let g = 0; g < 40; g++) {
    if (x < 0 || x >= W || y < 0 || y >= H) return {lit, out: {x, y, dir}};
    lit.push(y * W + x);
    const t = grid[y * W + x];
    if (t.m) dir = LENS_TURN[t.m][dir];
    if (dir === 0) y--; else if (dir === 2) y++; else if (dir === 1) x++; else x--;
  }
  return {lit, out: null};
}
const lensSolved = st => { const o = lensBeam(st).out; return !!o && o.x === st.W && o.y === st.r1; };

// signal: the lamp flashes a sequence of six colours; key it back in, one colour per step
const SIGNAL_COLS = ['#e8433b', '#4fbf6b', '#f2efe4', '#e8b23b'];
const SIGNAL_NAMES = ['Red', 'Green', 'White', 'Amber'];
const makeSignal = () => ({seq: Array.from({length: 6}, () => rnd(4)), prog: 0, solved: false});
function pipesSolved(st) {
  const {W, H, grid} = st;
  let x = 0, y = st.r0, from = 3;
  const seen = new Set();
  for (let guard = 0; guard < 40; guard++) {
    if (x < 0 || x >= W || y < 0 || y >= H) return false;
    const t = grid[y * W + x], ds = pipeDirs(t);
    if (!ds.includes(from)) return false;
    const out = ds.find(d => d !== from);
    if (x === W - 1 && y === st.r1 && out === 1) return true;
    const k = x + ',' + y; if (seen.has(k)) return false; seen.add(k);
    if (out === 0) y--; else if (out === 2) y++; else if (out === 1) x++; else x--;
    from = (out + 2) % 4;
  }
  return false;
}
function codeFeedback(code, guess) {
  let exact = 0, near = 0;
  guess.forEach((g, i) => { if (code[i] === g) exact++; else if (code.includes(g)) near++; });
  return {exact, near};
}
function slidePieces(grid) {
  const P = {};
  grid.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') (P[ch] = P[ch] || []).push([x, y]); }));
  for (const k of Object.keys(P)) { const c = P[k]; P[k] = {cells: c, horiz: c.length > 1 && c[0][1] === c[1][1]}; }
  return P;
}
function slideMove(grid, id, dist) {
  // returns new grid or null. dist: signed number of cells along the piece's axis.
  const P = slidePieces(grid)[id]; if (!P || !dist) return null;
  const g = grid.map(r => [...r]);
  P.cells.forEach(([x, y]) => g[y][x] = '.');
  const step = Math.sign(dist);
  for (let k = 1; k <= Math.abs(dist); k++) for (const [x, y] of P.cells) {
    const nx = x + (P.horiz ? k * step : 0), ny = y + (P.horiz ? 0 : k * step);
    if (id === 'K' && nx >= 5) continue;
    if (nx < 0 || ny < 0 || nx >= 5 || ny >= 5 || g[ny][nx] !== '.') return null;
  }
  const out = id === 'K' && P.cells.some(([x]) => x + dist >= 5);
  if (!out) P.cells.forEach(([x, y]) => { const nx = x + (P.horiz ? dist : 0), ny = y + (P.horiz ? 0 : dist); g[ny][nx] = id; });
  return g.map(r => r.join(''));
}
const slideSolved = grid => !grid.some(r => r.includes('K'));

// called after every action (UI and sims): flames hurt anyone who acts in them; turn ends when spent
function afterAction(D, kind) {
  const inv = D.active >= 0 ? D.inv[D.active] : null;
  if (inv && !['move', 'extinguish', 'start', 'endturn', 'endphase'].includes(kind) && fireAt(D, inv.space)) hurt(D, inv, 1, 'acting in the flames');
  // Chapter 2: acting while Submerged costs an Agility test (need 1) or 1 Damage (Nell is at home in the water)
  if (inv && !inv.out && !['move', 'start', 'endturn', 'endphase', 'tidetables'].includes(kind) && waterAt(D, inv.space) >= 2 && inv.id !== 'nell' && autoTest(D, inv, 'agi') < 1) hurt(D, inv, 1, 'the cold, dragging water');
  if (D.active >= 0) { const a = D.inv[D.active]; if (a.out || (D.actions <= 0 && D.moveLeft <= 0)) { D.done[D.active] = true; D.active = -1; D.moveLeft = 0; } }
  if (kind === 'endturn' && D.active >= 0) { D.done[D.active] = true; D.active = -1; }
}
