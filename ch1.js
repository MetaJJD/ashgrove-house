/* Chapter 1 — The Greywater Choir. Registers the asylum's map, events and story hooks (see useScenario in engine.js).
   Loaded after engine, actions, extras, director and prologue, so it can capture their Greywater tables. */
SCENARIOS.greywater = {
  id: 'greywater', ch: 1, place: 'Greywater', name: 'The Greywater Choir', chapter: 'Chapter 1',
  blurb: '“Come quickly. The patients have begun to sing.” A letter from the director of Greywater Sanatorium brought you to the black lake. The doors locked behind you.',
  rooms: Object.assign({}, ROOMS), doors: DOORS.slice(), stairs: STAIRS.slice(), mythos: MYTHOS.slice(), beats: BEATS.slice(),
  prologues: PROLOGUES.slice(),
  evidence: Object.keys(EVIDENCE),
  start: 'H1', startRoom: 'hall',
  introTitle: 'The Greywater Choir',
  intro: 'Autumn, 1926. A letter from Dr. Hollis Marrow, director of Greywater Sanatorium, reached each of you on the same morning: “Come quickly. The patients have begun to sing.”\n\nYou arrive at dusk. The building on the black lake is silent. The front doors close behind you — and lock.\n\nFind out what happened at Greywater.',
  logStart: 'Find out what happened at Greywater.',
  goalNames: {A: 'Silence the Resonance Engine', B: 'Lead Ada Wren out', C: 'Bring down Dr. Marrow'},
  memory: {A: 'engine', B: 'ada', C: 'conductor'},
  text: {
    winTitle: 'Greywater falls silent', partialTitle: 'Greywater falls silent', loseTitle: 'The hymn is complete',
    allFallen: 'Every investigator has fallen. In the Day Room, five new chairs have been turned to face the lake.',
    fallLoss: 'You ran out of time after one of you fell. The doors of Greywater never open again.',
    clockLoss: 'The last note of the hymn rings out across the black lake. Every voice in Greywater — yours included — joins in.',
    hint: room => `The hymn falters for a moment, and in the silence you are sure of it: something that matters is waiting in the ${room}.`,
    road: 'On the road to Greywater',
  },
  spots(evLive) {
    // one weapon is always among the first finds; the rest of the pool, and which spell hides where, change every game
    const rest = shuffle(['bandages', 'bandages', 'matches', 'clues2', 'clues2', 'holywater', 'laudanum', 'knife', 'lantern', 'lexicon', 'nothing', pick(['revolver', 'axe'])]);
    const pool = shuffle([pick(['revolver', 'axe']), rest.pop(), rest.pop()]).concat(rest);
    const sp3 = shuffle(['spell:binding', 'spell:mend', 'spell:still']);
    const fixed = {boiler: 'valve', benches: pick(['oillamp', 'oillamp', 'lantern']), bookcase: sp3[0], pews: sp3[1], tubs: sp3[2]};
    const spots = {}; let pi = 0;
    for (const id of ['benches', 'gurney', 'cards', 'cabinet', 'bookcase', 'beds', 'lockers', 'pews', 'drawers', 'boiler', 'tubs']) {
      if (fixed[id]) spots[id] = {c: fixed[id]};
      else if (EVIDENCE[id] && evLive.includes(id)) spots[id] = {c: 'ev:' + id};
      else spots[id] = {c: pool[pi++ % pool.length]};
    }
    return spots;
  },
  puzzles: () => makePuzzles(),
  reveal: S => gwReveal(S),
  goalText: S => gwGoalText(S),
  bossWins: S => S.goal === 'C',
  bossDown(S) { if (S.goal === 'C') end(S, 'won', 'Marrow’s arms drop mid-beat. All through the house a hundred voices stop on the same breath, as if someone had lifted a needle from a record. The black lake is only a lake again.'); },
  bossStory: ['Dr. Marrow falls', 'Marrow folds to the floor like an empty coat. His baton keeps twitching in time for a while after. It doesn’t end the song — but nobody is conducting it now.'],
  onReveal(S, rid, L) {
    if (rid === 'boiler' && S.boilerBurst) { S.boilerBurst = false; S.fire = S.fire || {}; S.fire.B1 = true; L.push('The boiler has burst. Fire has taken hold around it.'); }
  },
  midMythos(S, L) {
    if (S.goal !== 'C') return;
    const b = S.monsters.find(m => m.type === 'marrow'); if (!b) return;
    activeInv(S).filter(i => roomOf(i.space) === roomOf(b.space)).forEach(i => { if (autoTest(S, i, 'will') < CONFIG.conductorAura) scare(S, i, 1, 'Marrow conducts, and the hymn pours through the room', L); else say(S, L, `${nm(i)} holds firm against the Conductor's hymn (Will).`); });
  },
  progress(S) {
    if (!S.goal) return 0.5 * Math.min(1, S.evidence.length / CONFIG.evidenceNeeded);
    if (S.goal === 'C') { const b = S.monsters.find(m => m.type === 'marrow'); return b ? 0.5 + 0.45 * b.wounds / monHp(b) : 0.5; }
    if (S.goal === 'A') { const h = S.inv.find(v => !v.out && v.items.includes('valve')); return !h ? 0.5 : roomOf(h.space) === 'hydro' ? 0.85 : 0.7; }
    const a = S.ada; if (!a || !a.found) return 0.5;
    if (!a.escort) return 0.6;
    return roomOf(a.space) === 'hall' ? 0.9 : 0.75;
  },
  goalHelp(S) {
    if (!S.goal) return `Explore the house and find ${CONFIG.evidenceNeeded} pieces of evidence about what Dr. Marrow did here. Evidence hides behind Search (🔍) and Interact (!) tokens.`;
    if (S.goal === 'C') { const b = S.monsters.find(m => m.type === 'marrow'); return b ? `Dr. Marrow is in the ${ROOMS[roomOf(b.space)].n}. Bring him down: he has taken ${b.wounds} of ${monHp(b)} wounds. Weapons, spells, holy water and fire all hurt him. Fight together.` : 'Find Dr. Marrow and bring him down.'; }
    if (S.goal === 'A') {
      const holder = S.inv.find(v => !v.out && v.items.includes('valve'));
      return holder ? `${INVD(holder.id).name} has the Valve Wheel. Bring it to the Engine in Hydrotherapy and Interact to turn the valves (pipe puzzle, Strength).` : 'Find the Valve Wheel (search the Boiler Room), carry it to the Engine in Hydrotherapy, then Interact to turn the valves (pipe puzzle, Strength). Dr. Marrow guards it.';
    }
    if (S.ada && S.ada.escort) return `Ada is following ${INVD(S.ada.escort).name}. Lead her to the front doors in the Receiving Hall and Interact there.`;
    if (S.ada && S.ada.found) return `Ada Wren is in the ${ROOMS[roomOf(S.ada.space)].n}. Go to her and Interact to calm her (Influence), then lead her to the front doors.`;
    return 'Ada Wren is somewhere in the building. Explore to find her, calm her (Interact, Influence), then lead her out through the front doors in the Receiving Hall.';
  },
};
SCN = SCENARIOS.greywater;
