'use strict';
/* =====================================================================
   GREYWATER — Chapter 1: The Greywater Choir
   Rules engine (no DOM). Everything tunable lives in CONFIG.
   ===================================================================== */

const CONFIG = {
  actions: 2,            // actions per turn
  moveSpaces: 2,         // spaces per Move action
  clueStart: 1,
  evidenceNeeded: 3,
  threatMax: 14,         // hidden clock: lose when it reaches this (overridden per player count below)
  threatByPlayers: {2: 24, 3: 17, 4: 15},  // tuned by simulation for ~35–42% wins
  evLive: 4,             // how many of the 5 evidence sources hold evidence this game
  jamNeed: 1,            // successes to force the jammed stairwell door
  fireSpread: 0.4,         // chance fire spreads each Mythos phase
  fireCap: 3,              // most spaces that can burn at once (0 = no limit)
  lateBurst: true,         // boiler bursts even if unexplored: the fire is waiting when you open the Boiler Room
  noiseSummon: 'once',     // noise with no Orderly on the board calls one out of the walls: false | 'once' (per game) | true
  lampDropAt: 3,         // damage in one hit that makes a held Oil Lamp drop and start a fire
  beats: [4, 8, 12],     // story escalations
  engineNeed: 5,         // goal A: Strength successes to silence the Engine
  maxMonsters: 7,
  maxByPlayers: {2: 2, 3: 3, 4: 5},  // monsters on the board at once (the boss never counts)
};

// ------------------------------------------------------------- dice
// MOM-style eight-sided die: 3 success, 2 clue, 3 blank
const FACE = {S: '✦', C: '🔍', B: '', X: '✦'};
const rollD8 = () => { const v = 1 + Math.floor(Math.random() * 8); return v <= 3 ? 'S' : v <= 5 ? 'C' : 'B'; };

// ----------------------------------------------------------- utils
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clone = o => JSON.parse(JSON.stringify(o));

// ---------------------------------------------------- investigators
const SKILLS = ['str', 'agi', 'obs', 'lore', 'inf', 'will'];
const SKILL_NAMES = {str: 'Strength', agi: 'Agility', obs: 'Observation', lore: 'Lore', inf: 'Influence', will: 'Will'};
const SKILL_SHORT = {str: 'STR', agi: 'AGI', obs: 'OBS', lore: 'LOR', inf: 'INF', will: 'WIL'};

const INVESTIGATORS = [
  {id: 'mara', name: 'Mara Voss', role: 'Night nurse', color: '#7fc0ae', hat: 'cap', hp: 7, san: 7, str: 2, agi: 3, obs: 3, lore: 2, inf: 3, will: 3, start: ['bandages'],
    ability: 'Field Medic', text: 'Action: discard 1 face-down Damage from yourself or someone in your space.'},
  {id: 'elias', name: 'Elias Crane', role: 'Antiquarian', color: '#d2ad62', hat: 'specs', hp: 6, san: 8, str: 2, agi: 2, obs: 3, lore: 4, inf: 2, will: 3, start: ['lexicon'], spells: ['hymn'],
    ability: 'Erudite', text: 'On Lore tests, your blank dice are rerolled once.'},
  {id: 'dex', name: 'Dex Holloway', role: 'Ex-prizefighter', color: '#d07352', hat: 'flatcap', hp: 9, san: 5, str: 4, agi: 3, obs: 2, lore: 1, inf: 2, will: 2, start: ['knife'],
    ability: 'Brawler', text: 'Your melee attacks that hit deal 1 extra damage.'},
  {id: 'agnes', name: 'Sister Agnes', role: 'Lapsed nun', color: '#a597d6', hat: 'veil', hp: 6, san: 8, str: 2, agi: 2, obs: 2, lore: 3, inf: 4, will: 4, start: ['holywater'], spells: ['quiet'],
    ability: 'Faith', text: 'Each time you would suffer Horror, suffer 1 less.'},
  {id: 'juno', name: 'Juno Reyes', role: 'Photojournalist', color: '#dccf72', hat: 'cloche', hp: 7, san: 6, str: 2, agi: 4, obs: 4, lore: 2, inf: 3, will: 2, start: ['lantern'],
    ability: 'Keen Eye', text: 'On Observation tests, 🔍 results count as successes.'},
];
const INVD = id => INVESTIGATORS.find(x => x.id === id);

// -------------------------------------------------------------- items
const ITEMS = {
  knife: {n: 'Carving Knife', w: {melee: true, skill: 'str', bonus: 1}, t: 'Melee weapon: +1 die when you attack with Strength.'},
  axe: {n: 'Fire Axe', w: {melee: true, skill: 'str', bonus: 2}, t: 'Melee weapon: +2 dice when you attack with Strength.'},
  revolver: {n: 'Service Revolver', w: {ranged: true, skill: 'agi', bonus: 2}, t: 'Ranged weapon: attack a monster anywhere in your room, testing Agility with +2 dice.'},
  lantern: {n: 'Storm Lantern', light: true, t: 'Light Source: you and anyone in or next to your space ignore Darkness.'},
  oillamp: {n: 'Oil Lamp', light: true, t: 'Light Source: you and anyone in or next to your space ignore Darkness.'},
  matches: {n: 'Box of Matches', light: true, t: 'Light Source: you and anyone in or next to your space ignore Darkness.'},
  lexicon: {n: 'Annotated Lexicon', mod: {lore: 1}, t: '+1 Lore.'},
  bandages: {n: 'Bandages', use: true, t: 'Action: discard 2 face-down Damage from yourself or someone in your space. Then discard this.'},
  laudanum: {n: 'Laudanum', use: true, t: 'Action: discard 2 face-down Horror from yourself or someone in your space. Then discard this.'},
  holywater: {n: 'Holy Water', use: true, t: 'Action: deal 2 damage to a monster in your space. Then discard this.'},
  valve: {n: 'Valve Wheel', unique: true, t: 'A heavy brass wheel. It fits something in Hydrotherapy.'},
};
const LIGHTS = ['lantern', 'oillamp', 'matches'];

// --------------------------------------------- damage & horror cards
const DMG_CARDS = {
  graze: {n: 'Graze', t: 'Only a flesh wound.'},
  bruise: {n: 'Bruised Ribs', t: 'It hurts to breathe.'},
  ankle: {n: 'Twisted Ankle', up: true, mod: {agi: -1}, t: 'Keep face up: −1 Agility.'},
  gash: {n: 'Deep Gash', up: true, mod: {str: -1}, t: 'Keep face up: −1 Strength.'},
  concussion: {n: 'Concussion', up: true, mod: {obs: -1}, t: 'Keep face up: −1 Observation.'},
};
const DMG_DECK = [...Array(14).fill('graze'), ...Array(12).fill('bruise'), 'ankle', 'gash', 'concussion'];
const HOR_CARDS = {
  unease: {n: 'Unease', t: 'A chill passes through you.'},
  dread: {n: 'Dread', t: 'You can’t stop listening for the singing.'},
  paranoia: {n: 'Paranoia', up: true, flag: 'notrade', t: 'Keep face up: you cannot Trade.'},
  tinnitus: {n: 'Ringing Ears', up: true, mod: {obs: -1}, t: 'Keep face up: −1 Observation.'},
  shaking: {n: 'Shaking Hands', up: true, mod: {agi: -1}, t: 'Keep face up: −1 Agility.'},
  nightmares: {n: 'Waking Nightmares', up: true, mod: {will: -1}, t: 'Keep face up: −1 Will.'},
};
const HOR_DECK = [...Array(14).fill('unease'), ...Array(12).fill('dread'), 'paranoia', 'tinnitus', 'shaking', 'nightmares'];

const INSANITY = [
  {id: 'hymn', n: 'The Drowned Hymn', t: 'You hear it clearly now, and it is the most beautiful thing in the world. You win only if the investigators LOSE.', win: (S, inv) => S.phase === 'lost'},
  {id: 'magpie', n: 'Magpie', t: 'Everything here might be important. Everything. You win only if the investigators win AND you hold 3 or more possessions at the end.', win: (S, inv) => S.phase === 'won' && inv.items.length >= 3},
  {id: 'martyr', n: 'Martyr', t: 'Someone has to stay behind. You win only if the investigators win AND you were eliminated.', win: (S, inv) => S.phase === 'won' && inv.out},
];

// --------------------------------------------------------------- map
// Rooms sit on a hidden grid (cells). Spaces are rectangles inside a room: [x, y, w, h, name] in room cells.
const ROOMS = {
  hall: {n: 'Receiving Hall', x: 4, y: 6, w: 3, h: 2, floor: 'tile',
    d: 'Rows of benches face a reception window. The glass is cracked — from the inside.',
    sp: {H1: [0, 0, 2, 2, 'Waiting benches'], H2: [2, 0, 1, 2, 'Front doors']},
    tokens: [['H1', 'search', 'benches'], ['H2', 'interact', 'frontdoors']]},
  corr: {n: 'Long Corridor', x: 3, y: 4, w: 4, h: 2, floor: 'wood',
    d: 'Empty gurneys line the walls. Wet footprints lead halfway down the corridor, and stop.',
    sp: {C1: [0, 0, 1, 2, 'West end'], C2: [1, 0, 2, 2, 'Gurneys'], C3: [3, 0, 1, 2, 'Telephone']},
    tokens: [['C2', 'search', 'gurney'], ['C3', 'interact', 'phone']]},
  day: {n: 'Day Room', x: 0, y: 3, w: 3, h: 3, floor: 'carpet',
    d: 'Card games abandoned mid-hand. Every chair has been turned to face the window and the black lake beyond.',
    sp: {D1: [0, 0, 2, 2, 'Card tables'], D2: [2, 0, 1, 3, 'Gramophone'], D3: [0, 2, 2, 1, 'Windows']},
    tokens: [['D1', 'search', 'cards'], ['D2', 'interact', 'gramophone']]},
  nurse: {n: "Nurses' Station", x: 7, y: 4, w: 2, h: 2, floor: 'tile',
    d: 'Charts scattered across the floor. Someone has barricaded themselves behind the desk.',
    sp: {N1: [0, 0, 1, 2, 'Medicine cabinet'], N2: [1, 0, 1, 2, 'Desk']},
    tokens: [['N1', 'search', 'cabinet'], ['N2', 'person', 'pell']]},
  office: {n: "Director's Office", x: 3, y: 2, w: 3, h: 2, floor: 'carpet',
    d: 'A fine office gone to rot. Sheet music lies scattered over the desk and floor, every page the same single note.',
    sp: {O1: [0, 0, 2, 2, 'Desk'], O2: [2, 0, 1, 2, 'Bookcase']},
    tokens: [['O1', 'interact', 'desk'], ['O2', 'search', 'bookcase']]},
  ward: {n: 'Patient Ward', x: 6, y: 1, w: 4, h: 3, floor: 'wood',
    d: 'Thirteen beds. Twelve are damp, as if their occupants climbed out of the lake and back into bed.',
    sp: {W1: [0, 0, 2, 2, 'Beds 1–6'], W2: [2, 0, 2, 2, 'Beds 7–12'], W3: [0, 2, 2, 1, 'Aisle'], W4: [2, 2, 2, 1, 'Bed 13']},
    tokens: [['W1', 'search', 'beds'], ['W4', 'search', 'lockers']], spawn: [['drowned', 'W2']]},
  chapel: {n: 'Chapel', x: 0, y: 1, w: 3, h: 2, floor: 'stone',
    d: 'Hymnals lie open on every pew, all to the same page. The page is blank.',
    sp: {P1: [0, 0, 2, 2, 'Pews'], P2: [2, 0, 1, 2, 'Organ']},
    tokens: [['P1', 'search', 'pews'], ['P2', 'interact', 'organ']]},
  stair: {n: 'Stairwell', x: 7, y: 6, w: 2, h: 2, floor: 'stone', dark: true,
    d: 'A narrow stair spirals down. The air coming up from below is wet and cold.',
    sp: {S1: [0, 0, 1, 2, 'Landing'], S2: [1, 0, 1, 2, 'Steps down']},
    tokens: []},
  morgue: {n: 'Morgue', x: 2, y: 10, w: 3, h: 2, floor: 'tile', dark: true, basement: true,
    d: 'Steel drawers line the wall. Several stand open, and empty, and wet.',
    sp: {M1: [0, 0, 2, 2, 'Cold drawers'], M2: [2, 0, 1, 2, 'Slab']},
    tokens: [['M1', 'search', 'drawers'], ['M2', 'interact', 'photo']], spawn: [['orderly', 'M1']]},
  boiler: {n: 'Boiler Room', x: 5, y: 10, w: 2, h: 2, floor: 'stone', dark: true, basement: true,
    d: 'The boiler ticks and groans. Pipes from here run toward Hydrotherapy, all of them humming.',
    sp: {B1: [0, 0, 1, 2, 'Boiler'], B2: [1, 0, 1, 2, 'Foot of the stairs']},
    tokens: [['B1', 'search', 'boiler']]},
  hydro: {n: 'Hydrotherapy', x: 3, y: 12, w: 4, h: 3, floor: 'tile', dark: true, basement: true,
    d: 'Tiled baths full of lake water. In the corner, a machine of brass horns and copper coils hums one endless note.',
    sp: {Y1: [0, 0, 2, 3, 'Baths'], Y2: [2, 0, 2, 2, 'The Engine'], Y3: [2, 2, 2, 1, 'Drain']},
    tokens: [['Y1', 'search', 'tubs'], ['Y2', 'interact', 'engine']], spawn: [['choir', 'Y3']]},
};
// Doors: two neighbouring cells on the grid. jam: the door must be forced (Explore with a Strength test).
const DOORS = [
  {a: [4, 6], b: [4, 5]}, {a: [3, 4], b: [2, 4]}, {a: [6, 5], b: [7, 5]}, {a: [4, 4], b: [4, 3]},
  {a: [5, 2], b: [6, 2]}, {a: [8, 3], b: [8, 4]}, {a: [1, 3], b: [1, 2]}, {a: [6, 7], b: [7, 7], jam: true},
  {a: [5, 10], b: [4, 10]}, {a: [5, 11], b: [5, 12]}, {a: [3, 11], b: [3, 12]},
];
const STAIRS = [{a: 'S2', b: 'B2'}];

// derived geometry
const SP = {};
for (const [rid, R] of Object.entries(ROOMS)) for (const [sid, r] of Object.entries(R.sp)) SP[sid] = {id: sid, room: rid, x: R.x + r[0], y: R.y + r[1], w: r[2], h: r[3], n: r[4]};
const cellSpace = (cx, cy) => Object.values(SP).find(s => cx >= s.x && cx < s.x + s.w && cy >= s.y && cy < s.y + s.h)?.id;
const overlap = (a1, al, b1, bl) => Math.min(a1 + al, b1 + bl) - Math.max(a1, b1) > 0;
const touch = (a, b) => ((a.x + a.w === b.x || b.x + b.w === a.x) && overlap(a.y, a.h, b.y, b.h)) || ((a.y + a.h === b.y || b.y + b.h === a.y) && overlap(a.x, a.w, b.x, b.w));
const LINKS = []; // {a, b, door?, stairs?}
for (const R of Object.keys(ROOMS)) {
  const ids = Object.keys(ROOMS[R].sp);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (touch(SP[ids[i]], SP[ids[j]])) LINKS.push({a: ids[i], b: ids[j]});
}
DOORS.forEach((d, i) => { d.sa = cellSpace(...d.a); d.sb = cellSpace(...d.b); d.i = i; LINKS.push({a: d.sa, b: d.sb, door: i}); });
STAIRS.forEach((s, i) => LINKS.push({a: s.a, b: s.b, stairs: i}));
const ADJ = {};
Object.keys(SP).forEach(s => ADJ[s] = []);
LINKS.forEach(l => { ADJ[l.a].push({to: l.b, link: l}); ADJ[l.b].push({to: l.a, link: l}); });
const roomOf = sid => SP[sid].room;

// --------------------------------------------------------- search spots
const SEARCH = {
  benches: {n: 'Under the benches', t: 'A handbag left beneath a bench, its clasp open.'},
  gurney: {n: 'Gurneys', t: 'Straps, stained sheets, a clipboard.'},
  cards: {n: 'Card tables', t: 'A half-played hand. Something is tucked beneath the deck.'},
  cabinet: {n: 'Medicine cabinet', t: 'Locked. The key is long gone.', test: ['agi', 1, 'Pick the lock (test Agility)']},
  bookcase: {n: 'Bookcase', t: 'Acoustics, hydrology, hymnals. One shelf is suspiciously empty.'},
  beds: {n: 'Beds 1–6', t: 'Damp mattresses. Something crinkles under a pillow.'},
  lockers: {n: 'Patient lockers', t: 'Thirteen small lockers, labelled by number.'},
  pews: {n: 'Pews', t: 'Kneelers, hymnals, a forgotten coat.'},
  drawers: {n: 'Cold drawers', t: 'Most are empty. One is not.', test: ['will', 1, 'Open it (test Will)']},
  boiler: {n: 'Behind the boiler', t: 'Tools lie on a workbench, slick with condensation.'},
  tubs: {n: 'Baths', t: 'Lake water, black and still. Your reflection is late.', test: ['will', 1, 'Reach in (test Will)']},
};
const EVIDENCE = {
  desk: {n: "Marrow's Journal", t: 'The handwriting grows larger page by page: “The lake does not drown. It sings — and the singing wants a choir.”'},
  beds: {n: 'Patient Ledger', t: 'Thirteen patients admitted for “resonance therapy.” Twelve names are crossed out. The thirteenth is Ada Wren.'},
  drawers: {n: 'Wax Cylinder', t: 'A recording in Marrow’s voice: “Phase three. When the Engine reaches pitch, they will not need bodies to sing.”'},
  gramophone: {n: 'The Patient Recording', t: 'It isn’t music. It’s the patients, all humming one note together, for hours.'},
  pell: {n: "Pell's Testimony", t: 'Pell grips your sleeve: “He built something in the basement. He made them listen to it every night, until they started singing back.”'},
};

// ------------------------------------------------------------- monsters
const MONSTERS = {
  orderly: {n: 'Hollowed Orderly', g: 'O', hp: 4, aware: 2, horror: 1, dmg: 1, speed: 2, skill: 'str', kind: 'damage',
    bio: 'Hunts whoever last made a noise.', atk: ['Its cold hands pin you to the wall.', 'It swings a ring of keys like a cosh.', 'It drags you toward a door that isn’t there.']},
  drowned: {n: 'Drowned Patient', g: 'D', hp: 3, aware: 1, horror: 1, dmg: 2, speed: 1, skill: 'agi', kind: 'damage',
    bio: 'Slow, heavy, relentless.', atk: ['It wraps its arms around you and sinks, as if into deep water.', 'It coughs lake water into your face and claws at you.']},
  choir: {n: 'The Choir', g: 'C', hp: 5, aware: 3, horror: 1, dmg: 1, speed: 1, skill: 'will', kind: 'horror',
    bio: 'A swarm of voices. Hurts the mind, not the body. Worse in Darkness.', atk: ['A hundred voices sing your name in harmony.', 'The song gets inside your teeth.']},
  marrow: {n: 'Dr. Marrow', g: 'M', hp: 8, aware: 3, horror: 2, dmg: 2, speed: 1, skill: 'str', kind: 'damage', boss: true,
    bio: 'The Conductor. Guards what you came to do.', atk: ['He conducts, and your bones answer.', 'He strikes you with his baton, and the room rings like a bell.']},
};

// --------------------------------------------------------------- state
function newGame(picks) {
  const evLive = shuffle(Object.keys(EVIDENCE)).slice(0, CONFIG.evLive);
  const pool = shuffle(['revolver', 'axe', 'bandages', 'matches', 'clues2', 'clues2', 'holywater', 'laudanum', 'nothing']);
  const spots = {};
  const fixed = {boiler: 'valve', cabinet: 'laudanum', benches: 'oillamp', bookcase: 'spell:binding', pews: 'spell:mend', tubs: 'spell:still'};
  let pi = 0;
  for (const id of Object.keys(SEARCH)) {
    if (fixed[id]) spots[id] = {c: fixed[id]};
    else if (EVIDENCE[id] && evLive.includes(id)) spots[id] = {c: 'ev:' + id};
    else spots[id] = {c: pool[pi++ % pool.length]};
  }
  const rooms = {};
  Object.keys(ROOMS).forEach(r => rooms[r] = {rev: false});
  const S = {
    v: 2, gid: Math.random().toString(36).slice(2, 10), rev: 1, phase: 'play', step: 'inv', round: 1, threatMax: CONFIG.threatByPlayers[picks.length] || CONFIG.threatMax, maxMon: CONFIG.maxByPlayers[picks.length] || CONFIG.maxMonsters,
    threat: 0, active: -1, actions: 0, moveLeft: 0, done: picks.map(() => false),
    inv: picks.map(p => { const d = INVD(p.id); return {id: p.id, owner: p.owner, space: 'H1', items: d.start.slice(), spells: (d.spells || []).slice(), clues: CONFIG.clueStart, dmg: [], hor: [], wounded: false, insane: false, out: false, moveActs: 0}; }),
    puzzles: makePuzzles(), fire: {}, flood: {}, ext: 0, flip: null,
    rooms, tokens: [], spots, evLive, evidence: [], goal: null, engine: 0, ada: null, monsters: [], mid: 1, dark: {},
    decks: {dmg: shuffle(DMG_DECK), hor: shuffle(HOR_DECK)}, noise: null, lastRound: 0, pendingBoss: null,
    mythosUsed: [], log: [], stories: [], storySeq: 0, rseq: 0, roll: null, result: null, revealed: {},
  };
  revealRoom(S, 'hall', null);
  story(S, 'The Greywater Choir', 'Autumn, 1926. A letter from Dr. Hollis Marrow, director of Greywater Sanatorium, reached each of you on the same morning: “Come quickly. The patients have begun to sing.”\n\nYou arrive at dusk. The building on the black lake is silent. The front doors close behind you — and lock.\n\nFind out what happened at Greywater.', 'intro');
  log(S, 'Round 1. Find out what happened at Greywater.', 'round');
  return S;
}
function log(S, t, k = '') { S.log.unshift({r: S.round, t, k}); if (S.log.length > 120) S.log.length = 120; }
function story(S, title, text, kind = 'story') { S.storySeq++; S.stories.push({seq: S.storySeq, title, text, kind}); if (S.stories.length > 12) S.stories.shift(); }
function say(S, L, t, k) { log(S, t, k); if (L) L.push({t, k}); }

const nm = inv => INVD(inv.id).name;
const first = inv => INVD(inv.id).name.split(' ').slice(-1)[0] === 'Agnes' ? 'Agnes' : INVD(inv.id).name.split(' ')[0];
const activeInv = S => S.inv.filter(i => !i.out);
const invAt = (S, sp) => S.inv.filter(i => !i.out && i.space === sp);
const monAt = (S, sp) => S.monsters.filter(m => m.space === sp);
const revealed = (S, sid) => S.rooms[roomOf(sid)].rev;
const allDone = S => S.inv.every((v, i) => v.out || S.done[i]);
const passable = (S, l) => revealed(S, l.a) && revealed(S, l.b);

function skillVal(S, inv, sk) {
  let v = INVD(inv.id)[sk];
  for (const c of inv.dmg) { const C = DMG_CARDS[c]; if (C.up && C.mod && C.mod[sk]) v += C.mod[sk]; }
  for (const c of inv.hor) { const C = HOR_CARDS[c]; if (C.up && C.mod && C.mod[sk]) v += C.mod[sk]; }
  for (const k of inv.items) { const I = ITEMS[k]; if (I && I.mod && I.mod[sk]) v += I.mod[sk]; }
  return Math.max(1, v);
}
const hasFlag = (inv, f) => inv.hor.some(c => HOR_CARDS[c].up && HOR_CARDS[c].flag === f) || inv.dmg.some(c => DMG_CARDS[c].up && DMG_CARDS[c].flag === f);
function lit(S, sid) {
  const near = [sid, ...ADJ[sid].filter(a => passable(S, a.link)).map(a => a.to)];
  return near.some(s => S.fire && S.fire[s]) || S.inv.some(i => !i.out && near.includes(i.space) && i.items.some(k => ITEMS[k] && ITEMS[k].light));
}
const inDark = (S, inv) => !!S.dark[inv.space] && !lit(S, inv.space);

function autoTest(S, inv, sk, bonus = 0) {
  const n = Math.max(1, skillVal(S, inv, sk) + bonus);
  let f = Array.from({length: n}, rollD8);
  if (sk === 'lore' && inv.id === 'elias') f = f.map(x => x === 'B' ? rollD8() : x);
  return f.filter(x => x === 'S' || (x === 'C' && sk === 'obs' && inv.id === 'juno')).length;
}

// ---------------------------------------------------- damage / horror
function draw(S, kind) {
  const d = S.decks[kind];
  if (!d.length) S.decks[kind] = shuffle(kind === 'dmg' ? DMG_DECK : HOR_DECK);
  return S.decks[kind].pop();
}
function hurt(S, inv, n, why, L) {
  if (inv.out || n <= 0) return;
  const big = n >= 2;
  if (big && (inv.spells || []).includes('still')) {
    const b = flipSpell(S, inv, 'still');
    n = b.prevent(n);
    say(S, L, `Still Water: ${b.t}`, 'good');
    if (b.horror) scare(S, inv, b.horror, 'the water remembers', L);
  }
  if (n >= CONFIG.lampDropAt && inv.items.includes('oillamp')) { inv.items.splice(inv.items.indexOf('oillamp'), 1); say(S, L, `${nm(inv)} drops the Oil Lamp. It shatters.`, 'bad'); setFire(S, inv.space, L); }
  if (n <= 0) return;
  const got = [];
  for (let k = 0; k < n; k++) { const c = draw(S, 'dmg'); inv.dmg.push(c); if (DMG_CARDS[c].up) got.push(DMG_CARDS[c].n); }
  say(S, L, `${nm(inv)} suffers ${n} Damage${why ? ' — ' + why : ''}${got.length ? ` (${got.join(', ')}!)` : ''}.`, 'bad');
  status(S, inv, L);
}
function scare(S, inv, n, why, L) {
  if (inv.out || n <= 0) return;
  if (inv.id === 'agnes') { n -= 1; if (n <= 0) { say(S, L, `${nm(inv)}'s faith holds${why ? ' against ' + why : ''}.`); return; } }
  const got = [];
  for (let k = 0; k < n; k++) { const c = draw(S, 'hor'); inv.hor.push(c); if (HOR_CARDS[c].up) got.push(HOR_CARDS[c].n); }
  say(S, L, `${nm(inv)} suffers ${n} Horror${why ? ' — ' + why : ''}${got.length ? ` (${got.join(', ')}!)` : ''}.`, 'bad');
  status(S, inv, L);
}
function discardDown(inv, kind, n) {
  const arr = kind === 'dmg' ? inv.dmg : inv.hor, CARDS = kind === 'dmg' ? DMG_CARDS : HOR_CARDS;
  let k = 0;
  for (let i = arr.length - 1; i >= 0 && k < n; i--) if (!CARDS[arr[i]].up) { arr.splice(i, 1); k++; }
  return k;
}
function status(S, inv, L) {
  if (inv.out) return;
  const d = INVD(inv.id);
  if (inv.dmg.length >= d.hp) {
    if (!inv.wounded) {
      inv.wounded = true; discardDown(inv, 'dmg', 99);
      say(S, L, `${nm(inv)} is Wounded. They can make only one Move action each round now.`, 'dire');
      if (inv.dmg.length >= d.hp) return eliminate(S, inv, 'their wounds', L);
    } else return eliminate(S, inv, 'their wounds', L);
  }
  if (inv.hor.length >= d.san) {
    if (!inv.insane) {
      inv.insane = true; discardDown(inv, 'hor', 99);
      say(S, L, `${nm(inv)} has gone Insane and drawn a secret insanity card. Only their player may read it.`, 'dire');
      story(S, `${nm(inv)} goes insane`, `Something in ${first(inv)}'s eyes has changed. They have drawn an insanity card — only their player knows what it says.`, 'insane');
      if (inv.hor.length >= d.san) return eliminate(S, inv, 'madness', L);
    } else return eliminate(S, inv, 'madness', L);
  }
}
function eliminate(S, inv, why, L) {
  inv.out = true;
  if (inv.items.length) {
    const id = 'drop-' + inv.id;
    S.spots[id] = {c: 'items', items: inv.items.slice()};
    S.tokens = S.tokens.filter(t => t.id !== id);
    S.tokens.push({id, k: 'search', sp: inv.space});
  }
  inv.items = [];
  if (S.ada && S.ada.escort === inv.id) S.ada.escort = null;
  say(S, L, `${nm(inv)} is lost to ${why}. Their belongings lie where they fell.`, 'dire');
  if (!S.lastRound) {
    S.lastRound = S.step === 'inv' ? S.round : S.round + 1;
    story(S, 'One of you has fallen', `${nm(inv)} is gone. The rest of you have until the end of ${S.step === 'inv' ? 'this' : 'the next'} investigator phase to finish this — or Greywater keeps you all.`, 'dire');
  }
  if (!activeInv(S).length) end(S, 'lost', 'Every investigator has fallen. In the Day Room, five new chairs have been turned to face the lake.');
}
function end(S, phase, text) {
  if (S.phase !== 'play') return;
  S.phase = phase; S.result = text;
  story(S, phase === 'won' ? 'Greywater falls silent' : 'The hymn is complete', text, phase);
  log(S, phase === 'won' ? 'You win.' : 'You lose.', phase === 'won' ? 'good' : 'dire');
}

// ----------------------------------------------------------- exploring
function revealRoom(S, rid, by) {
  const R = ROOMS[rid];
  if (S.rooms[rid].rev) return;
  S.rooms[rid].rev = true;
  for (const [sp, k, id] of R.tokens) S.tokens.push({id, k, sp});
  if (R.dark) Object.keys(R.sp).forEach(s => S.dark[s] = true);
  const L = [];
  for (const [type, sp] of (R.spawn || [])) L.push(spawn(S, type, sp));
  if (rid === 'boiler' && S.boilerBurst) { S.boilerBurst = false; S.fire = S.fire || {}; S.fire.B1 = true; L.push('The boiler has burst. Fire has taken hold around it.'); }
  if (S.pendingBoss && roomOf(S.pendingBoss) === rid) { L.push(spawn(S, 'marrow', S.pendingBoss)); S.pendingBoss = null; }
  if (S.ada && !S.ada.found && roomOf(S.ada.space) === rid) { S.ada.found = true; L.push('Someone is here: a young woman in a patient’s gown, humming under her breath. Ada Wren.'); }
  if (by) story(S, R.n, R.d + (L.length ? '\n\n' + L.join('\n') : '') + (R.dark ? '\n\nIt is dark here. You cannot spend Clues in Darkness without a light.' : ''), 'room');
}
function exploreTargets(S) {
  // unexplored doorways: [{key, from (revealed space), room (hidden), door|stairs}]
  const out = [];
  for (const l of LINKS) {
    if (l.door == null && l.stairs == null) continue;
    const ra = revealed(S, l.a), rb = revealed(S, l.b);
    if (ra === rb) continue;
    out.push({key: l.door != null ? 'd' + l.door : 's' + l.stairs, from: ra ? l.a : l.b, to: ra ? l.b : l.a, room: roomOf(ra ? l.b : l.a), link: l});
  }
  return out;
}

// ------------------------------------------------------------ monsters
function spawn(S, type, sp) {
  if (S.monsters.filter(m => !MONSTERS[m.type].boss).length >= (S.maxMon || CONFIG.maxMonsters) && !MONSTERS[type].boss) return 'Something moves inside the walls, but does not come out — yet.';
  if (!sp) {
    const cand = Object.keys(SP).filter(s => revealed(S, s));
    const dist = distFromInvestigators(S);
    const pool = type === 'choir' ? cand.filter(s => ROOMS[roomOf(s)].basement || roomOf(s) === 'stair') : cand;
    const occupied = new Set(activeInv(S).map(i => roomOf(i.space)));
    let use = (pool.length ? pool : cand).filter(s => !occupied.has(roomOf(s)));
    if (!use.length) use = (pool.length ? pool : cand).filter(s => !invAt(S, s).length);
    const c2 = use.length ? use : cand;
    const far = c2.slice().sort((a, b) => (dist[b] ?? 9) - (dist[a] ?? 9));
    sp = pick(far.slice(0, Math.max(1, Math.ceil(far.length / 3))));
  }
  S.monsters.push({mid: S.mid++, type, space: sp, wounds: 0});
  return `${MONSTERS[type].n} appears in the ${ROOMS[roomOf(sp)].n}.`;
}
function bfs(S, from, opts = {}) {
  const dist = {[from]: 0}, prev = {}, q = [from];
  while (q.length) {
    const s = q.shift();
    if (opts.blockMon && s !== from && monAt(S, s).length) continue;
    for (const a of ADJ[s]) {
      if (a.to in dist || !passable(S, a.link)) continue;
      if (opts.avoidFire && S.fire && S.fire[a.to]) continue;
      dist[a.to] = dist[s] + 1; prev[a.to] = s; q.push(a.to);
    }
  }
  return {dist, prev};
}
function distFromInvestigators(S) {
  const best = {};
  for (const i of activeInv(S)) { const {dist} = bfs(S, i.space); for (const [s, d] of Object.entries(dist)) if (best[s] == null || d < best[s]) best[s] = d; }
  return best;
}
function monsterAttack(S, m, inv, L) {
  const M = MONSTERS[m.type];
  const s = autoTest(S, inv, M.skill);
  const loss = Math.max(0, M.dmg - s);
  const line = pick(M.atk).replace(/\.$/, '');
  if (!loss) { say(S, L, `${M.n} → ${nm(inv)}: ${line} (${SKILL_NAMES[M.skill]} ${s}: no harm done.)`); return; }
  if (M.kind === 'horror') scare(S, inv, loss, `${M.n}: ${line}`, L); else hurt(S, inv, loss, `${M.n}: ${line}`, L);
}
function activateMonsters(S, L) {
  for (const m of S.monsters.slice()) {
    if (S.phase !== 'play') return;
    if (!S.monsters.includes(m)) continue;
    const M = MONSTERS[m.type];
    let targets = activeInv(S);
    if (m.type === 'orderly' && S.noise) { const t = S.inv.find(i => i.id === S.noise && !i.out); if (t) targets = [t]; }
    if (!targets.length) return;
    const start = m.space;
    fireHurtsMon(S, m, L);
    if (!S.monsters.includes(m)) continue;
    const bound = m.bound; m.bound = null;
    if (bound) say(S, L, `The ${M.n} strains against the Binding Thread.`);
    let budget = bound ? 0 : M.speed, guard = 0;
    while (budget > 0 && guard++ < 6) {
      if (invAt(S, m.space).some(i => targets.includes(i))) break;
      const {prev, dist} = bfs(S, m.space, {avoidFire: m.type === 'choir'});
      const goal = targets.map(t => t.space).filter(s => dist[s] != null).sort((a, b) => dist[a] - dist[b])[0];
      if (!goal) break;
      let c = goal; while (prev[c] !== m.space) c = prev[c];
      m.space = c;
      if (!(m.type === 'drowned' && floodAt(S, c))) budget--;
      if (fireAt(S, c)) { fireHurtsMon(S, m, L); if (!S.monsters.includes(m)) break; }
    }
    if (!S.monsters.includes(m)) continue;
    if (m.space !== start) say(S, L, `${M.n} moves to the ${ROOMS[roomOf(m.space)].n} (${SP[m.space].n}).`);
    const here = invAt(S, m.space);
    if (here.length && bound !== 'all') monsterAttack(S, m, pick(here), L);
  }
}
function horrorChecks(S, L) {
  for (const inv of activeInv(S)) {
    if (S.phase !== 'play') return;
    const ms = S.monsters.filter(m => roomOf(m.space) === roomOf(inv.space));
    if (!ms.length) continue;
    const hz = Math.max(...ms.map(m => MONSTERS[m.type].horror + (m.type === 'choir' && S.dark[m.space] ? 1 : 0)));
    const top = ms.find(m => MONSTERS[m.type].horror + (m.type === 'choir' && S.dark[m.space] ? 1 : 0) === hz);
    const w = autoTest(S, inv, 'will');
    const loss = Math.max(0, hz - w);
    const tn = MONSTERS[top.type].n.replace(/^The /, '');
    if (loss) scare(S, inv, loss, `the sight of the ${tn}`, L);
    else say(S, L, `${nm(inv)} holds their nerve before the ${tn} (Will ${w}).`);
  }
}

// --------------------------------------------------------------- mythos
const UPSTAIRS = ['hall', 'corr', 'day', 'nurse', 'office', 'ward', 'chapel'];
const MYTHOS = [
  {id: 'radiators', t: 'The radiators knock', f: 'Every pipe in the building knocks in the same slow rhythm, like a metronome counting in a song.',
    fx: (S, L) => activeInv(S).forEach(i => { if (autoTest(S, i, 'will') < 1) scare(S, i, 1, 'the knocking', L); else say(S, L, `${nm(i)} keeps their own rhythm (Will).`); })},
  {id: 'bell', min: 2, t: 'A call bell rings', f: 'Down a corridor, a patient’s call bell rings, and rings, and rings.', fx: (S, L) => say(S, L, spawn(S, 'orderly'), 'bad')},
  {id: 'lights', t: 'The lights gutter', f: 'The bulbs dim to orange threads, then die.',
    fx: (S, L) => {
      const c = shuffle(Object.keys(SP).filter(s => revealed(S, s) && UPSTAIRS.includes(roomOf(s)) && !S.dark[s])).slice(0, 2);
      c.forEach(s => S.dark[s] = true);
      say(S, L, c.length ? `Darkness falls in: ${c.map(s => `${ROOMS[roomOf(s)].n} (${SP[s].n})`).join(', ')}.` : 'But there is no more light to lose.', 'bad');
    }},
  {id: 'name', t: 'Someone says your name', f: 'A voice from the next room says a name, gently, the way a mother would.',
    fx: (S, L) => { const i = pick(activeInv(S)); if (autoTest(S, i, 'will') < 1) scare(S, i, 2, 'it knows them', L); else { i.clues++; say(S, L, `${nm(i)} answers back — and learns something (+1 Clue).`, 'clue'); } }},
  {id: 'breath', t: 'A held breath', f: 'For one moment the building is silent, and you remember who you are.',
    fx: (S, L) => { activeInv(S).forEach(i => discardDown(i, 'hor', 1)); say(S, L, 'Each investigator discards 1 face-down Horror.', 'good'); }},
  {id: 'footsteps', min: 2, t: 'Wet footsteps', f: 'Bare feet slap across tile somewhere close by.', fx: (S, L) => say(S, L, spawn(S, 'drowned'), 'bad')},
  {id: 'gramophone', t: 'The gramophone plays', f: 'In the Day Room, a record starts by itself: thirteen voices, one note.',
    fx: (S, L) => {
      const near = activeInv(S).filter(i => ['day', 'corr', 'chapel'].includes(roomOf(i.space)));
      if (!near.length) say(S, L, 'Nobody is close enough to hear it clearly.');
      near.forEach(i => { if (autoTest(S, i, 'will') < 1) scare(S, i, 1, 'the record', L); else say(S, L, `${nm(i)} shuts it out (Will).`); });
    }},
  {id: 'cold', t: 'Cold water rises', f: 'The basement drains gurgle, then overflow.',
    fx: (S, L) => {
      const v = activeInv(S).filter(i => ROOMS[roomOf(i.space)].basement);
      const bs = Object.keys(SP).filter(s => revealed(S, s) && ROOMS[roomOf(s)].basement && !floodAt(S, s));
      if (bs.length) setFlood(S, pick(bs), L);
      if (!v.length) say(S, L, 'Below you, water laps at the bottom of the stairs.');
      v.forEach(i => { if (autoTest(S, i, 'agi') < 1) hurt(S, i, 1, 'the freezing water', L); else say(S, L, `${nm(i)} keeps their footing (Agility).`); });
    }},
  {id: 'whisper', t: 'Whispers in the dark', f: 'Where the light doesn’t reach, something is humming along.',
    fx: (S, L) => {
      const v = activeInv(S).filter(i => inDark(S, i));
      if (!v.length) say(S, L, 'Your lights hold it back — for now.');
      v.forEach(i => scare(S, i, 1, 'the dark sings', L));
    }},
  {id: 'seep', min: 3, t: 'Water under the door', f: 'Lake water seeps under a door and spreads across the floor, black and very cold.', fx: (S, L) => { const c = Object.keys(SP).filter(s => revealed(S, s) && !floodAt(S, s)); if (c.length) setFlood(S, pick(c), L); }},
  {id: 'quiet', t: 'Nothing', f: 'Nothing happens. Somehow that is worse.', fx: (S, L) => {}},
  {id: 'hymn', t: 'The hymn rises', min: 6, f: 'Voices rise from below, in perfect and terrible harmony.', fx: (S, L) => say(S, L, spawn(S, 'choir'), 'bad')},
];
const BEATS = {
  4: {t: 'The building settles', f: 'Doors that were locked an hour ago now stand open. Something is walking the halls on purpose.', fx: (S, L) => say(S, L, spawn(S, 'orderly'), 'bad')},
  8: {t: 'The water begins to sing', f: 'Beneath your feet, the lake under Greywater has found its voice. The lights go out across the building.', fx: (S, L) => {
    say(S, L, spawn(S, 'choir'), 'bad');
    shuffle(Object.keys(SP).filter(s => revealed(S, s) && !S.dark[s])).slice(0, 3).forEach(s => S.dark[s] = true);
    if (S.rooms.boiler.rev) { say(S, L, 'The boiler bursts.', 'bad'); setFire(S, 'B1', L); }
    else if (CONFIG.lateBurst) { S.boilerBurst = true; say(S, L, 'Far below, something bursts with a deep metallic boom.', 'bad'); }
  }},
  12: {t: 'The hymn swells', f: 'Plaster dust falls like snow. The song is nearly complete.', fx: (S, L) => activeInv(S).forEach(i => { if (autoTest(S, i, 'will') < 2) scare(S, i, 1, 'the swelling hymn', L); else say(S, L, `${nm(i)} grits their teeth through it.`); })},
};

// Act I safety net: from the second story beat on, if the Reveal hasn't happened, the house points at one piece of evidence still waiting
function evidenceHint(S, L) {
  const left = S.evLive.filter(id => !S.evidence.includes(EVIDENCE[id].n));
  if (!left.length) return;
  const id = pick(left);
  const rid = Object.keys(ROOMS).find(r => (ROOMS[r].tokens || []).some(t => t[2] === id));
  if (!rid) return;
  say(S, L, `The hymn falters for a moment, and in the silence you are sure of it: something that matters is waiting in the ${ROOMS[rid].n}.`, 'good');
}

function mythosPhase(S) {
  const L = [];
  S.step = 'mythos';
  if (S.lastRound && S.round >= S.lastRound) {
    end(S, 'lost', 'You ran out of time after one of you fell. The doors of Greywater never open again.');
    S.step = 'inv'; return;
  }
  S.threat++;
  const beat = BEATS[S.threat];
  let title, flavor;
  if (beat) { title = beat.t; flavor = beat.f; log(S, `Mythos: ${beat.t}. ${beat.f}`, 'myth'); beat.fx(S, L); if (!S.goal && S.threat > CONFIG.beats[0]) evidenceHint(S, L); }
  else {
    const opts = MYTHOS.filter(m => (!m.min || S.threat >= m.min) && !S.mythosUsed.slice(-4).includes(m.id));
    const ev = pick(opts);
    S.mythosUsed.push(ev.id);
    title = ev.t; flavor = ev.f; log(S, `Mythos: ${ev.t}. ${ev.f}`, 'myth'); ev.fx(S, L);
  }
  if (S.phase === 'play') spreadFire(S, L);
  const section = (h, fn) => { const n = L.length; L.push({t: h, k: 'round'}); fn(S, L); if (L.length === n + 1) L.pop(); };
  if (S.phase === 'play' && CONFIG.noiseSummon && !(CONFIG.noiseSummon === 'once' && S.noiseSummoned) && S.noise && !S.monsters.some(m => m.type === 'orderly')) { const who = S.inv.find(i => i.id === S.noise); if (who && !who.out) { S.noiseSummoned = true; say(S, L, `Something heard the noise ${nm(who)} made. ` + spawn(S, 'orderly'), 'bad'); } }
  if (S.phase === 'play') section('— The monsters move —', activateMonsters);
  if (S.phase === 'play') section('— Horror checks —', horrorChecks);
  if (S.phase === 'play' && S.threat >= (S.threatMax || CONFIG.threatMax)) end(S, 'lost', 'The last note of the hymn rings out across the black lake. Every voice in Greywater — yours included — joins in.');
  S.noise = null;
  S.step = 'inv';
  if (S.phase === 'play') {
    S.round++;
    S.done = S.inv.map(() => false);
    S.inv.forEach(i => i.moveActs = 0);
    log(S, `Round ${S.round}.`, 'round');
  }
  story(S, title, flavor + '\n\n' + L.map(l => (l.k === 'round' ? '' : '• ') + l.t).join('\n'), 'mythos');
}

// --------------------------------------------------------- the reveal
function gainEvidence(S, inv, key) {
  const E = EVIDENCE[key];
  if (S.evidence.includes(E.n)) return;
  S.evidence.push(E.n);
  log(S, `${nm(inv)} finds evidence: ${E.n} (${S.evidence.length}/${CONFIG.evidenceNeeded}).`, 'clue');
  story(S, `Evidence: ${E.n}`, E.t + `\n\nEvidence ${S.evidence.length} of ${CONFIG.evidenceNeeded}.`, 'evidence');
  if (S.evidence.length >= CONFIG.evidenceNeeded && !S.goal) theReveal(S);
}
function theReveal(S) {
  S.goal = pick(['A', 'B']);
  if (S.goal === 'A') {
    const t = 'The pieces fit together. Marrow built a machine — the Resonance Engine — in Hydrotherapy, to amplify the song of the lake. It is still running, and the hymn is building toward its final note.\n\nYOUR GOAL: Bring the Valve Wheel from the Boiler Room to the Engine in Hydrotherapy, then turn its valves until the lake water drains away from the machine (a pipe puzzle: Interact, steps equal to your Strength).\n\nDr. Marrow is waiting for you down there.';
    story(S, 'The Reveal: the Resonance Engine', t, 'reveal');
    if (S.rooms.hydro.rev) spawn(S, 'marrow', 'Y3'); else S.pendingBoss = 'Y3';
  } else {
    const rooms = ['ward', 'chapel', 'morgue', 'day'];
    const r = pick(rooms), sps = Object.keys(ROOMS[r].sp);
    S.ada = {space: pick(sps), escort: null, found: S.rooms[r].rev};
    const t = 'The Choir needs a voice to follow — and that voice is Ada Wren, Patient 13. She is still alive, somewhere in this building, and every night the song grows around her.\n\nYOUR GOAL: Find Ada, calm her (Interact, Influence) so she follows you, and lead her out through the front doors in the Receiving Hall. The chains on those doors have just fallen away.\n\nDr. Marrow will not let her go easily.';
    story(S, 'The Reveal: Patient 13', t, 'reveal');
    const far = distFromInvestigators(S);
    const cand = Object.keys(SP).filter(s => revealed(S, s) && !invAt(S, s).length).sort((a, b) => (far[b] ?? 0) - (far[a] ?? 0));
    spawn(S, 'marrow', cand[0] || 'C2');
  }
  log(S, 'The Reveal: ' + (S.goal === 'A' ? 'silence the Resonance Engine.' : 'lead Ada Wren out alive.'), 'clue');
}
function goalText(S) {
  if (!S.goal) return `Act I · Find evidence (${S.evidence.length}/${CONFIG.evidenceNeeded})`;
  if (S.goal === 'A') return 'Act II · Silence the Engine';
  return S.ada && S.ada.escort ? 'Act II · Lead Ada to the front doors' : 'Act II · Find Ada Wren';
}
