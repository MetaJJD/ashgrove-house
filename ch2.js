/* Chapter 2 — Salt and Tide: the lighthouse on Brannoc Rock, off the fishing village of Saltmere.
   New here: the tide (Low → Rising → High → Falling, one step per Mythos phase), two investigators who join from
   this chapter on, four monsters, two new puzzle types, and three possible goals (goal B can end in a partial win). */

// ------------------------------------------------------------ investigators (Chapter 2 onward)
INVESTIGATORS.push(
  {id: 'nell', ch: 2, name: 'Nell Tregarth', role: 'Lifeboat coxswain', color: '#5f9fc4', hat: 'souwester', hp: 8, san: 6, str: 4, agi: 4, obs: 2, lore: 1, inf: 2, will: 3, start: ['boathook'],
    ability: 'Sea Legs', text: 'Water never slows you: Shallows and Submerged spaces cost you nothing extra, and you get +1 die on Agility tests while standing in water.'},
  {id: 'linus', ch: 2, name: 'Linus Achterberg', role: 'Oceanographer', color: '#9fb39a', hat: 'specs', hp: 6, san: 8, str: 1, agi: 2, obs: 4, lore: 4, inf: 2, will: 3, start: ['tidetables', 'handlamp'],
    ability: 'Tide Tables', text: 'Once per scenario (free): hold the tide for a round, or make it turn a step early.'},
);

// ------------------------------------------------------------ items
Object.assign(ITEMS, {
  boathook: {n: 'Boat Hook', w: {melee: true, reach: true, skill: 'str', bonus: 1}, t: 'Melee weapon with reach: +1 die, and you may attack a monster in a space next to yours.'},
  tidetables: {n: 'Brass Tide Tables', t: '+1 step on the Signal Key and the Tide-Lock puzzles.'},
  handlamp: {n: 'Hand Lamp', light: true, t: 'Light Source: you and anyone in or next to your space ignore Darkness.'},
  lenskey: {n: 'The Lens Key', unique: true, t: 'A brass key stamped with a lighthouse. It turns the lens mounting in the Lamp Room.'},
  salt: {n: 'Rock Salt', unique: true, t: 'A jar of coarse salt from the cellar. One of three things the rite needs.'},
  clapper: {n: 'Bell Clapper', unique: true, t: 'The iron tongue of the drowned bell. One of three things the rite needs.'},
  ring: {n: 'Wedding Ring', unique: true, t: 'Hester Brannock’s ring, green with salt. One of three things the rite needs.'},
});
LIGHTS.push('handlamp');

// ------------------------------------------------------------ monsters
Object.assign(MONSTERS, {
  netted: {n: 'The Netted', g: 'N', hp: 4, aware: 2, horror: 1, dmg: 1, speed: 2, skill: 'agi', kind: 'damage', snare: true,
    bio: 'Drowned men wrapped in their own nets. A hit leaves you Restrained.', atk: ['Wet net closes over your arms.', 'It drags you down by a tangle of rope.', 'Fish hooks catch in your coat and hold.']},
  brine: {n: 'Brine Wretch', g: 'W', hp: 3, aware: 1, horror: 1, dmg: 1, speed: 1, skill: 'agi', kind: 'damage', swim: true, needPool: true,
    pool: (S, s) => waterAt(S, s) >= 1, noPool: 'Something stirs below the waterline, waiting for the tide.',
    bio: 'Crawls out of the water. Fast in water, slow on dry land.', atk: ['It bites, and its mouth is full of sand.', 'It wraps around your legs and pulls you under.']},
  gulls: {n: 'Gull Swarm', g: 'G', hp: 2, aware: 3, horror: 1, dmg: 1, speed: 3, skill: 'will', kind: 'horror',
    bio: 'A screaming cloud of gulls with green eyes. Hurts the mind.', atk: ['A hundred wings beat around your head, screaming.', 'Their cries sound like your name.']},
  silas: {n: 'Silas Brannock', g: 'S', hp: 8, aware: 3, horror: 1, dmg: 1, speed: 1, skill: 'str', kind: 'damage', boss: true, tideBonus: true,
    bio: 'The Lamplighter. His lantern-eye blinds: his space and those next to it are Darkness for you. +1 damage at High tide.', atk: ['He swings his lantern, and green fire sears your eyes.', 'His wet hands close on your throat.', 'He presses you against the cold glass of the lens.']},
});

// ------------------------------------------------------------ search spots and evidence
Object.assign(SEARCH, {
  slipway: {n: 'Slipway', t: 'Coils of rope, a split oar, a tin box wedged under the rails.'},
  nets: {n: 'Boat bay', t: 'Nets hung to dry, still wet. Something is knotted into them.'},
  loft: {n: 'Net loft', t: 'Floats, lines and a sea chest.'},
  deck: {n: 'Wreck deck', t: 'The schooner’s deck, slick with weed.'},
  pantry: {n: 'Pantry', t: 'Bread gone green. Five plates set out, never used.'},
  drawings: {n: 'The children’s beds', t: 'Drawings pinned to the bedheads, all of the same green sun.'},
  toybox: {n: 'Toy box', t: 'Tin soldiers, a doll with seaweed for hair.'},
  chpews: {n: 'Chapel pews', t: 'A hymnal, a lantern, a coat left behind.'},
  oilstore: {n: 'Oil store', t: 'Barrels of lamp oil. Careful.'},
  gallery: {n: 'The gallery', t: 'The walkway round the tower. The wind tries to take everything.'},
  machinery: {n: 'Lamp machinery', t: 'Clockwork that turns the lens. Something is caught in the gears.'},
  barrels: {n: 'Cellar barrels', t: 'Salt pork, salt fish, salt.'},
  cistern: {n: 'Cistern', t: 'Black water, very still.', test: ['will', 1, 'Reach in (test Will)']},
  grotto: {n: 'Grotto', t: 'Tide-worn rock and offerings: shells, coins, buttons.'},
  altar: {n: 'Altar pool', t: 'A pool ringed with candle stubs.', test: ['agi', 1, 'Reach the bottom (test Agility)']},
  keybox: {n: 'The keeper’s strongbox', t: 'A small iron box, half buried.'},
  saltjar: {n: 'The salt crock', t: 'A crock of coarse rock salt.'},
  clapper: {n: 'The drowned bell', t: 'The bell’s clapper is rusted into place.', test: ['str', 1, 'Wrench it free (test Strength)']},
  drowned1: {n: 'The drowned fisherman', t: 'His pockets are full of the sea — and something else.'},
  ringpool: {n: 'Under the altar pool', t: 'Something gold glints on the bottom.', test: ['will', 1, 'Reach into the cold (test Will)']},
});
Object.assign(EVIDENCE, {
  keeperlog: {n: 'The Keeper’s Log', t: 'Silas Brannock’s hand grows larger page by page: “The new glass shows me where to shine. Something answers from far out. Hester says I talk in my sleep. I do not sleep.”'},
  drawings: {n: 'The Children’s Drawings', t: 'Ezra and Maud drew the same thing, over and over: a green sun under the sea, and a ladder of light reaching down to it.'},
  signal: {n: 'Marrow’s Letter', t: '“My dear Brannock — fit the enclosed glass to your lamp and turn it on the deep each night. You will be well paid. The choir here is nearly ready; it needs something to sing to.” Signed: H. Marrow.'},
  tidelock: {n: 'The Schooner’s Manifest', t: 'Cargo, loaded at Greywater jetty: one crate of lens glass, green, “handle in darkness only.” Consignee: S. Brannock, Brannoc Rock Light.'},
  knots: {n: 'The Bell Rope', t: 'Thirteen knots, tied the way the Greywater patients knotted their sheets. Someone from the asylum has been here.'},
});

// ------------------------------------------------------------ interactions
Object.assign(INTERACT, {
  boat: {n: 'The keeper’s boat',
    info: S => S.goal === 'B' ? `The boat can leave only on a Falling or Low tide (now: ${TIDE_NAMES[S.tide]}). Bring the children here.` : 'A sturdy rowing boat, tied up and bailed. You came here to finish something.',
    can: (S, inv) => {
      if (S.goal !== 'B') return [false, 'Not without finishing what you came for.'];
      const here = (S.kids || []).filter(k => k.escort && k.space === inv.space);
      if (!here.length) return [false, 'Bring at least one of the children here.'];
      if (S.tide !== 0 && S.tide !== 3) return [false, `The tide is ${TIDE_NAMES[S.tide]}: wait for it to fall.`];
      return [true];
    },
    label: () => 'Push off with the children',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const here = D.kids.filter(k => k.escort && k.space === inv.space);
      if (here.length < D.kids.length) {
        const ok = ctx.ask ? await ctx.ask('Leave with only one child?', `${here.map(k => k.n).join(' and ')} is with you. The other is still on the rock. This ends the game as a partial win.`) : true;
        if (!ok) return 'free';
        end(D, 'won', `The boat pulls away with ${here[0].n} wrapped in your coats. Behind you the lamp burns green, and on the rock a small figure stands at the water’s edge and does not wave. You saved one. You will carry the other for the rest of your life.`, true);
        return true;
      }
      end(D, 'won', 'The boat pulls clear of Brannoc Rock with Ezra and Maud between you, soaked and silent. Halfway to the mainland the green light falters, and for the first time in nine nights, the lamp on Brannoc Rock goes dark.');
      return true;
    }},
  keeperlog: {n: 'The keeper’s log', info: () => 'A thick logbook on the parlour table, open at the last page.', label: () => 'Read it closely (Lore)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const s = await ctx.test('lore', {label: 'Make sense of the keeper’s log', need: 1});
      if (s >= 1) { removeToken(D, 'keeperlog'); if (D.evLive.includes('keeperlog')) gainEvidence(D, inv, 'keeperlog'); else { inv.clues += 2; log(D, `${nm(inv)} pieces together the keeper's last weeks (+2 Clues).`, 'clue'); } }
      else scare(D, inv, 1, 'the handwriting keeps growing');
      return true;
    }},
  signal: {n: 'The signal key', info: () => 'A brass telegraph key wired to the lamp, and a locked desk drawer beside it.', label: () => 'Answer the lamp (puzzle · Lore)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('signal', inv);
      D.puzzles.signal = r.state;
      if (r.wrong) { D.noise = inv.id; log(D, `The lamp stutters as ${nm(inv)} keys the wrong colour. Out at sea, something notices.`, 'bad'); }
      if (r.state.solved) { removeToken(D, 'signal'); if (D.evLive.includes('signal')) gainEvidence(D, inv, 'signal'); else { inv.clues += 2; log(D, `The drawer clicks open: the keeper's notes (+2 Clues).`, 'clue'); } }
      return true;
    }},
  tidelock: {n: 'The schooner’s strongbox', info: () => 'An iron strongbox bolted to the hold. Its dial is marked with tide words.', label: () => 'Work the lock (puzzle · Lore)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('tidelock', inv);
      D.puzzles.tidelock = r.state;
      if (r.wrong) { D.noise = inv.id; log(D, `${nm(inv)} hammers at the wrong combination. The hull rings like a bell.`, 'bad'); }
      if (r.state.solved) { removeToken(D, 'tidelock'); if (D.evLive.includes('tidelock')) gainEvidence(D, inv, 'tidelock'); else { inv.items.push('revolver'); inv.clues += 1; log(D, `${nm(inv)} opens the strongbox: a Service Revolver and the captain's papers (+1 Clue).`, 'good'); } }
      return true;
    }},
  knots: {n: 'The bell rope', info: () => 'The chapel bell hangs silent. Its rope is knotted thirteen times around the clapper.', label: () => 'Untie the knots (puzzle · Agility)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('knots', inv);
      D.puzzles.knots = r.state;
      if (r.state.solved) {
        removeToken(D, 'knots');
        if (D.evLive.includes('knots')) gainEvidence(D, inv, 'knots');
        else { story(D, 'The last knot', 'As the last knot gives, the bell sways and almost rings. In the silence before it, a word comes to you that could unmake something.', 'story'); gainSpell(D, inv, 'wither'); }
      } else log(D, `${nm(inv)} works at the knots.`);
      return true;
    }},
  tube: {n: 'The speaking tube', info: () => 'A brass speaking tube runs up to the lamp. Someone is breathing at the other end.', label: () => 'Listen (Will)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const s = await ctx.test('will', {label: 'Listen at the speaking tube', need: 1});
      if (s >= 1) { inv.clues++; removeToken(D, 'tube'); story(D, 'A voice in the tube', 'A woman’s voice, very far away: “Hester. My name was Hester. When the lamp turns on you, breathe out and become the sea-fog. Get my children off this rock.”\n\n+1 Clue.', 'story'); gainSpell(D, inv, 'veil'); }
      else scare(D, inv, 1, 'the breathing becomes singing');
      return true;
    }},
  lens: {n: 'The great lens',
    info: S => S.goal === 'A' ? 'The lens turns slowly, pouring green light over the sea. Its mirrors can turn the beam back down into the water.' : 'A great lens of green glass, turning slowly. It is beautiful, and you cannot look at it for long.',
    can: (S, inv) => S.goal !== 'A' ? [false, 'You do not yet know what to do with it.'] : !invAt(S, inv.space).some(i => i.items.includes('lenskey')) ? [false, 'You need the Lens Key here.'] : [true],
    label: () => 'Turn the beam (puzzle · Observation)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const r = await ctx.puzzle('lens', inv);
      D.puzzles.lens = r.state;
      if (r.state.solved) { end(D, 'won', 'The last mirror turns. The green beam bends back on itself and plunges straight down into the sea — and the sea screams. The glass cracks from edge to edge, and the lamp on Brannoc Rock goes dark.'); return true; }
      for (const i of activeInv(D).filter(x => roomOf(x.space) === 'lamp')) if (autoTest(D, i, 'will') < 1) scare(D, i, 1, 'the green light');
      return true;
    }},
  rite: {n: 'The rite', info: S => 'Salt for the sea, the bell to call him, her ring to remind him. Bring all three here together.',
    can: (S, inv) => { const have = new Set(invAt(S, inv.space).flatMap(i => i.items)); return ['salt', 'clapper', 'ring'].every(k => have.has(k)) ? [true] : [false, 'You need the salt, the clapper and the ring here.']; },
    label: () => 'Perform the rite (Will, need 2)',
    async run(D, inv, ctx) {
      if (!(await ctx.gate())) return true;
      const s = await ctx.test('will', {label: 'Speak the rite over the salt, the bell and the ring', need: 2});
      if (s >= 2) end(D, 'won', 'The clapper strikes the bell once. Out on the rock, Silas Brannock stops, and turns his head as if he has heard his wife call him in from the boats. He walks into the sea without looking back, and the green lamp gutters out behind him.');
      else { log(D, 'The rite falters. Out in the dark, the Lamplighter laughs.', 'bad'); activeInv(D).filter(i => i.space === inv.space).forEach(i => scare(D, i, 1, 'the rite turns back on you')); }
      return true;
    }},
  ezra: {n: 'Ezra Brannock', person: true,
    info: S => { const k = npcById(S, 'ezra'); return k && k.escort ? `Ezra is following ${nm(S.inv.find(i => i.id === k.escort))}.` : 'A boy of nine, sitting in the cold water, counting the candles over and over.'; },
    can: (S, inv) => npcById(S, 'ezra').escort === inv.id ? [false, 'He is already with you.'] : [true],
    label: S => npcById(S, 'ezra') && npcById(S, 'ezra').escort ? 'Take his hand (he follows you instead)' : 'Coax him out (Influence)',
    async run(D, inv, ctx) { return kidRun(D, inv, ctx, 'ezra'); }},
  maud: {n: 'Maud Brannock', person: true,
    info: S => { const k = npcById(S, 'maud'); return k && k.escort ? `Maud is following ${nm(S.inv.find(i => i.id === k.escort))}.` : 'A girl of six, hiding, humming her father’s song.'; },
    can: (S, inv) => npcById(S, 'maud').escort === inv.id ? [false, 'She is already with you.'] : [true],
    label: S => npcById(S, 'maud') && npcById(S, 'maud').escort ? 'Take her hand (she follows you instead)' : 'Coax her out (Influence)',
    async run(D, inv, ctx) { return kidRun(D, inv, ctx, 'maud'); }},
});
async function kidRun(D, inv, ctx, id) {
  if (!(await ctx.gate())) return true;
  const k = npcById(D, id);
  if (k.escort) { k.escort = inv.id; log(D, `${k.n} now follows ${nm(inv)}.`); return true; }
  const s = await ctx.test('inf', {label: `Coax ${k.n} out`, need: 1});
  if (s >= 1) { k.escort = inv.id; story(D, k.n, `${k.n} stops ${id === 'ezra' ? 'counting' : 'humming'} and looks at ${first(inv)} for a long moment. Then ${id === 'ezra' ? 'he' : 'she'} takes ${first(inv)}'s hand.`, 'story'); }
  else scare(D, inv, 1, `${k.n} screams for their father`);
  return true;
}

// ------------------------------------------------------------ map
const SALT_ROOMS = {
  landing: {n: 'The Landing', x: 4, y: 8, w: 3, h: 2, floor: 'wood',
    d: 'A stone jetty and a slipway, slick with weed. The causeway behind you is already under water.',
    sp: {J1: [0, 0, 2, 2, 'Jetty', 0], J2: [2, 0, 1, 2, 'Slipway', 0]},
    tokens: [['J1', 'interact', 'boat'], ['J2', 'search', 'slipway']]},
  boathouse: {n: 'Boathouse & Net Loft', x: 7, y: 8, w: 2, h: 2, floor: 'wood',
    d: 'The lifeboat’s mooring is empty. Nets hang everywhere, and some of them are moving in a wind you can’t feel.',
    sp: {A1: [0, 0, 1, 2, 'Boat bay', 0], A2: [1, 0, 1, 2, 'Net loft', 1]},
    tokens: [['A1', 'search', 'nets'], ['A2', 'search', 'loft']]},
  wreck: {n: 'The Wreck', x: 1, y: 8, w: 3, h: 2, floor: 'wood',
    d: 'A schooner lies broken on the rocks, her name scraped off. You can only reach her when the tide is out.',
    sp: {R1: [0, 0, 2, 2, 'Deck', 0], R2: [2, 0, 1, 2, 'Hold', 0]},
    tokens: [['R1', 'search', 'deck'], ['R2', 'interact', 'tidelock']]},
  cottage: {n: 'Keeper’s Cottage', x: 4, y: 6, w: 3, h: 2, floor: 'carpet',
    d: 'The table is set for five. The bread has gone green. A clock on the wall has stopped at the hour the lamp is lit.',
    sp: {K1: [0, 0, 2, 2, 'Kitchen', 1], K2: [2, 0, 1, 2, 'Parlour', 1]},
    tokens: [['K1', 'search', 'pantry'], ['K2', 'interact', 'keeperlog']]},
  children: {n: 'Children’s Room', x: 7, y: 6, w: 2, h: 2, floor: 'wood',
    d: 'Two small beds, unmade. The walls are covered in drawings of a green sun.',
    sp: {Q1: [0, 0, 1, 2, 'Beds', 1], Q2: [1, 0, 1, 2, 'Window seat', 1]},
    tokens: [['Q1', 'search', 'drawings'], ['Q2', 'search', 'toybox']]},
  rockchapel: {n: 'Chapel of St Brannoc', x: 1, y: 5, w: 3, h: 2, floor: 'stone',
    d: 'A tiny wayside chapel built into the rock. Its bell hangs silent, its rope knotted and wet.',
    sp: {V1: [0, 0, 2, 2, 'Pews', 1], V2: [2, 0, 1, 2, 'The bell', 1]},
    tokens: [['V1', 'search', 'chpews'], ['V2', 'interact', 'knots']]},
  towerbase: {n: 'Tower Base', x: 5, y: 4, w: 2, h: 2, floor: 'stone',
    d: 'The foot of the lighthouse. Oil barrels, a spiral stair, and a brass speaking tube that hisses.',
    sp: {T1: [0, 0, 1, 2, 'Oil store', 1], T2: [1, 0, 1, 2, 'Stair foot', 1]},
    tokens: [['T1', 'search', 'oilstore'], ['T2', 'interact', 'tube']]},
  watch: {n: 'Watch Room', x: 5, y: 2, w: 2, h: 2, floor: 'wood',
    d: 'Barometers, logbooks, a telegraph key wired to the lamp above. A door opens onto the gallery and the wind.',
    sp: {U1: [0, 0, 1, 2, 'Desk', 2], U2: [1, 0, 1, 2, 'Gallery', 2]},
    tokens: [['U1', 'interact', 'signal'], ['U2', 'search', 'gallery']]},
  lamp: {n: 'Lamp Room', x: 5, y: 0, w: 2, h: 2, floor: 'tile',
    d: 'The great lens turns in a cage of brass, pouring green light over the sea. The glass is warm, and humming.',
    sp: {Z1: [0, 0, 1, 2, 'The lens', 2], Z2: [1, 0, 1, 2, 'Machinery', 2]},
    tokens: [['Z1', 'interact', 'lens'], ['Z2', 'search', 'machinery']]},
  cellar: {n: 'Cellar Store', x: 7, y: 11, w: 2, h: 2, floor: 'stone', dark: true,
    d: 'A trapdoor drops into a cellar cut from the rock. It smells of brine. The floor is wet even at low tide.',
    sp: {X1: [0, 0, 1, 2, 'Barrels', 0], X2: [1, 0, 1, 2, 'Cistern', 0]},
    tokens: [['X1', 'search', 'barrels'], ['X2', 'search', 'cistern']]},
  cave: {n: 'Sea Cave', x: 4, y: 11, w: 3, h: 2, floor: 'stone', dark: true,
    d: 'A cave under the rock, open to the sea at low tide. Candle stubs ring a still pool. Someone has been praying here.',
    sp: {G1: [0, 0, 2, 2, 'Grotto', 0], G2: [2, 0, 1, 2, 'Altar pool', 0]},
    tokens: [['G1', 'search', 'grotto'], ['G2', 'search', 'altar']], spawn: [['brine', 'G1']]},
};
const SALT_DOORS = [
  {a: [3, 9], b: [4, 9], lowOnly: true, lowTo: 'R2'},   // the rocks out to the wreck: open only at Low tide
  {a: [6, 8], b: [7, 8]}, {a: [4, 8], b: [4, 7]}, {a: [6, 6], b: [7, 6]}, {a: [4, 6], b: [3, 6]}, {a: [5, 6], b: [5, 5]},
  {a: [6, 11], b: [7, 11]},
];
const SALT_STAIRS = [{a: 'T2', b: 'U1'}, {a: 'U2', b: 'Z2'}, {a: 'K1', b: 'X1'}, {a: 'J2', b: 'G1', lowOnly: true, lowTo: 'G1'}];
const TOWER = ['towerbase', 'watch', 'lamp'];

// ------------------------------------------------------------ the tide
function advanceTide(S, L) {
  if (S.tideHold > 0) { S.tideHold--; L.push(`The tide holds at ${TIDE_NAMES[S.tide]}.`); return; }
  S.tide = (S.tide + 1) % 4;
  floodFromTide(S, L);
  const what = {0: 'The tide is out. The rocks to the wreck and the cave mouth are bare.', 1: 'The tide is rising. Water creeps into the low places.', 2: 'High tide. The shore and the cellars are under the sea.', 3: 'The tide is falling. The water drains back from the lower rooms.'};
  L.push(what[S.tide]);
  for (const i of activeInv(S)) if (i.id !== 'nell' && waterAt(S, i.space) >= 2) {
    if (autoTest(S, i, 'agi') < 1) hurt(S, i, 1, 'the sea closes over them', L); else say(S, L, `${nm(i)} keeps their head above the water (Agility).`);
  }
}

// ------------------------------------------------------------ Mythos
const SALT_MYTHOS = [
  {id: 'wave', t: 'A rogue wave', f: 'A wall of water comes out of nowhere and breaks over the rock.',
    fx: (S, L) => { S.tide = (S.tide + 1) % 4; floodFromTide(S, L); say(S, L, `The tide is driven on: ${TIDE_NAMES[S.tide]}.`, 'bad'); activeInv(S).filter(i => (SP[i.space].lvl || 0) === 0).forEach(i => { if (autoTest(S, i, 'agi') < 1) hurt(S, i, 1, 'the wave', L); else say(S, L, `${nm(i)} grabs hold as the wave passes (Agility).`); }); }},
  {id: 'calm', t: 'Dead calm', f: 'The sea goes flat as glass. Not a breath of wind. Not a sound.', fx: (S, L) => { S.tideHold = 1; say(S, L, 'The tide will not turn next round.'); }},
  {id: 'fog', t: 'Fog bank', f: 'Fog rolls in off the sea and swallows the rock. You can’t see your own hands.', fx: (S, L) => { S.fog = true; say(S, L, 'Until the next Mythos phase, every space outside the tower is Darkness.', 'bad'); }},
  {id: 'beam', t: 'The beam sweeps', f: 'The green beam swings round and pours through every window on the rock.',
    fx: (S, L) => { const v = activeInv(S).filter(i => ['cottage', 'children', 'watch', 'lamp'].includes(roomOf(i.space))); if (!v.length) say(S, L, 'No one is near a window. The light passes over.'); v.forEach(i => { if (autoTest(S, i, 'will') < 1) scare(S, i, 1, 'the green light', L); else say(S, L, `${nm(i)} looks away in time (Will).`); }); }},
  {id: 'gulls', min: 2, t: 'Gulls', f: 'The gulls rise off the rock all at once, screaming, their eyes catching the green light.', fx: (S, L) => say(S, L, spawn(S, 'gulls'), 'bad')},
  {id: 'body', t: 'A body washes in', f: 'The sea leaves something on the jetty: a fisherman, face down, his pockets full.',
    fx: (S, L) => { S.spots.drowned1 = {c: pick(['bandages', 'laudanum', 'clues2', 'matches', 'holywater'])}; if (!S.tokens.some(t => t.id === 'drowned1')) S.tokens.push({id: 'drowned1', k: 'search', sp: 'J1'}); say(S, L, 'A new Search token lies on the Jetty.'); }},
  {id: 'tubevoice', t: 'The speaking tube', f: 'Every speaking tube on the rock whistles at once, and then a voice says a name.',
    fx: (S, L) => { const i = pick(activeInv(S)); if (autoTest(S, i, 'will') < 1) scare(S, i, 1, 'the voice knows them', L); else { i.clues++; say(S, L, `${nm(i)} answers back, and learns something (+1 Clue).`, 'clue'); } }},
  {id: 'shipbell', min: 3, t: 'A ship’s bell', f: 'Under the water, a ship’s bell rings. Something hears it and hurries.',
    fx: (S, L) => { if (!S.monsters.length) { say(S, L, 'Nothing is close enough to answer — yet.'); return; } const m = pick(S.monsters), keep = S.monsters; S.monsters = [m]; activateMonsters(S, L); S.monsters = keep.filter(x => x === m ? S.monsters.includes(m) : true); }},
  {id: 'nets', min: 2, t: 'The nets move', f: 'In the boathouse, the nets lift off their hooks and walk.', fx: (S, L) => say(S, L, spawn(S, 'netted'), 'bad')},
  {id: 'saltcrust', t: 'Salt crust', f: 'Salt crystallises on every surface, on your skin, in your wounds.',
    fx: (S, L) => { activeInv(S).forEach(i => { discardDown(i, 'dmg', 1); if (i.clues > 0) i.clues--; }); say(S, L, 'Each investigator discards 1 face-down Damage and loses 1 Clue.'); }},
  {id: 'oilspill', t: 'Lamp oil', f: 'A barrel in the oil store tips and splits. The smell fills the tower.',
    fx: (S, L) => { const inTower = activeInv(S).some(i => TOWER.includes(roomOf(i.space))); if (inTower && S.rooms.towerbase.rev) setFire(S, 'T1', L); else say(S, L, 'Nobody is in the tower to strike a spark. The oil soaks into the stone.'); }},
  {id: 'quietsea', t: 'The quiet sea', f: 'Nothing happens. The sea is very quiet. That is worse.', fx: (S, L) => {}},
];
const SALT_BEATS = [
  {id: 'flare', t: 'The lamp flares green', f: 'The lamp blazes, bright as day and the colour of deep water. Down in the boathouse, the nets stand up.',
    fx: (S, L) => say(S, L, spawn(S, 'netted', S.rooms.boathouse.rev ? 'A1' : undefined), 'bad')},
  {id: 'spring', t: 'The spring tide', f: 'The sea comes up higher than any tide table says it can, and stays there.',
    fx: (S, L) => { S.tide = 2; S.tideHold = 1; floodFromTide(S, L); say(S, L, 'High tide — and it will hold for an extra round.', 'bad'); say(S, L, spawn(S, 'brine'), 'bad'); if (S.inv.length >= 3) say(S, L, spawn(S, 'brine'), 'bad'); }},
  {id: 'answers', t: 'Something answers', f: 'Far out at sea, a second light rises under the water, green and slow, and every one of you hears it sing back.',
    fx: (S, L) => activeInv(S).forEach(i => { if (autoTest(S, i, 'will') < 1) scare(S, i, 1, 'the answer from the deep', L); else say(S, L, `${nm(i)} stands at the window and does not look away (Will).`); })},
];

// ------------------------------------------------------------ the road to Saltmere
const SALT_PROLOGUES = [
  {id: 'harbour', t: 'The harbourmaster', s: 'Saltmere’s harbourmaster won’t go near the rock, but he will lend you something.',
    a: {t: 'His tide almanac', d: 'Every turn of the tide, worked out to the minute. You will know when the water comes.', fx: {sk: {lore: 1}, clock: -1}},
    b: {t: 'His spare boat hook', d: 'Long, heavy and sharp.', fx: {items: ['boathook']}}},
  {id: 'mother', t: 'Nell’s mother', s: 'An old woman stops you on the quay. She knows where you’re going.',
    a: {t: 'Take her charm', d: 'A knot of red thread and a hag-stone. “Keep it on you. They don’t like it.”', fx: {sk: {will: 1}, clock: -1}},
    b: {t: 'Listen to her warning', d: 'She tells you everything the village whispers. It frightens you.', fx: {clues: 1, hor: 1}}},
  {id: 'drownednet', t: 'The net on the shore', s: 'A fishing net lies on the shingle, heavy with something that moves.',
    a: {t: 'Cut it open', d: 'Whatever was inside slips back into the sea. You find what it was guarding.', fx: {clues: 1, early: 'netted'}},
    b: {t: 'Leave it', d: 'You go the long way round, and arrive later than you meant to.', fx: {clock: -2, clues: 1}}},
  {id: 'pub', t: 'The Anchor', s: 'The fishermen at the Anchor stop talking when you walk in.',
    a: {t: 'Buy a round', d: 'They talk. You drink more than you meant to.', fx: {clues: 1, sk: {agi: -1}}},
    b: {t: 'Ask the landlord quietly', d: 'He tells you the rock’s layout, and that the lamp went green nine nights ago.', fx: {evAll: true, maxMon: 1}}},
  {id: 'lifeboat', t: 'The lifeboat station', s: 'The lifeboat crew offer to row you out themselves.',
    a: {t: 'Go with the crew', d: 'Fast and dry. They won’t wait for you.', fx: {clock: 2, dmg: 1}},
    b: {t: 'Borrow their kit', d: 'Oilskins and a storm lantern.', fx: {items: ['lantern']}}},
  {id: 'priest', t: 'The vicar of Saltmere', s: 'The vicar blesses the boats every spring. He has not blessed one since the lamp turned.',
    a: {t: 'Ask for a blessing', d: 'Holy water in a medicine bottle, and a long prayer.', fx: {items: ['holywater'], clock: -1}},
    b: {t: 'Ask about the Brannocks', d: 'Hester Brannock came to him in tears a month ago. He sent her home.', fx: {clues: 1}}},
  {id: 'telegraph2', t: 'The telegraph', s: 'You could wire the coastguard before you cross.',
    a: {t: 'Wire them', d: 'Help may come — if one of you falls, the rest have longer.', fx: {grace: 1, clock: -1}},
    b: {t: 'Keep it quiet', d: 'No one will come. No one will warn the rock either.', fx: {clock: 1, grace: -1}}},
  {id: 'causeway', t: 'The causeway', s: 'The causeway is only uncovered for an hour. You can cross now, or wait for the next low water.',
    a: {t: 'Cross now, at a run', d: 'Soaked and bruised, but early.', fx: {clock: 2, dmg: 1}},
    b: {t: 'Wait for the next ebb', d: 'Rested, and hours late.', fx: {clock: -2, clues: 1}}},
  {id: 'gullrock', t: 'The gull rock', s: 'The gulls on the headland are watching you, all of them, the same way.',
    a: {t: 'Throw stones', d: 'They scatter, screaming. They will remember.', fx: {early: 'gulls', clues: 1}},
    b: {t: 'Walk quietly past', d: 'You keep your heads down and say nothing.', fx: {sk: {obs: -1}, clock: 1}}},
  {id: 'chandler', t: 'The ship’s chandler', s: 'The chandler has one thing left he will sell to people going out to the rock.',
    a: {t: 'Bandages and spirits', d: 'For what comes after.', fx: {items: ['bandages', 'laudanum']}},
    b: {t: 'A lamp and oil', d: 'For the dark below the rock.', fx: {items: ['oillamp', 'matches']}}},
  {id: 'boy', t: 'The boy on the quay', s: 'A village boy says he’s Ezra Brannock’s friend. He wants to come with you.',
    a: {t: 'Send him home', d: 'He goes, crying. He tells you where Ezra liked to hide.', fx: {clues: 1}},
    b: {t: 'Let him show you the path', d: 'He leads you up the back way, then runs. Something followed him.', fx: {clock: 2, early: 'drowned'}}},
  {id: 'letter2', t: 'Marrow’s parcel', s: 'The post office is holding a parcel for S. Brannock, unclaimed. The postmark is Greywater.',
    a: {t: 'Open it', d: 'Green glass, wrapped in sheet music. Holding it, you hear the hymn — and understand it a little.', fx: {sk: {lore: 1}, hor: 1}},
    b: {t: 'Leave it sealed', d: 'You hand it back. Your heads are clear.', fx: {sk: {will: 1}, clock: -1}}},
];

// ------------------------------------------------------------ the reveal
const KID_MEET = {
  ezra: 'Someone is here: a boy sitting in the water, counting candle stubs. Ezra Brannock.',
  maud: 'Someone is here: a little girl curled up small, humming. Maud Brannock.',
};
function addTok(S, tok) { if (S.rooms[roomOf(tok.sp)].rev) S.tokens.push(tok); else S.later.push(tok); }
function saltReveal(S) {
  S.goal = pick(CONFIG.goals);
  const far = distFromInvestigators(S);
  const farSpace = () => Object.keys(SP).filter(s => revealed(S, s) && !invAt(S, s).length).sort((a, b) => (far[b] ?? 0) - (far[a] ?? 0))[0] || 'K1';
  if (S.goal === 'A') {
    const sp = pick(['A2', 'X1', 'Q2']);
    S.spots.keybox = {c: 'lenskey'}; addTok(S, {id: 'keybox', k: 'search', sp});
    story(S, 'The Reveal: the Lamp', `It is the lamp. Marrow’s green glass turns the beam into a voice, and every night it sings out to something in the deep. It must be turned back into the sea.\n\nYOUR GOAL: Find the Lens Key — the keeper hid it in a strongbox somewhere on the rock (${ROOMS[roomOf(sp)].n}) — then climb the tower — its doors now stand open all the way up — to the Lamp Room and turn the beam with the lens mirrors (Interact, puzzle, Observation).\n\nSilas Brannock is coming for you.`, 'reveal');
    // the lamp shows you the way: the tower stands open from the cottage to the lamp
    for (const r of TOWER) if (!S.rooms[r].rev) revealRoom(S, r, null);
    spawn(S, 'silas', farSpace());
  } else if (S.goal === 'B') {
    const m = pick(['A2', 'V2', 'U2', 'Q2']);
    S.kids = [{id: 'ezra', n: 'Ezra', space: 'G2', escort: null, found: S.rooms.cave.rev, meet: KID_MEET.ezra}, {id: 'maud', n: 'Maud', space: m, escort: null, found: S.rooms[roomOf(m)].rev, meet: KID_MEET.maud}];
    story(S, 'The Reveal: the children', 'Ezra and Maud Brannock are still alive. Their father has hidden them where the sea can reach them, and when the song is finished, it will.\n\nYOUR GOAL: Find both children, coax them to follow you (Interact, Influence), and get them into the boat at the Jetty. The boat can only leave on a Falling or Low tide. Ezra is somewhere below the rock; Maud is hiding up above.\n\nLeaving with only one child is possible — but it is only half a victory.', 'reveal');
    spawn(S, 'silas', farSpace());
  } else {
    story(S, 'The Reveal: the Lamplighter', 'Silas Brannock did not abandon the lamp. He became it. He walks the rock with Marrow’s green fire in his eye, and while he keeps the light, the sea will keep singing.\n\nYOUR GOAL: Bring the Lamplighter down — by force, or by the old rite: carry rock salt (the Cellar), the bell’s clapper (the chapel bell) and his wife’s ring (the Sea Cave’s altar pool) to the Pews in the chapel together, and speak the rite (Will).\n\nHe is strongest at High tide.', 'reveal');
    spawn(S, 'silas', farSpace());
    const b = S.monsters.find(m => m.type === 'silas'); if (b) b.hp = CONFIG.lampHp[0] + CONFIG.lampHp[1] * S.inv.length + (S.silasBonus || 0);
    S.spots.saltjar = {c: 'salt'}; S.spots.clapper = {c: 'clapper'}; S.spots.ringpool = {c: 'ring'};
    addTok(S, {id: 'saltjar', k: 'search', sp: 'X1'}); addTok(S, {id: 'clapper', k: 'search', sp: 'V2'}); addTok(S, {id: 'ringpool', k: 'search', sp: 'G2'}); addTok(S, {id: 'rite', k: 'interact', sp: 'V1'});
  }
  if (S.silasBonus) { const b = S.monsters.find(m => m.type === 'silas'); if (b && S.goal !== 'C') b.hp = MONSTERS.silas.hp + S.silasBonus; }
  log(S, 'The Reveal: ' + SCENARIOS.saltmere.goalNames[S.goal].toLowerCase() + '.', 'clue');
}
CONFIG.lampHp = [8, 3];

// ------------------------------------------------------------ the scenario
SCENARIOS.saltmere = {
  id: 'saltmere', ch: 2, place: 'Brannoc Rock', name: 'Salt and Tide', chapter: 'Chapter 2',
  blurb: 'The lamp on Brannoc Rock has turned green, and when it sweeps across the water, the sea sings back. The keeper and his family have not been seen for nine days.',
  rooms: SALT_ROOMS, doors: SALT_DOORS, stairs: SALT_STAIRS, mythos: SALT_MYTHOS, beats: SALT_BEATS, prologues: SALT_PROLOGUES,
  evidence: ['keeperlog', 'drawings', 'signal', 'tidelock', 'knots'],
  start: 'J1', startRoom: 'landing', clockShift: {2: 0, 3: 0, 4: -2},
  introTitle: 'Salt and Tide',
  intro: 'Winter, 1926. A telegram from the fishing village of Saltmere: the keeper of the Brannoc Rock light, Silas Brannock, has not been seen for nine days. Nor have his wife and two children. Every night the lamp still turns — but its light has gone green, and the fishermen say that when it sweeps across the water, the sea sings back.\n\nYou cross the causeway at low tide. Before you reach the cottage, the water has closed over the road behind you.\n\nFind out what happened to the Brannocks.',
  logStart: 'Find out what happened to the Brannocks.',
  goalNames: {A: 'Douse the Lamp', B: 'Save the children', C: 'Stop the Lamplighter'},
  memory: {A: 'lamp', B: 'children', C: 'lamplighter'},
  text: {
    winTitle: 'The lamp goes dark', partialTitle: 'Half a victory', loseTitle: 'The sea keeps singing',
    allFallen: 'Every investigator has fallen. At dusk the lamp turns, and on the rock below it, a family of nine stands waiting at the water’s edge.',
    fallLoss: 'You ran out of time after one of you fell. The tide comes in over the last of you, and the lamp keeps turning.',
    clockLoss: 'The green beam steadies, and holds. Far out, the light under the sea rises to meet it — and Brannoc Rock is never seen above the water again.',
    hint: room => `For a moment the beam swings away and the rock is dark, and in the dark you are sure of it: something that matters is waiting in the ${room}.`,
    road: 'On the road to Saltmere',
  },
  spots(evLive) {
    const rest = shuffle(['bandages', 'bandages', 'laudanum', 'holywater', 'clues2', 'clues2', 'lantern', 'matches', 'knife', 'nothing', 'nothing', pick(['revolver', 'axe'])]);
    const pool = shuffle([pick(['revolver', 'axe']), rest.pop(), rest.pop()]).concat(rest);
    const sp3 = shuffle(['spell:binding', 'spell:mend', 'spell:still']);
    const fixed = {chpews: sp3[0], gallery: sp3[1], grotto: sp3[2], oilstore: pick(['oillamp', 'matches'])};
    const spots = {}; let pi = 0;
    for (const id of ['slipway', 'nets', 'loft', 'deck', 'pantry', 'drawings', 'toybox', 'chpews', 'oilstore', 'gallery', 'machinery', 'barrels', 'cistern', 'grotto', 'altar']) {
      if (fixed[id]) spots[id] = {c: fixed[id]};
      else if (EVIDENCE[id] && evLive.includes(id)) spots[id] = {c: 'ev:' + id};
      else spots[id] = {c: pool[pi++ % pool.length]};
    }
    return spots;
  },
  puzzles: () => ({lens: makeLens(), signal: makeSignal(), tidelock: makeCode(), knots: makeSlide()}),
  init(S) { S.tide = 0; S.tideHold = 0; S.kids = null; },
  preMythos(S, L) { S.fog = false; advanceTide(S, L); },
  reveal: S => saltReveal(S),
  goalText(S) {
    if (!S.goal) return `Act I · Find evidence (${S.evidence.length}/${CONFIG.evidenceNeeded})`;
    if (S.goal === 'A') return 'Act II · Douse the Lamp';
    if (S.goal === 'C') return 'Act II · Stop the Lamplighter';
    const n = (S.kids || []).filter(k => k.escort).length;
    return `Act II · Save the children (${n}/2 with you)`;
  },
  goalHelp(S) {
    if (!S.goal) return `Explore the rock and find ${CONFIG.evidenceNeeded} pieces of evidence about what happened to the Brannocks. Watch the tide: the Wreck and the Sea Cave mouth can only be reached at Low tide.`;
    if (S.goal === 'A') {
      const holder = S.inv.find(v => !v.out && v.items.includes('lenskey'));
      const box = S.tokens.find(t => t.id === 'keybox') || S.later.find(t => t.id === 'keybox');
      return holder ? `${INVD(holder.id).name} has the Lens Key. Climb to the Lamp Room and Interact with the lens (mirror puzzle, Observation).` : `Find the Lens Key in the keeper’s strongbox${box ? ` (${ROOMS[roomOf(box.sp)].n})` : ''}, then climb to the Lamp Room.`;
    }
    if (S.goal === 'C') {
      const b = S.monsters.find(m => m.type === 'silas');
      const have = new Set(S.inv.filter(v => !v.out).flatMap(v => v.items));
      const need = [['salt', 'rock salt (Cellar)'], ['clapper', 'the bell clapper (chapel bell)'], ['ring', 'the ring (Sea Cave altar pool)']].filter(([k]) => !have.has(k)).map(x => x[1]);
      return `${b ? `Silas Brannock is in the ${ROOMS[roomOf(b.space)].n} (${b.wounds} of ${monHp(b)} wounds). ` : ''}Bring him down, or perform the rite at the chapel Pews.${need.length ? ' Still needed: ' + need.join(', ') + '.' : ' You have all three things the rite needs.'}`;
    }
    const k = S.kids || [];
    return k.map(x => `${x.n}: ${x.escort ? `following ${INVD(x.escort).name}` : x.found ? `in the ${ROOMS[roomOf(x.space)].n}` : 'not found yet'}`).join(' · ') + `. The boat at the Jetty leaves on a Falling or Low tide (now ${TIDE_NAMES[S.tide]}).`;
  },
  bossWins: S => S.goal === 'C',
  bossDown(S) { if (S.goal === 'C') end(S, 'won', 'Silas Brannock falls on the rocks, and his lantern-eye goes out like a candle in the rain. High above, the lamp splutters, turns once more, and dies. The sea goes on breaking, but it no longer sings.'); },
  bossStory: ['The Lamplighter falls', 'Silas Brannock folds onto the wet stone. His lantern-eye gutters but does not go out. Above you, the lamp keeps turning.'],
  onReveal(S, rid, L) {},
  darkAt(S, sid) {
    const b = S.monsters.find(m => m.type === 'silas');
    if (b && (b.space === sid || ADJ[b.space].some(a => a.to === sid && passable(S, a.link)))) return 'force';
    if (S.fog && !TOWER.includes(roomOf(sid))) return true;
    return false;
  },
  litAt: (S, sid) => (SP[sid].lvl || 0) === 2 && !S.monsters.some(m => m.type === 'silas' && m.space === sid),
  progress(S) {
    if (!S.goal) return 0.5 * Math.min(1, S.evidence.length / CONFIG.evidenceNeeded);
    if (S.goal === 'C') { const b = S.monsters.find(m => m.type === 'silas'); const have = new Set(S.inv.filter(v => !v.out).flatMap(v => v.items)); const items = ['salt', 'clapper', 'ring'].filter(k => have.has(k)).length; return Math.max(b ? 0.5 + 0.45 * b.wounds / monHp(b) : 0.5, 0.5 + items * 0.12); }
    if (S.goal === 'A') { const h = S.inv.find(v => !v.out && v.items.includes('lenskey')); return !h ? 0.5 : roomOf(h.space) === 'lamp' ? 0.85 : 0.7; }
    const k = S.kids || []; return 0.5 + 0.1 * k.filter(x => x.found).length + 0.12 * k.filter(x => x.escort).length;
  },
  // Chapter 1's ending colours the opening (legacy mode)
  continuity(S, opt) {
    const prev = Object.values(opt.legacy || {}).map(L => L && L.prev && L.prev.greywater).filter(Boolean);
    if (!prev.length) return;
    const p = prev[0], lines = [];
    if (p.result !== 'won') {
      lines.push('You did not come here by chance. Greywater kept one of yours, and the trail of the hymn leads here. Something of theirs has washed up on the wreck.');
      S.spots.deck = {c: pick(['revolver', 'axe', 'holywater'])};
    } else if (p.goal === 'A') { lines.push('You silenced the Engine at Greywater. The hymn found another instrument: the lamp. It will be quicker to wake this time.'); S.beatAt[0] = Math.max(2, S.beatAt[0] - 1); }
    else if (p.goal === 'B') { lines.push('Ada Wren is waiting for you on the quay at Saltmere. She hears the lamp too. “There is a book in the cottage,” she says. “He wrote everything down.”'); if (S.evLive.includes('keeperlog')) S.lastHint = 'Ada said: there is a book in the cottage.'; else S.inv[0].clues++; }
    else if (p.goal === 'C') { lines.push('Marrow’s baton was never found at Greywater. You will find out who has it.'); S.silasBonus = 1; }
    if (lines.length) S.lgIntro = 'From Greywater: ' + lines.join(' ') + (S.lgIntro ? '\n\n' + S.lgIntro : '');
  },
};
