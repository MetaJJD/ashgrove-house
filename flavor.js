/* Greywater — character voice for skill tests.
   The same test reads differently depending on who is rolling: Dex forcing a door is not Elias forcing a door.
   FLAVOR[id].try[context] is shown while the dice roll; FLAVOR[id].ok / .bad [skill] after the result.
   Contexts: melee, ranged, evade, force, cast, calm, fire, and each skill as the fallback. */
const FLAVOR = {
  mara: {
    try: {
      str: ['Mara braces the way she was taught for lifting patients: knees, not back.'],
      agi: ['Mara moves the way she does on the night ward — quick, quiet, no wasted steps.'],
      obs: ['Mara reads the room like a chart: what is out of place, what is missing.'],
      lore: ['Mara half-remembers something from a textbook she never finished.'],
      inf: ['Mara uses her bedside voice — low, steady, certain.'],
      will: ['Mara has sat with the dying. She tells herself this is no different.'],
      melee: ['Mara does not want to do this. She does it anyway, fast and hard.'],
      ranged: ['Mara holds the revolver like a syringe: steady hands, breathe out, now.'],
      evade: ['Mara slips sideways the way she dodges a thrashing patient.'],
      force: ['Mara puts her shoulder to the door. It is not what nurses are for.'],
      cast: ['Mara says the words carefully, like reading a dosage aloud.'],
      calm: ['Mara kneels to eye level and keeps her hands where they can be seen.'],
      fire: ['Mara grabs a blanket. Smother it — she has done this with a dropped lamp before.'],
    },
    ok: {
      str: ['It gives. Night shifts build more muscle than people think.'],
      agi: ['Clean and quick. Nobody hears a thing.'],
      obs: ['There. She would have missed it at the start of a shift, not the end.'],
      lore: ['It comes back to her, page and all.'],
      inf: ['The panic drains out of them. It always does, eventually.'],
      will: ['Her pulse slows. Steady. Next patient.'],
    },
    bad: {
      str: ['She strains until her wrists ache. Not enough.'],
      agi: ['Her shoe squeaks on the wet floor. Too slow.'],
      obs: ['Too tired. The details swim.'],
      lore: ['Whatever it was, she never learned it.'],
      inf: ['They don’t hear her. They are somewhere else entirely.'],
      will: ['For a moment she is back on the ward the night the screaming started.'],
    },
  },
  elias: {
    try: {
      str: ['Elias takes off his jacket, folds it, and then has to try anyway.'],
      agi: ['Elias moves with the care of a man carrying a first edition.'],
      obs: ['Elias pushes his glasses up and looks the way he looks at a forged signature.'],
      lore: ['Elias already knows this. He has a footnote about it somewhere.'],
      inf: ['Elias clears his throat as if addressing a lecture hall that has gone quiet.'],
      will: ['Elias recites Latin declensions under his breath to keep his mind his own.'],
      melee: ['Elias swings with his eyes half shut, apologising before it lands.'],
      ranged: ['Elias has read about revolvers. He is fairly sure this end goes towards it.'],
      evade: ['Elias does the only thing his body knows how to do: flinch, and hope.'],
      force: ['Elias leans on the door with all eleven stone of himself.'],
      cast: ['Elias pronounces every syllable exactly. He has waited his whole life to say these words out loud.'],
      calm: ['Elias speaks softly and much too formally. It is oddly reassuring.'],
      fire: ['Elias beats at the flames with a book and immediately regrets which book.'],
    },
    ok: {
      str: ['Somehow it moves. He is more surprised than anyone.'],
      agi: ['Graceless, but he gets there.'],
      obs: ['“Ah,” he says, as if a page has finally turned.'],
      lore: ['Exactly as the commentaries said. He feels a scholar’s cold delight.'],
      inf: ['They listen. People do, when you sound like you have read everything.'],
      will: ['The Latin holds. His thoughts stay in order.'],
    },
    bad: {
      str: ['His glasses slide down his nose. Nothing else moves.'],
      agi: ['He trips over his own feet, and his own dignity.'],
      obs: ['Wrong lens. Wrong light. Wrong everything.'],
      lore: ['He knows this. He knows he knows this. It won’t come.'],
      inf: ['Too many long words. They stop listening halfway through.'],
      will: ['The declensions run out. Something else fills the gap.'],
    },
  },
  dex: {
    try: {
      str: ['Dex rolls his shoulders, like he is stepping into the ring.'],
      agi: ['Dex goes up on the balls of his feet. Twenty years of footwork.'],
      obs: ['Dex squints. Looking for things was always someone else’s job.'],
      lore: ['Dex stares at it. He never was much for books.'],
      inf: ['Dex tries to sound friendly. It comes out like a threat.'],
      will: ['Dex grips his lucky coin until the edge bites his palm.'],
      melee: ['Dex drops his chin and throws the right hand he was famous for.'],
      ranged: ['Dex holds the gun like it owes him money.'],
      evade: ['Dex slips the swing like it is the ninth round and he is tired of this.'],
      force: ['Dex doesn’t try the handle. He goes through the door.'],
      cast: ['Dex mumbles the words like a prayer he half remembers from his mother.'],
      calm: ['Dex crouches down to look smaller. It doesn’t really work.'],
      fire: ['Dex stamps on the flames with his work boots.'],
    },
    ok: {
      str: ['Wood splinters. Dex shakes out his hand and grins.'],
      agi: ['Old instincts. He is past before he thinks about it.'],
      obs: ['Even a broken nose can smell a rat.'],
      lore: ['Huh. Maybe he did listen in church.'],
      inf: ['They relax. Big men can be gentle; they just don’t get asked.'],
      will: ['He has taken worse beatings than this. He stays standing.'],
    },
    bad: {
      str: ['He hits it again and again. It doesn’t care.'],
      agi: ['Too slow. He always did lead with his face.'],
      obs: ['Whatever it is, it is just shapes to him.'],
      lore: ['The words swim. He shoves the page away.'],
      inf: ['They take one look at his knuckles and back off.'],
      will: ['The coin slips out of his fingers. He hears it roll away in the dark.'],
    },
  },
  agnes: {
    try: {
      str: ['Sister Agnes rolls up her sleeves. She has scrubbed convent floors for thirty years.'],
      agi: ['Sister Agnes gathers her skirts. She was never built for haste.'],
      obs: ['Sister Agnes looks the way she once looked for sins: patiently.'],
      lore: ['Sister Agnes remembers the old rites — the ones the bishop told them to forget.'],
      inf: ['Sister Agnes speaks the way she spoke in the confessional: no judgement, all the time in the world.'],
      will: ['Sister Agnes no longer believes. She prays anyway; the habit is stronger than doubt.'],
      melee: ['Sister Agnes strikes once, firmly, the way she shut a classroom door.'],
      ranged: ['Sister Agnes closes one eye and asks forgiveness in advance.'],
      evade: ['Sister Agnes steps aside with surprising calm. Fear has never moved her quickly.'],
      force: ['Sister Agnes puts both hands on the door and pushes, muttering a saint’s name.'],
      cast: ['Sister Agnes speaks the words in the cadence of a psalm. They were never meant for a church.'],
      calm: ['Sister Agnes takes their hands in hers. Thirty years of other people’s grief.'],
      fire: ['Sister Agnes beats the flames with her shawl, as calmly as laying a table.'],
    },
    ok: {
      str: ['Thirty years of floors. It gives.'],
      agi: ['Not graceful. But she is where she needs to be.'],
      obs: ['There it is, plain as a lie in a child’s face.'],
      lore: ['The old words still work. She is not sure what that means.'],
      inf: ['They lean into her. Something in her voice still says “sanctuary”.'],
      will: ['The prayer holds, even if she doesn’t.'],
    },
    bad: {
      str: ['Her arms tremble. She was never strong, only stubborn.'],
      agi: ['Her habit catches. Too slow, as always.'],
      obs: ['Her eyes are not what they were.'],
      lore: ['The rite is gone, along with the faith that kept it.'],
      inf: ['They pull away. Even she cannot reach everyone.'],
      will: ['For a moment the silence where God used to be is very loud.'],
    },
  },
  juno: {
    try: {
      str: ['Juno sets her camera down very carefully, then throws her weight at it.'],
      agi: ['Juno moves like she does at a riot: low, fast, always an exit in mind.'],
      obs: ['Juno frames it in her head. What is in the shot that shouldn’t be?'],
      lore: ['Juno tries to remember what the man at the museum told her. She mostly took photos.'],
      inf: ['Juno smiles the smile that gets her past police lines.'],
      will: ['Juno counts exposures under her breath — one, two, three — to keep her head.'],
      melee: ['Juno swings the camera strap like a sling. It is an expensive camera.'],
      ranged: ['Juno aims the way she focuses: hold your breath, wait for it.'],
      evade: ['Juno ducks under the reach. She has dodged worse than this for a front page.'],
      force: ['Juno kicks the door at the lock, the way she saw a detective do it once.'],
      cast: ['Juno reads the words off a page she photographed. Her voice shakes.'],
      calm: ['Juno lowers the camera. No pictures. Just her.'],
      fire: ['Juno whips off her coat and smothers the flames.'],
    },
    ok: {
      str: ['It gives. She picks her camera back up before anything else.'],
      agi: ['In and out before anything sees her.'],
      obs: ['Click. She saw it before she knew she was looking for it.'],
      lore: ['It comes back to her, caption and all.'],
      inf: ['They open up to her. They always do; that is the job.'],
      will: ['Three. Her hands are steady again.'],
    },
    bad: {
      str: ['She bounces off. She is a photographer, not a stevedore.'],
      agi: ['For once, she is a beat too slow.'],
      obs: ['Out of focus. The moment is gone.'],
      lore: ['She has the photograph. She doesn’t have the meaning.'],
      inf: ['The smile doesn’t land. They have seen through better.'],
      will: ['She loses count. She can’t remember the next number.'],
    },
  },
};

function flavorContext(label) {
  if (/^Attack .*Revolver/.test(label)) return 'ranged';
  if (/^Attack/.test(label)) return 'melee';
  if (/^Evade/.test(label)) return 'evade';
  if (/^Force/.test(label)) return 'force';
  if (/^Cast|: \w+ test$/.test(label)) return 'cast';
  if (/^Calm|^Reach /.test(label)) return 'calm';
  if (/flames/.test(label)) return 'fire';
  return null;
}
function flavorTry(id, sk, label) {
  const F = FLAVOR[id]; if (!F) return '';
  const c = flavorContext(label || '');
  return pick((c && F.try[c]) || F.try[sk] || ['']);
}
function flavorAfter(id, sk, ok) {
  const F = FLAVOR[id]; if (!F) return '';
  return pick((ok ? F.ok : F.bad)[sk] || ['']);
}
