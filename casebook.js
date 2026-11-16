/* Greywater — legacy mode: the Casebook.
   Each investigator keeps a record between scenarios, saved on the device of the player who plays them:
   what they went through (memories, which colour the story), rewards they chose (skills, health, sanity,
   keepsakes, talents), scars from face-up cards (a weaker version of the card), and whether they are retired.
   Death is permanent: a fallen investigator retires and leaves one possession to the next newcomer.
   A lost scenario does not end the campaign: survivors escape, scarred, with a smaller choice of rewards. */
const CB_KEY = 'gw-casebook';
const SKILL_CAP = 5;
const Casebook = {
  load() { try { const c = JSON.parse(localStorage.getItem(CB_KEY) || 'null'); if (c && c.v === 1) return c; } catch (e) {} return {v: 1, chars: {}, bequests: []}; },
  save(c) { try { localStorage.setItem(CB_KEY, JSON.stringify(c)); } catch (e) {} },
  rec(c, id) { return c.chars[id] = c.chars[id] || {plays: [], sk: {}, hp: 0, san: 0, talents: [], keep: [], scars: [], haunted: false, retired: false, picks: 0, mem: []}; },
  retired(id) { const r = this.load().chars[id]; return !!(r && r.retired); },
  isVet(id) { const r = this.load().chars[id]; return !!(r && r.plays.length); },
  reset() { try { localStorage.removeItem(CB_KEY); } catch (e) {} },
};

// what an investigator brings into a new legacy game (sent to the host in online games)
function legacyFor(ids, dry = false) {
  const c = Casebook.load(), out = {};
  const vets = ids.map(id => c.chars[id]).filter(r => r && r.plays.length);
  const avgPicks = vets.length ? vets.reduce((a, r) => a + r.picks, 0) / vets.length : 0;
  let changed = false;
  for (const id of ids) {
    const r = Casebook.rec(c, id);
    const L = {sk: {...r.sk}, hp: r.hp, san: r.san, talents: r.talents.slice(), keep: r.keep.slice(), scars: r.scars.slice(), haunted: r.haunted, vet: r.plays.length};
    if (!r.plays.length) {
      // a newcomer catches up: half the veterans' average rewards, given at once (their strongest areas first)
      const catchUp = Math.floor(avgPicks / 2) - r.picks;
      for (let k = 0; k < catchUp; k++) { autoReward(r, id); changed = true; }
      Object.assign(L, {sk: {...r.sk}, hp: r.hp, san: r.san});
      const bi = c.bequests.findIndex(b => !INVD(id).start.includes(b.item));
      if (bi >= 0) { L.bequest = c.bequests[bi]; if (!dry) c.bequests.splice(bi, 1); changed = true; }
    }
    L.line = memoryLine(id, r);
    // how this investigator's last case in each scenario ended (later chapters open differently)
    L.prev = {};
    for (const p of r.plays) L.prev[p.sc] = {result: p.result, goal: p.goal, partial: !!p.partial};
    out[id] = L;
  }
  if (changed && !dry) Casebook.save(c);
  return out;
}
function autoReward(r, id) {
  const d = INVD(id);
  const best = SKILLS.filter(s => d[s] + (r.sk[s] || 0) < SKILL_CAP).sort((a, b) => (d[b] + (r.sk[b] || 0)) - (d[a] + (r.sk[a] || 0)))[0];
  if (best) r.sk[best] = (r.sk[best] || 0) + 1; else r.hp++;
  r.picks++;
}
// one line for the opening story, from what this investigator remembers
function memoryLine(id, r) {
  const n = INVD(id).name, last = r.plays[r.plays.length - 1];
  const he = ['elias', 'dex'].includes(id), P = {They: he ? 'He' : 'She', they: he ? 'he' : 'she', their: he ? 'his' : 'her'};
  if (!last) return '';
  const times = r.plays.length === 1 ? 'once before' : `${r.plays.length} times before`;
  const bits = {
    fine: `${n} has walked out of a place like this ${times}, and walks in now with the calm of someone who knows it can be done.`,
    wounded: `${n} still feels the last time in ${P.their} body — a stiffness on cold mornings. ${P.They} came anyway.`,
    insane: `${n} smiles a little too easily these days, and hums when ${P.they} thinks no one is listening.`,
    escaped: `${n} got out of ${(SCENARIOS[last.sc] || SCN).place || 'that place'} when no one else thought it possible. ${P.They} does not talk about how.`,
  };
  let t = bits[last.fate] || bits.fine;
  if (r.mem.includes('conductor')) t += ` ${P.They} has looked Dr. Marrow in the eye.`;
  else if (r.mem.includes('ada')) t += ` Some nights ${P.they} still hears Ada Wren’s voice.`;
  else if (r.mem.includes('engine')) t += ' The note of the Engine has never quite left their ears.'.replace('their', P.their);
  if (r.mem.includes('children')) t += ` ${P.They} still dreams about two children on a rock.`;
  else if (r.mem.includes('lamplighter')) t += ` ${P.They} has seen a man with a lantern for an eye.`;
  else if (r.mem.includes('lamp')) t += ` Green light makes ${P.their} hands shake.`;
  if (r.mem.includes('lostfriend')) t += ` ${P.They} has buried a friend.`;
  return t;
}

// ------------------------------------------------------------ the end of a legacy scenario
function fateOf(S, v) { return S.phase === 'won' ? (v.out ? 'lost' : v.insane ? 'insane' : v.wounded ? 'wounded' : 'fine') : (v.out ? 'fell' : 'escaped'); }
function rewardOptions(S, v, r) {
  const d = INVD(v.id), won = S.phase === 'won', opts = [];
  const sk = shuffle(SKILLS.filter(s => d[s] + (r.sk[s] || 0) < SKILL_CAP));
  if (sk[0]) opts.push({k: 'sk', s: sk[0], t: `+1 ${SKILL_NAMES[sk[0]]}`, d: `${SKILL_NAMES[sk[0]]} ${d[sk[0]] + (r.sk[sk[0]] || 0)} → ${d[sk[0]] + (r.sk[sk[0]] || 0) + 1}`});
  opts.push(Math.random() < 0.5 ? {k: 'hp', t: '+1 Health', d: 'Harder to bring down.'} : {k: 'san', t: '+1 Sanity', d: 'Harder to break.'});
  const keepable = [...v.items.filter(k => ITEMS[k] && k !== 'valve' && !d.start.includes(k) && !r.keep.includes(k)), ...(v.spells || []).filter(x => !(d.spells || []).includes(x) && !r.keep.includes('spell:' + x)).map(x => 'spell:' + x)];
  if (keepable.length) { const k = pick(keepable); opts.push({k: 'keep', item: k, t: `Keep ${k.startsWith('spell:') ? SPELLS[k.slice(6)].n : ITEMS[k].n}`, d: 'Start every future scenario with it.'}); }
  const tal = Object.keys(TALENTS).filter(t => !r.talents.includes(t));
  if (tal.length) { const t = S.goal === 'C' && tal.includes('steady') ? 'steady' : pick(tal); opts.push({k: 'talent', tal: t, t: TALENTS[t].n, d: TALENTS[t].t}); }
  let pickN = won && !S.partial ? 3 : 2;
  const res = shuffle(opts).slice(0, pickN);
  if (r.scars.length || r.haunted) res.push({k: 'heal', t: 'Heal instead', d: r.scars.length ? `Lose the scar “${r.scars[0].n}”.` : 'No longer Haunted.'});
  return res;
}
function applyReward(r, o) {
  if (o.k === 'sk') r.sk[o.s] = (r.sk[o.s] || 0) + 1;
  else if (o.k === 'hp') r.hp++;
  else if (o.k === 'san') r.san++;
  else if (o.k === 'keep') r.keep.push(o.item);
  else if (o.k === 'talent') r.talents.push(o.tal);
  else if (o.k === 'heal') { if (r.scars.length) r.scars.shift(); else r.haunted = false; return; }
  r.picks++;
}
async function legacyEnd(S) {
  if (!(S.opt && S.opt.legacy) || G.legacyDone === S.gid) return;
  G.legacyDone = S.gid;
  const c = Casebook.load();
  const mine = S.inv.filter(v => mineInv(v));
  const anyFell = S.inv.some(v => v.out);
  for (const v of mine) {
    const r = Casebook.rec(c, v.id), fate = fateOf(S, v);
    const SC = SCENARIOS[S.sc] || SCN;
    const mem = [S.sc];
    if (S.goal) mem.push(SC.memory[S.goal]);
    if (v.insane) mem.push('insane');
    if (anyFell && !v.out) mem.push('lostfriend');
    mem.forEach(m => { if (!r.mem.includes(m)) r.mem.push(m); });
    r.plays.push({sc: S.sc, partial: !!S.partial, date: Date.now(), result: S.phase, fate, goal: S.goal || null, diff: (S.opt || {}).diff || 'std', rounds: S.round, epi: epilogueFor(S, v)});
    if (v.out) {
      r.retired = true;
      const left = v.items.find(k => ITEMS[k] && k !== 'valve') || INVD(v.id).start[0];
      if (left) c.bequests.push({item: left, from: INVD(v.id).name});
      continue;
    }
    // scars: each face-up card at the end leaves a weaker mark; going insane leaves you Haunted
    [...v.dmg, ...v.hor].filter(k => SCAR_FROM[k]).forEach(k => { if (!r.scars.some(x => x.from === k)) r.scars.push({from: k, n: SCAR_NAME[k], sk: SCAR_FROM[k]}); });
    if (v.insane) r.haunted = true;
  }
  Casebook.save(c);
  // reward choices, one investigator at a time
  for (const v of mine.filter(x => !x.out)) {
    const c2 = Casebook.load(), r = c2.chars[v.id];
    const opts = rewardOptions(S, v, r);
    const choice = await new Promise(res => {
      const m = openModal(`<div class="eyebrow">Casebook · ${S.phase === 'won' ? (S.partial ? 'half a victory' : 'they made it') : 'they got out — barely'}</div>
        <div class="sh-head">${portraitSVG(v.id, 56)}<div><h2>${esc(INVD(v.id).name)}</h2><div class="role">Choose what they carry forward</div></div></div>
        <div class="list">${opts.map((o, i) => `<button data-o="${i}"><span><b>${esc(o.t)}</b><br><small>${esc(o.d)}</small></span></button>`).join('')}</div>
        ${r.scars.length || r.haunted ? `<p class="dim">Carries: ${[...r.scars.map(x => x.n), ...(r.haunted ? ['Haunted'] : [])].join(', ')}.</p>` : ''}`, 'story');
      m.addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (b) { m.remove(); res(opts[+b.dataset.o]); } });
    });
    applyReward(r, choice); Casebook.save(c2);
  }
  const fell = mine.filter(v => v.out);
  if (fell.length) await info('Retired from the casebook', fell.map(v => `<p><b>${esc(INVD(v.id).name)}</b> will not walk into another house. What they carried will pass to the next investigator who joins you.</p>`).join(''), 'Close', 'story');
}

// ------------------------------------------------------------ the casebook screen
function renderCasebook() {
  const c = Casebook.load();
  const cards = INVESTIGATORS.map(d => {
    const r = c.chars[d.id];
    if (!r || !r.plays.length) return `<div class="card cbk"><div class="sh-head">${portraitSVG(d.id, 52)}<div><h3>${esc(d.name)}</h3><div class="role">${esc(d.role)} · <i>No cases yet</i></div></div></div></div>`;
    const last = r.plays[r.plays.length - 1];
    const bon = [...SKILLS.filter(s => r.sk[s]).map(s => `${SKILL_SHORT[s]} +${r.sk[s]}`), r.hp ? `HP +${r.hp}` : '', r.san ? `SAN +${r.san}` : ''].filter(Boolean);
    const chip = (t, cls = '') => `<span class="chip2 ${cls}">${esc(t)}</span>`;
    return `<div class="card cbk ${r.retired ? 'retired' : ''}"><div class="sh-head">${portraitSVG(d.id, 52)}<div><h3>${esc(d.name)}${r.retired ? ' <small class="ttl">Retired</small>' : ''}</h3><div class="role">${esc(d.role)} · ${r.plays.length} case${r.plays.length > 1 ? 's' : ''} · ${r.plays.filter(p => p.result === 'won').length} won</div></div></div>
      <div class="chips2">${bon.map(b => chip(b)).join('')}${r.talents.map(t => chip(TALENTS[t].n)).join('')}${r.keep.map(k => chip(k.startsWith('spell:') ? SPELLS[k.slice(6)].n : ITEMS[k].n)).join('')}${r.scars.map(x => chip(x.n, 'bad')).join('')}${r.haunted ? chip('Haunted', 'bad') : ''}</div>
      <p class="epi">${esc(last.epi || '')}</p></div>`;
  }).join('');
  app.innerHTML = `<div class="home">
    <div class="row" style="justify-content:space-between"><h2 style="font-size:30px">Casebook</h2><button class="ghost small" data-act="home">Back</button></div>
    <p class="dim">In legacy mode, investigators remember what happened to them and carry rewards, keepsakes and scars into the next scenario. A fallen investigator is retired for good, and leaves something behind for the next newcomer. Newcomers start with Fresh Eyes and catch up with half of the veterans' rewards. The casebook lives on this device.</p>
    ${c.bequests.length ? `<p class="dim">Waiting for the next newcomer: ${c.bequests.map(b => `${esc(ITEMS[b.item] ? ITEMS[b.item].n : b.item)} (from ${esc(b.from)})`).join(', ')}.</p>` : ''}
    <div class="cbgrid">${cards}</div>
    <div class="row" style="margin-top:12px"><button class="ghost small" data-act="cbreset">Start a new casebook</button></div></div>`;
}
