'use strict';
/* Actions. Each takes (D, inv, arg, ctx) where ctx = {test(skill, opts) -> successes, gate() -> passed evade?}.
   Return false = nothing happened (no cost), 'free' = no action spent, anything else = one action spent
   (move manages its own cost). */

async function evade(D, inv, ctx) {
  const ms = monAt(D, inv.space);
  if (!ms.length) return true;
  const allChoir = ms.every(m => m.type === 'choir');
  let sk = allChoir ? 'will' : 'agi';
  const need = Math.max(1, Math.max(...ms.map(m => MONSTERS[m.type].aware)) - 1);
  let veil = false;
  if ((inv.spells || []).includes('veil') && ctx.ask) veil = await ctx.ask('Cast Veil of Fog?', `Test Lore (${skillVal(D, inv, 'lore')}) instead of ${SKILL_NAMES[sk]} (${skillVal(D, inv, sk)}) to evade. Its hidden back is revealed afterwards.`);
  if (veil) sk = 'lore';
  const s = await ctx.test(sk, {label: `Evade the ${ms.length > 1 ? 'monsters' : MONSTERS[ms[0].type].n}`, need});
  if (veil) flipSpell(D, inv, 'veil').fx(D, inv, s >= need);
  if (s >= need) { log(D, `${nm(inv)} slips past the ${ms.length > 1 ? 'monsters' : MONSTERS[ms[0].type].n}.`); return true; }
  const worst = ms.slice().sort((a, b) => MONSTERS[b.type].dmg - MONSTERS[a.type].dmg)[0];
  log(D, `${nm(inv)} fails to evade — the action is lost.`, 'bad');
  monsterAttack(D, worst, inv);
  return false;
}

function giveContent(D, inv, c, where) {
  if (c === 'nothing') { log(D, `${nm(inv)} searches ${where}: nothing but dust.`); return 'Nothing but dust.'; }
  if (c === 'clues2') { inv.clues += 2; log(D, `${nm(inv)} searches ${where} and pieces something together (+2 Clues).`, 'clue'); return 'Notes and scraps that fit together. +2 Clues.'; }
  if (c.startsWith('ev:')) { gainEvidence(D, inv, c.slice(3)); return null; }
  if (c === 'items') return null;
  if (c.startsWith('spell:')) { gainSpell(D, inv, c.slice(6)); return null; }
  inv.items.push(c);
  log(D, `${nm(inv)} searches ${where} and finds: ${ITEMS[c].n}.`, 'good');
  return `You find: ${ITEMS[c].n}. ${ITEMS[c].t}`;
}

const INTERACT = {
  frontdoors: {n: 'Front doors',
    info: S => S.goal === 'B' ? 'The chains have fallen away. Bring Ada Wren here and open them.' : 'Chained shut from the outside. They will not open.',
    can: (S, inv) => S.goal === 'B' && S.ada && S.ada.escort === inv.id && S.ada.space === inv.space ? [true] : [false, S.goal === 'B' ? 'Ada must be with you.' : 'They will not open.'],
    label: () => 'Open the doors and lead Ada out',
    async run(D, inv, ctx) { if (!(await ctx.gate())) return true; end(D, 'won', 'The doors swing open onto cold night air. Ada Wren steps out of Greywater and stops humming. Behind you, the building’s song falters — one voice short — and dies away into the lake.'); return true; }},
  phone: {n: 'Wall telephone', info: () => 'The receiver hangs off its hook, humming.', label: () => 'Listen (Will)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const s = await ctx.test('will', {label: 'Listen to the line', need: 1});
      if (s >= 1) { inv.clues++; removeToken(D, 'phone'); story(D, 'A voice on the line', 'Through the hiss, a woman whispers: “Don’t let him finish the song. Whatever you do, don’t let him finish. If they come for you, breathe out and become the fog.” Then a dial tone.\n\n+1 Clue.', 'story'); log(D, `${nm(inv)} hears a warning on the line (+1 Clue).`, 'clue'); gainSpell(D, inv, 'veil'); }
      else scare(D, inv, 1, 'the line is singing');
      return true;
    }},
  gramophone: {n: 'Gramophone', info: () => 'A record sits on the turntable, the needle raised.', label: () => 'Play the record (Lore, need 2)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const s = await ctx.test('lore', {label: 'Listen closely to the record', need: 2});
      if (s >= 2) { removeToken(D, 'gramophone'); if (D.evLive.includes('gramophone')) gainEvidence(D, inv, 'gramophone'); else { inv.clues += 2; log(D, `${nm(inv)} studies the recording (+2 Clues).`, 'clue'); } }
      else scare(D, inv, 1, 'thirteen voices, one note');
      return true;
    }},
  desk: {n: "Marrow's desk", info: () => 'The top drawer is locked and jammed.', label: () => 'Free the key (puzzle · Observation)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('desk', inv);
      D.puzzles.desk = r.state;
      if (r.state.solved) { removeToken(D, 'desk'); if (D.evLive.includes('desk')) gainEvidence(D, inv, 'desk'); else { inv.clues += 2; log(D, `${nm(inv)} finds Marrow's notes (+2 Clues).`, 'clue'); } }
      else log(D, `${nm(inv)} works at the jammed bolts.`);
      return true;
    }},
  organ: {n: 'Chapel organ', info: () => 'Thirteen stops. Someone has scratched numbers beside five of them.', label: () => 'Find the stops (puzzle · Lore)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('organ', inv);
      D.puzzles.organ = r.state;
      if (r.wrong) { D.noise = inv.id; log(D, `${nm(inv)} pulls the wrong stops${r.wrong > 1 ? ' ' + r.wrong + ' times' : ''}. The organ howls through the building.`, 'bad'); }
      if (r.state.solved) { removeToken(D, 'organ'); story(D, 'The organ', 'The right stops draw a chord that is almost the hymn — but not quite. In the gap, for a moment, you can hear what the hymn is for: it is calling something up out of the lake. The word for unmaking it rises in your throat.', 'story'); gainSpell(D, inv, 'wither'); }
      return true;
    }},
  photo: {n: 'Torn photograph', info: () => 'Pieces of a photograph lie scattered on the slab.', label: () => 'Piece it together (puzzle · Observation)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('photo', inv);
      D.puzzles.photo = r.state;
      if (r.state.solved) {
        removeToken(D, 'photo');
        if (D.goal === 'B' && D.ada && !D.ada.found) story(D, 'The photograph', `The ward, last spring. Thirteen patients. One girl is circled in ink: Ada Wren. Behind her you recognise the ${ROOMS[roomOf(D.ada.space)].n}.`, 'story');
        else { inv.clues += 2; log(D, `${nm(inv)} rebuilds the photograph (+2 Clues).`, 'clue'); }
      } else log(D, `${nm(inv)} can't make the pieces fit.`);
      return true;
    }},
  engine: {n: 'The Resonance Engine',
    info: S => S.goal === 'A' ? 'A machine of brass horns and copper coils. Turn its valves until the pipes run clear from end to end.' : 'A machine of brass horns and copper coils, humming one endless note. You don’t yet know what it is for.',
    can: (S, inv) => S.goal !== 'A' ? [false, 'You don’t know what it is for yet.'] : !invAt(S, inv.space).some(i => i.items.includes('valve')) ? [false, 'You need the Valve Wheel here.'] : [true],
    label: () => 'Turn the valves (puzzle · Strength)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('engine', inv);
      D.puzzles.engine = r.state;
      log(D, `${nm(inv)} turns the Engine's valves.`);
      if (r.state.solved) { end(D, 'won', 'The Valve Wheel turns, the horns crack, and the Engine dies with a sound like a breath let out. Below Greywater, the lake goes quiet — and stays quiet.'); return true; }
      for (const i of D.inv.filter(x => !x.out && roomOf(x.space) === 'hydro')) if (autoTest(D, i, 'will') < 1) scare(D, i, 1, 'the Engine sings');
      return true;
    }},
  pell: {n: 'Nurse Pell', person: true, info: () => 'A young nurse, crouched behind the desk with a letter opener. She is shaking.', label: () => 'Calm her (Influence)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const s = await ctx.test('inf', {label: 'Calm Nurse Pell', need: 1});
      if (s >= 1) {
        removeToken(D, 'pell');
        if (D.evLive.includes('pell')) gainEvidence(D, inv, 'pell');
        else { inv.items.push('bandages'); inv.clues++; story(D, 'Nurse Pell', 'She presses a roll of bandages into your hands. “Whatever you do, stay out of the basement after dark.” Then she slips away toward the front doors.\n\n+1 Clue, Bandages.', 'story'); }
      } else { D.threat++; D.noise = inv.id; log(D, `Pell screams and won't stop. Somewhere, something heard her.`, 'bad'); }
      return true;
    }},
  ada: {n: 'Ada Wren', person: true,
    info: S => S.ada && S.ada.escort ? `Ada is following ${nm(S.inv.find(i => i.id === S.ada.escort))}.` : 'Patient 13. She is humming, eyes unfocused.',
    can: (S, inv) => S.ada.escort === inv.id ? [false, 'She is already with you.'] : [true],
    label: S => S.ada && S.ada.escort ? 'Take her hand (she follows you instead)' : 'Calm her (Influence)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      if (D.ada.escort) { D.ada.escort = inv.id; log(D, `Ada now follows ${nm(inv)}.`); return true; }
      const s = await ctx.test('inf', {label: 'Reach Ada Wren', need: 1});
      if (s >= 1) { D.ada.escort = inv.id; story(D, 'Ada Wren', `Ada stops humming and looks at ${first(inv)} as if waking up. “Is it morning?” She takes ${first(inv)}'s hand and will follow them.`, 'story'); }
      else scare(D, inv, 1, 'Ada sings back at them, in a voice that is not hers');
      return true;
    }},
};
function removeToken(D, id) { D.tokens = D.tokens.filter(t => t.id !== id); }

const ACT = {
  async start(D, inv, i) {
    if (D.active >= 0 || D.done[i] || D.inv[i].out || D.phase !== 'play') return false;
    D.active = i; D.actions = CONFIG.actions; D.moveLeft = 0; D.ext = 0;
    if (D.inv[i].restrained) { D.inv[i].restrained = false; D.actions = 1; log(D, `${nm(D.inv[i])} is Restrained: only 1 action this turn.`, 'bad'); }
    log(D, `${nm(D.inv[i])} begins their turn.`);
    return 'free';
  },
  async endturn(D) { D.actions = 0; D.moveLeft = 0; return 'free'; },
  async move(D, inv, to, ctx) {
    const steps = D.moveLeft > 0 ? D.moveLeft : CONFIG.moveSpaces;
    const {dist} = moveDist(D, inv);
    const d = dist[to];
    if (d == null || to === inv.space) return false;
    let fresh = false;
    if (D.moveLeft < d) {
      if (d > CONFIG.moveSpaces || D.actions < 1) return false;
      if (inv.wounded && inv.moveActs >= 1) { ctx.toast('Wounded: only one Move action per round.'); return false; }
      D.actions--; inv.moveActs++; D.moveLeft = CONFIG.moveSpaces; fresh = true;
    }
    if (monAt(D, inv.space).length && !(await evade(D, inv, ctx))) { D.moveLeft = 0; return 'free'; }
    const {prev} = moveDist(D, inv);
    const path = []; for (let c = to; c && c !== inv.space; c = prev[c]) path.unshift(c);
    inv.space = to; D.moveLeft -= d;
    npcs(D).forEach(n => { if (n.escort === inv.id) n.space = to; });
    // wading into deep water: one Agility test for the whole move, or 1 Damage
    if (inv.id !== 'nell' && path.some(c => waterAt(D, c) >= 2)) {
      const s = await ctx.test('agi', {label: 'Wade through the deep water', need: 1});
      if (s < 1) hurt(D, inv, 1, 'the sea drags at them');
    }
    log(D, `${nm(inv)} moves to ${SP[to].n} (${ROOMS[roomOf(to)].n}).`);
    for (const c of path) if (fireAt(D, c)) {
      if (D.ext > 0) { D.ext--; delete D.fire[c]; log(D, `${nm(inv)} beats out the fire in ${SP[c].n}.`, 'good'); }
      else hurt(D, inv, 1, `running through the fire in ${SP[c].n}`);
    }
    return 'free';
  },
  async explore(D, inv, key, ctx) {
    const t = exploreTargets(D).find(x => x.key === key && x.from === inv.space);
    if (!t) return false;
    if (!(await ctx.gate())) return true;
    if (t.link.door != null && DOORS[t.link.door].jam) {
      const s = await ctx.test('str', {label: 'Force the jammed door', need: CONFIG.jamNeed, noisy: true});
      if (s < CONFIG.jamNeed) { log(D, `${nm(inv)} throws their weight against the door. It shifts, but holds.`, 'bad'); return true; }
    }
    log(D, `${nm(inv)} explores: ${ROOMS[t.room].n}.`, 'good');
    revealRoom(D, t.room, inv);
    return true;
  },
  async search(D, inv, id, ctx) {
    const tok = D.tokens.find(t => t.id === id && t.k === 'search' && t.sp === inv.space);
    if (!tok) return false;
    if (!(await ctx.gate())) return true;
    if (waterAt(D, inv.space) >= 2) { ctx.toast('Underwater: you can’t search here until the tide drops.'); return false; }
    const spot = D.spots[id], info = SEARCH[id];
    stat(D, inv.id, 'searches');
    if (info && info.test) {
      const s = await ctx.test(info.test[0], {label: info.test[2], need: info.test[1]});
      if (s < info.test[1]) { log(D, `${nm(inv)} can't get at it yet (${info.n}).`); return true; }
    }
    removeToken(D, id);
    if (spot.c === 'items') { spot.items.forEach(k => inv.items.push(k)); log(D, `${nm(inv)} gathers up ${spot.items.map(k => ITEMS[k].n).join(', ')}.`, 'good'); return true; }
    const msg = giveContent(D, inv, spot.c, info ? info.n.toLowerCase() : 'the space');
    if (msg) ctx.toast(msg);
    return true;
  },
  async interact(D, inv, id, ctx) {
    const npc = npcById(D, id);
    const tok = npc ? (npc.found && npc.space === inv.space) : D.tokens.find(t => t.id === id && t.sp === inv.space);
    if (!tok) return false;
    const I = INTERACT[id];
    if (I.can && !I.can(D, inv)[0]) { ctx.toast(I.can(D, inv)[1]); return false; }
    return await I.run(D, inv, ctx);
  },
  async attack(D, inv, a, ctx) {
    const m = D.monsters.find(x => x.mid === a.mid);
    if (!m) return false;
    const W = a.weapon === 'fists' ? {melee: true, skill: 'str', bonus: 0} : ITEMS[a.weapon].w;
    const adj = ADJ[inv.space].some(a => a.to === m.space && passable(D, a.link));
    if (W.melee && m.space !== inv.space && !(W.reach && adj)) return false;
    if (W.ranged && roomOf(m.space) !== roomOf(inv.space)) return false;
    const M = MONSTERS[m.type];
    const s = await ctx.test(W.skill, {label: `Attack the ${M.n} with ${a.weapon === 'fists' ? 'your fists' : ITEMS[a.weapon].n}`, bonus: W.bonus});
    const dmg = s + (s > 0 && W.melee && inv.id === 'dex' ? 1 : 0);
    hitMonster(D, m, dmg, `${nm(inv)} attacks`, inv.id);
    return true;
  },
  async use(D, inv, a, ctx) {
    const k = a.item, idx = inv.items.indexOf(k);
    if (idx < 0) return false;
    if (k === 'holywater') {
      const m = D.monsters.find(x => x.mid === a.mid && x.space === inv.space);
      if (!m) return false;
      inv.items.splice(idx, 1);
      hitMonster(D, m, 2, `${nm(inv)} hurls holy water`, inv.id);
      return true;
    }
    const t = D.inv.find(i => i.id === a.target && !i.out && i.space === inv.space);
    if (!t) return false;
    if (!(await ctx.gate())) return true;
    inv.items.splice(idx, 1);
    const n = discardDown(t, k === 'bandages' ? 'dmg' : 'hor', 2);
    log(D, `${nm(inv)} uses ${ITEMS[k].n} on ${t === inv ? 'themself' : nm(t)} (${n} ${k === 'bandages' ? 'Damage' : 'Horror'} discarded).`, 'good');
    return true;
  },
  async medic(D, inv, a, ctx) {
    if (inv.id !== 'mara') return false;
    const t = D.inv.find(i => i.id === a.target && !i.out && i.space === inv.space);
    if (!t) return false;
    if (!(await ctx.gate())) return true;
    const n = discardDown(t, 'dmg', 1);
    log(D, `${nm(inv)} tends to ${t === inv ? 'her own wounds' : nm(t)} (${n} Damage discarded).`, 'good');
    return true;
  },
  async trade(D, inv, a, ctx) {
    const o = D.inv.find(i => i.id === a.with && !i.out && i.space === inv.space);
    if (!o || o === inv) return false;
    if (hasFlag(inv, 'notrade') || hasFlag(o, 'notrade')) { ctx.toast('Paranoia: one of you refuses to trade.'); return false; }
    if (!a.give.length && !a.take.length && !a.clues) return false;
    if (!(await ctx.gate())) return true;
    for (const k of a.give) { const i = inv.items.indexOf(k); if (i >= 0) { inv.items.splice(i, 1); o.items.push(k); } }
    for (const k of a.take) { const i = o.items.indexOf(k); if (i >= 0) { o.items.splice(i, 1); inv.items.push(k); } }
    if (a.clues > 0) { const c = Math.min(a.clues, inv.clues); inv.clues -= c; o.clues += c; }
    if (a.clues < 0) { const c = Math.min(-a.clues, o.clues); o.clues -= c; inv.clues += c; }
    log(D, `${nm(inv)} trades with ${nm(o)}.`);
    return true;
  },
  async cast(D, inv, a, ctx) {
    const id = a.spell, Sp = SPELLS[id];
    if (!Sp || !(inv.spells || []).includes(id) || Sp.type === 'reaction') return false;
    let m = null, t = null;
    if (Sp.type === 'attack' || Sp.target === 'monster') { m = D.monsters.find(x => x.mid === a.mid && roomOf(x.space) === roomOf(inv.space)); if (!m) return false; }
    if (Sp.target === 'ally') { t = D.inv.find(x => x.id === a.target && !x.out && x.space === inv.space); if (!t) return false; }
    if (Sp.type !== 'attack' && !(await ctx.gate())) return true;
    let s = 0;
    const front = Sp.type === 'attack' || Sp.target === 'monster' || id === 'hymn';
    if (front) s = await ctx.test('lore', {label: `Cast ${Sp.n}`});
    const b = flipSpell(D, inv, id);
    if (b.test) s = await ctx.test(b.test, {label: `${Sp.n}: ${SKILL_NAMES[b.test]} test`});
    if (ctx.toast) ctx.toast(`${Sp.n} — flipped: ${b.t}`);
    b.fx(D, inv, s, m || t);
    return true;
  },
  async extinguish(D, inv, a, ctx) {
    if (!(await ctx.gate())) return true;
    const s = await ctx.test('agi', {label: 'Beat out the flames'});
    D.ext = (D.ext || 0) + s;
    if (fireAt(D, inv.space) && D.ext > 0) { D.ext--; delete D.fire[inv.space]; }
    log(D, s ? `${nm(inv)} fights the fire (${s} success${s === 1 ? '' : 'es'}: put out fire here or in spaces you move into this turn).` : `${nm(inv)} can't get the fire under control.`, s ? 'good' : 'bad');
    return true;
  },
  async setfire(D, inv, a, ctx) {
    const src = inv.items.includes('matches') ? 'matches' : inv.items.includes('oillamp') ? 'oillamp' : null;
    if (!src) return false;
    if (!(await ctx.gate())) return true;
    if (src === 'matches') inv.items.splice(inv.items.indexOf('matches'), 1);
    log(D, `${nm(inv)} sets a fire${src === 'matches' ? ' with the last of the matches' : ' with the Oil Lamp'}.`, 'bad');
    setFire(D, inv.space);
    return true;
  },
  // Linus Achterberg: once per scenario, hold the tide for a round or push it on a step
  async tidetables(D, inv, a) {
    if (inv.id !== 'linus' || D.tide == null || inv.usedTide) return false;
    inv.usedTide = true;
    if (a === 'push') { D.tide = (D.tide + 1) % 4; floodFromTide(D); log(D, `${nm(inv)} reads the water and times it to the minute: the tide turns early (${TIDE_NAMES[D.tide]}).`, 'good'); }
    else { D.tideHold = 1; log(D, `${nm(inv)} checks the tables: the tide will hold for a round.`, 'good'); }
    return 'free';
  },
  async endphase(D) {
    if (D.active >= 0 || !allDone(D)) return false;
    mythosPhase(D);
    return 'free';
  },
};
function hitMonster(D, m, dmg, who, by) {
  const M = MONSTERS[m.type];
  if (dmg <= 0) { log(D, `${who}, but the ${M.n} is untouched.`); return; }
  m.wounds += dmg; stat(D, by, 'dealt', dmg);
  if (m.wounds >= monHp(m)) {
    D.monsters = D.monsters.filter(x => x !== m); stat(D, by, 'kills');
    log(D, `${who} for ${dmg}. The ${M.n} is destroyed.`, 'good');
    if (M.boss && SCN.bossWins && SCN.bossWins(D)) bossDown(D);
    else if (M.boss && SCN.bossStory) story(D, SCN.bossStory[0], SCN.bossStory[1], 'story');
  } else log(D, `${who} for ${dmg}. The ${M.n} is hurt.`);
}
const NO_EVADE = ['attack', 'start', 'endturn', 'endphase', 'extinguish', 'tidetables'];
const FREE_KINDS = ['move', 'start', 'endturn', 'endphase', 'tidetables'];
const needsAction = (D, kind) => !FREE_KINDS.includes(kind) && D.actions < 1;
