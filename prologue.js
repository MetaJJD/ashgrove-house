/* Greywater — the road to the house. Right before a scenario starts, the party faces one situation with two
   choices. The choice lasts for this scenario only. Every choice has a gain and a cost of similar size.
   Effect keys: clues (each), clock (rounds on the hidden clock), items (given round the party), dmg / hor (each,
   face-down), maxMon (monster cap), sk (party-wide skill change), evAll (every evidence lead is real),
   grace (extra rounds after a fall), early (a monster comes out in the first Mythos phase). */
const PROLOGUES = [
  {id: 'ferry', t: 'The ferryman', s: 'The causeway to Greywater is flooded. An old ferryman offers to row you across the black lake, for a price he will not name. A long walk round the shore would take hours.',
    a: {t: 'Take the boat', d: 'You arrive early and unseen — but the water whispers to you all the way across.', fx: {clock: 2, hor: 1}},
    b: {t: 'Walk the shore', d: 'Safe and dry, but slow. The light is already going when you reach the gate.', fx: {clock: -2, clues: 1}}},
  {id: 'doctor', t: 'The village doctor', s: 'Dr. Penhallow, who once worked with Marrow, catches you at the inn. He is drunk, frightened and wants to help.',
    a: {t: 'Take his medical bag', d: 'Bandages and laudanum, packed by a man who expected the worst.', fx: {items: ['bandages', 'laudanum']}},
    b: {t: 'Hear him out', d: 'An hour of his rambling memories. Some of it might matter.', fx: {clues: 1}}},
  {id: 'letter', t: 'The second page', s: 'Marrow’s letter had a second page, folded inside the first. It is covered in tiny handwriting that seems to move when you look away.',
    a: {t: 'Read it aloud', d: 'You understand far more than you wanted to. +1 Lore, but it stays with you.', fx: {sk: {lore: 1}, hor: 1}},
    b: {t: 'Burn it unread', d: 'Your heads are clear. You will face whatever is in there with your own wits.', fx: {sk: {will: 1}, clock: -1}}},
  {id: 'storm', t: 'The storm', s: 'A storm comes off the lake as you reach the gates. You could shelter in the gatehouse until it passes, or go straight in.',
    a: {t: 'Shelter and wait', d: 'Dry and rested — but the house has had longer to wake.', fx: {clock: -2, clues: 1}},
    b: {t: 'Run for the doors', d: 'Soaked and battered by flying slates, but the house is still half asleep.', fx: {dmg: 1, clock: 2}}},
  {id: 'dog', t: 'The gatekeeper’s dog', s: 'A huge dog paces behind the iron gate, silent, watching you. It has not barked once. The gatekeeper’s lodge is dark.',
    a: {t: 'Calm it', d: 'It lets you pass, and follows you to the steps — then sits and howls. Everything inside hears.', fx: {early: 'orderly', clues: 1}},
    b: {t: 'Climb the wall', d: 'You get over unheard, scraped and bruised. The house does not know you are inside — yet.', fx: {dmg: 1, clock: 1}}},
  {id: 'sexton', t: 'The sexton', s: 'The village sexton has the old keys and tools for the asylum. He will give you one bundle — and wants you gone before dark.',
    a: {t: 'The fire axe', d: 'Heavy, old and sharp.', fx: {items: ['axe']}},
    b: {t: 'Lamp oil and matches', d: 'Light is worth more than steel in that place, he says.', fx: {items: ['matches', 'oillamp']}}},
  {id: 'doll', t: 'The doll on the shore', s: 'On the shingle below the asylum lies a child’s doll, soaked, its painted face turned towards the house. A name is stitched into its dress: Ada.',
    a: {t: 'Take it with you', d: 'Holding it, you feel the house is less able to hide things from you — and more aware of you.', fx: {evAll: true, maxMon: 1}},
    b: {t: 'Leave it be', d: 'You walk on. The doll watches you go.', fx: {sk: {will: 1}}}},
  {id: 'inn', t: 'The last night at the inn', s: 'The landlord of the Drowned Bell offers you a room for the night before you go up to the house.',
    a: {t: 'Drink and rest', d: 'You sleep well, for the last time. You are slow in the morning.', fx: {clues: 1, sk: {agi: -1}}},
    b: {t: 'Stay sober and listen', d: 'Locals talk when strangers are buying. You learn a great deal, and sleep badly.', fx: {sk: {obs: 1}, hor: 1}}},
  {id: 'orderly', t: 'The man on the road', s: 'A man in a filthy orderly’s coat stumbles out of the dark, babbling. He escaped Greywater two nights ago.',
    a: {t: 'Help him to the village', d: 'A delay — but grateful, he tells you where things are hidden.', fx: {clock: -2, evAll: true}},
    b: {t: 'Make him talk, here and now', d: 'He tells you what you need, then screams and runs back towards the house.', fx: {clues: 1, early: 'orderly'}}},
  {id: 'telegram', t: 'The telegraph office', s: 'The village has a telegraph. You could wire the county police before you go in.',
    a: {t: 'Send for help', d: 'Help may come. If one of you falls, the rest have a little longer.', fx: {grace: 1, clock: -1}},
    b: {t: 'Keep it quiet', d: 'No one will come. But no one will warn the house, either.', fx: {clock: 1, maxMon: -1, grace: -1}}},
  {id: 'chapel', t: 'The village chapel', s: 'The chapel door stands open, candles lit, nobody inside. On the altar: a flask of water and a note — For the ones going up the hill.',
    a: {t: 'Take the water', d: 'Holy water, though no priest is here to say so.', fx: {items: ['holywater'], hor: 1}},
    b: {t: 'Stop and pray', d: 'Even the doubters among you feel steadier.', fx: {sk: {will: 1}, clock: -1}}},
  {id: 'moon', t: 'The moonrise', s: 'The moon rises over the lake. Under it, every window in Greywater shines silver — and one is lit from inside.',
    a: {t: 'Go now, by moonlight', d: 'You see the way clearly, and the house sees you.', fx: {sk: {obs: 1}, early: 'drowned'}},
    b: {t: 'Wait for the clouds', d: 'You slip in under cover of darkness, an hour later.', fx: {clock: -1, clues: 1}}},
];

// short, plain list of what a choice does (shown under each option)
function prologueFx(fx) {
  const o = [];
  const sgn = n => (n > 0 ? '+' : '−') + Math.abs(n);
  if (fx.clues) o.push(`${sgn(fx.clues)} Clue each`);
  if (fx.sk) for (const [k, v] of Object.entries(fx.sk)) o.push(`${sgn(v)} ${SKILL_NAMES[k]} for everyone`);
  if (fx.items) o.push(fx.items.map(k => ITEMS[k].n).join(' and '));
  if (fx.evAll) o.push('every evidence lead is real');
  if (fx.grace > 0) o.push('an extra round if someone falls'); if (fx.grace < 0) o.push('no extra round if someone falls');
  if (fx.clock > 0) o.push('a longer night'); if (fx.clock < 0) o.push('a shorter night');
  if (fx.dmg) o.push(`${fx.dmg} Damage each`);
  if (fx.hor) o.push(`${fx.hor} Horror each`);
  if (fx.maxMon > 0) o.push('more monsters can be out at once'); if (fx.maxMon < 0) o.push('fewer monsters can be out at once');
  if (fx.early) o.push(`${MONSTERS[fx.early].n.replace(/^The /, 'the ')} comes early`);
  return o.join(' · ');
}
// applied by newGame (engine.js) when opt.prologue = {id, c: 'a' | 'b'}
function applyPrologue(S, pr) {
  const P = PROLOGUES.find(x => x.id === pr.id); if (!P) return;
  const C = P[pr.c], fx = C.fx;
  S.pro = {id: P.id, c: pr.c, t: P.t, choice: C.t, sum: prologueFx(fx), sk: fx.sk || null};
  if (fx.clues) S.inv.forEach(v => v.clues = Math.max(0, v.clues + fx.clues));
  if (fx.items) fx.items.forEach((k, i) => { const v = S.inv[i % S.inv.length]; if (!v.items.includes(k)) v.items.push(k); });
  if (fx.dmg) S.inv.forEach(v => { for (let k = 0; k < fx.dmg; k++) v.dmg.push('graze'); });
  if (fx.hor) S.inv.forEach(v => { if (v.id === 'agnes') return; for (let k = 0; k < fx.hor; k++) v.hor.push('unease'); });
  if (fx.clock) { S.threatMax += fx.clock; S.beatAt = CONFIG.beatFrac.map(f => Math.round(f * S.threatMax)); }
  if (fx.maxMon) S.maxMon = Math.max(1, S.maxMon + fx.maxMon);
  if (fx.grace) S.grace = Math.max(0, (S.grace != null ? S.grace : CONFIG.graceRounds) + fx.grace);
  if (fx.evAll) { S.evLive = Object.keys(EVIDENCE).filter(id => S.spots[id]); S.evLive.forEach(id => S.spots[id] = {c: 'ev:' + id}); }
  if (fx.early) S.proSpawn = fx.early;
  S.lgTitle = 'Before the doors';
  S.lgIntro = `On the road: ${P.t}. You chose to ${C.t.charAt(0).toLowerCase() + C.t.slice(1)}. ${C.d}` + (S.lgIntro ? '\n\n' + S.lgIntro : '');
}
