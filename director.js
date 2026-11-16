/* Greywater — the Director and bad-luck protection.
   The Director reads how the game is going once per round and leans on four things by at most 10%:
   dice luck, which Mythos events come up, whether Mythos spawns arrive, and how readily fire spreads.
   mood > 0: the investigators are in real trouble, so it eases off. mood < 0: they are cruising, so it presses.
   In the wide middle band it does nothing at all. Skill and target numbers of tests are never changed.
   Bad-luck protection is separate: failing the same check again and again makes each die a bit kinder, and the
   3rd-5th attempt in a row (picked at random) is a guaranteed pass. */
const DIRECTOR = {cap: 0.10, dead: 0.4, span: 0.5, center: -0.2, pityStep: 0.10, pityMax: 0.30, pityMinChance: 0.2,
  tone: {bell: 1, footsteps: 1, hymn: 1, seep: 1, lights: 1, whisper: 1, breath: -1, quiet: -1}};

function dirProgress(S) { return SCN && SCN.progress ? SCN.progress(S) : 0.5; }
function dirPressure(S) {
  const all = S.inv, alive = all.filter(v => !v.out);
  if (!alive.length) return 0;
  const frac = v => { return Math.min((maxHp(v) - v.dmg.length) / maxHp(v) + (v.wounded ? -0.25 : 0), (maxSan(v) - v.hor.length) / maxSan(v) + (v.insane ? -0.25 : 0)); };
  const hurt = 1 - alive.reduce((a, v) => a + Math.max(0, frac(v)), 0) / alive.length + 0.5 * (all.length - alive.length) / all.length;
  const near = alive.filter(v => S.monsters.some(m => roomOf(m.space) === roomOf(v.space))).length / alive.length;
  const behind = S.threat / (S.threatMax || CONFIG.threatMax) - dirProgress(S);
  return 1.4 * (hurt - 0.35) + 0.4 * (near - 0.3) + 1.6 * behind - DIRECTOR.center;
}
function dirUpdate(S) {
  const x = dirPressure(S), a = Math.abs(x);
  const mood = a <= DIRECTOR.dead ? 0 : Math.sign(x) * Math.min(1, (a - DIRECTOR.dead) / DIRECTOR.span);
  S.dir = {x: Math.round(x * 100) / 100, mood: Math.round(mood * 100) / 100};
}
const dirMood = S => (S.opt && S.opt.dir === false) ? 0 : ((S.dir && S.dir.mood) || 0);

// one die: 3 in 8 success, 2 in 8 clue, 3 in 8 blank — the success share leans by the Director's mood and any bad-luck bonus
function rollFace(S, extra = 0) {
  const pS = 0.375 * (1 + DIRECTOR.cap * dirMood(S) + extra), r = Math.random();
  return r < pS ? 'S' : r < pS + 0.25 ? 'C' : 'B';
}
function pityBonus(S, inv, key) {
  if (!key || (S.opt && S.opt.pity === false)) return 0;
  return Math.min(DIRECTOR.pityMax, DIRECTOR.pityStep * ((inv.pity || {})[key] || 0));
}
// chance of at least `need` successes on n honest dice (3 in 8 each)
function passChance(n, need) {
  const p = 0.375; let c = 1, miss = 0;
  for (let k = 0; k < need && k <= n; k++) { miss += c * Math.pow(p, k) * Math.pow(1 - p, n - k); c = c * (n - k) / (k + 1); }
  return need > n ? 0 : 1 - miss;
}
function pityMark(inv, key, ok) {
  if (!key) return;
  inv.pity = inv.pity || {}; inv.pityAt = inv.pityAt || {};
  if (ok) { delete inv.pity[key]; delete inv.pityAt[key]; }
  else { inv.pity[key] = (inv.pity[key] || 0) + 1; if (!inv.pityAt[key]) inv.pityAt[key] = 3 + Math.floor(Math.random() * 3); }
}
// Guaranteed success: the 3rd, 4th or 5th try in a row at the same check (decided secretly at the first failure) always passes.
// Turns just enough dice into successes; returns true if it had to step in.
function pityForce(S, inv, key, faces, need, counts) {
  if (!key || (S.opt && S.opt.pity === false)) return false;
  const at = (inv.pityAt || {})[key];
  if (!at || ((inv.pity || {})[key] || 0) + 1 < at) return false;
  // Not for long shots: if this investigator would pass less than 1 time in 5 on honest dice, repeating the attempt earns nothing.
  if (passChance(faces.length, need || 1) < DIRECTOR.pityMinChance) return false;
  const want = Math.min(faces.length, need || 1);
  let have = faces.filter(counts).length, changed = false;
  for (let i = 0; i < faces.length && have < want; i++) if (!counts(faces[i])) { faces[i] = 'S'; have++; changed = true; }
  return changed;
}
function dirPickEvent(S, opts) {
  const m = dirMood(S), w = opts.map(o => Math.max(0.01, 1 - DIRECTOR.cap * m * (DIRECTOR.tone[o.id] || 0)));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < opts.length; i++) { r -= w[i]; if (r <= 0) return opts[i]; }
  return opts[opts.length - 1];
}
