'use strict';
// ------------------------------------------- peer-to-peer online play (PeerJS)
const PEER_PREFIX = 'greywater-v1-';
function clearSubs() { G.subs.forEach(u => { try { u(); } catch (e) {} }); G.subs = []; }
function genCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[rnd(a.length)]; return s; }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function myId() { let id = lsGet('gw-pid'); if (!id) { id = 'p' + Math.random().toString(36).slice(2, 12); lsSet('gw-pid', id); } return id; }
const myName = () => lsGet('gw-name') || '';
G.me = myId();
function resolveNames() {}
function watchHomeLists() {}
function initCaps() {
  G.capsReady = true;
  const q = new URLSearchParams(location.search).get('join');
  if (q) { history.replaceState(null, '', location.pathname); joinGame(q); }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
function nameModal() {
  return new Promise(res => {
    const m = openModal(`<h2>What should we call you?</h2><p class="dim">Other players see this name.</p>
      <input id="nm-in" maxlength="24" style="width:100%;text-transform:none;letter-spacing:normal" autocomplete="nickname">
      <div class="btns"><button class="ghost" data-x="no">Cancel</button><button class="primary" data-x="ok">Continue</button></div>`);
    const inp = $('#nm-in', m); setTimeout(() => inp.focus(), 50);
    const done = ok => { const v = inp.value.trim(); if (ok && !v) { inp.focus(); return; } m.remove(); res(ok ? v : null); };
    m.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) done(b.dataset.x === 'ok'); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); });
  });
}
async function ensureName() {
  let n = ($('#pname') && $('#pname').value.trim()) || myName();
  if (!n) n = await nameModal();
  if (n) lsSet('gw-name', n.slice(0, 24));
  return n;
}
function peerReady() { if (typeof Peer === 'undefined') { toast('Online play could not load. Check your internet connection and reload.'); return false; } return true; }
function setLoad(t) { const el = $('#loadmsg'); if (el) el.textContent = t; }
function send(conn, msg) { try { if (conn && conn.open) { conn.send(msg); return true; } } catch (e) {} return false; }
function broadcast(msg) { if (G.net && G.net.conns) G.net.conns.forEach(c => send(c, msg)); }
function netStatus(t) {
  if (t != null) G.netText = t;
  else if (G.net && G.net.role === 'host') { const n = G.net.conns.size; G.netText = `Hosting game ${G.code} · ${n} other player${n === 1 ? '' : 's'} connected · keep this screen open`; }
  else if (G.net && G.net.role === 'client') G.netText = `Connected to game ${G.code}`;
  const el = $('#net'); if (el) el.textContent = G.netText || '';
}
async function wakeLock() { try { if (navigator.wakeLock) G.wl = await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && G.net && G.net.role === 'host') wakeLock(); });
function resetOnline(code) {
  clearSubs();
  G.mode = 'online'; G.code = code; G.S = null; G.lobby = null; G.seats = []; G.seenStory = null; G.seenR = null; G.myRolls = new Set(); G.netText = ''; G.vb = null; G.secrets = {};
}

// host ------------------------------------------------------------------
async function hostGame(resumeState) {
  if (!peerReady()) return;
  const name = await ensureName(); if (!name) return;
  resetOnline(resumeState ? resumeState.code : genCode());
  G.net = {role: 'host', conns: new Map(), peer: null};
  G.screen = 'loading'; render(); setLoad('Opening the house…');
  startHostPeer(G.code, resumeState || null, 0);
}
function startHostPeer(code, resumeState, tries) {
  G.code = code;
  const peer = new Peer(PEER_PREFIX + code, {debug: 0});
  G.net.peer = peer;
  let opened = false;
  peer.on('open', () => {
    opened = true;
    if (G.S) { /* reconnect after a drop */ }
    else if (resumeState) onState(resumeState, true);
    else if (!G.lobby) { G.lobby = {code, host: G.me, created: Date.now(), seats: [{uid: G.me, name: myName(), joined: Date.now(), picks: []}]}; G.seats = G.lobby.seats; G.screen = 'lobby'; render(); }
    netStatus(); wakeLock();
  });
  peer.on('connection', conn => {
    conn.on('data', msg => { try { hostHandle(conn, msg); } catch (e) { console.error(e); } });
    conn.on('close', () => { if (conn.pid && G.net && G.net.conns.get(conn.pid) === conn) { G.net.conns.delete(conn.pid); netStatus(); } });
  });
  peer.on('disconnected', () => { setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} }, 1500); });
  peer.on('error', err => {
    if (err.type === 'unavailable-id') {
      try { peer.destroy(); } catch (e) {}
      if (resumeState && tries < 10) { setLoad('Reclaiming your game code… (this can take a few seconds)'); setTimeout(() => startHostPeer(code, resumeState, tries + 1), 3000); }
      else if (!resumeState) startHostPeer(genCode(), null, 0);
      else { toast('Could not reclaim that game code. Try again in a minute.'); goHome(); }
    } else if (!opened && ['network', 'server-error', 'socket-error', 'browser-incompatible'].includes(err.type)) {
      toast(err.type === 'browser-incompatible' ? 'This browser cannot host online games. Try Chrome, Edge or Safari.' : 'Could not reach the matchmaking server. Check your connection.');
      goHome();
    }
  });
  G.subs.push(() => { try { peer.destroy(); } catch (e) {} });
}
function sameOwners(a, b) { return a.inv.length === b.inv.length && a.inv.every((x, i) => x.owner === b.inv[i].owner && x.id === b.inv[i].id); }
function hostHandle(conn, msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'hello') {
    const pid = String(msg.pid || '').slice(0, 40), name = String(msg.name || 'Player').slice(0, 24);
    if (!pid || pid === G.me) return;
    conn.pid = pid;
    const old = G.net.conns.get(pid); if (old && old !== conn) { try { old.close(); } catch (e) {} }
    G.net.conns.set(pid, conn);
    if (G.S) {
      if (!G.S.names) G.S.names = {};
      if (G.S.names[pid] !== name) { G.S.names[pid] = name; saveHost(G.S); broadcast({t: 'state', S: G.S, force: true}); render(); }
      else send(conn, {t: 'state', S: G.S, force: true});
    } else if (G.lobby) {
      const s = G.lobby.seats.find(x => x.uid === pid);
      if (!s) G.lobby.seats.push({uid: pid, name, joined: Date.now(), picks: []}); else s.name = name;
      G.seats = G.lobby.seats; broadcast({t: 'lobby', L: G.lobby}); render();
    }
    netStatus(); return;
  }
  const pid = conn.pid; if (!pid) return;
  if (msg.t === 'picks' && G.lobby && !G.S) {
    const s = G.lobby.seats.find(x => x.uid === pid); if (!s) return;
    s.picks = (Array.isArray(msg.picks) ? msg.picks : []).filter(id => INVD(id)).slice(0, 4);
    broadcast({t: 'lobby', L: G.lobby}); render();
  } else if (msg.t === 'commit' && G.S) {
    const S = msg.S;
    const O = G.S;
    const ok = S && Array.isArray(S.inv) && S.rooms && O.phase === 'play' && S.gid === O.gid && S.rev === O.rev + 1 && sameOwners(S, O) && (
      (O.active >= 0 && O.inv[O.active].owner === pid) ||
      (O.active < 0 && S.active >= 0 && S.inv[S.active].owner === pid && S.round === O.round) ||
      (O.active < 0 && allDone(O) && (O.players || []).includes(pid)));
    if (ok) { S.names = O.names; hostAccept(S); }
    else send(conn, {t: 'state', S: G.S, force: true, err: 'That move crossed with another one, so the board was refreshed. Try again.'});
  } else if (msg.t === 'secret' && G.S) hostSecret(pid, String(msg.inv), String(msg.hash || ''));
  else if (msg.t === 'reveal' && G.S) hostReveal(pid, String(msg.inv), String(msg.card || ''), String(msg.salt || ''));
}
function hostAccept(S) { saveHost(S); onState(S, true); broadcast({t: 'state', S}); }
function hostSecretsKey() { return 'gw-hsec-' + (G.S && G.S.gid); }
function hostSecret(pid, invId, hash) {
  const v = G.S.inv.find(x => x.id === invId);
  if (!v || v.owner !== pid || !v.insane) return;
  let all = {}; try { all = JSON.parse(lsGet(hostSecretsKey()) || '{}'); } catch (e) {}
  if (!all[invId]) { all[invId] = hash; lsSet(hostSecretsKey(), JSON.stringify(all)); }
}
async function hostReveal(pid, invId, card, salt) {
  const v = G.S.inv.find(x => x.id === invId);
  if (!v || v.owner !== pid || G.S.phase === 'play' || (G.S.revealed && G.S.revealed[invId])) return;
  let all = {}; try { all = JSON.parse(lsGet(hostSecretsKey()) || '{}'); } catch (e) {}
  if (!INSANITY.find(c => c.id === card)) return;
  const ok = all[invId] ? (await sha(card + ':' + salt)) === all[invId] : false;
  const D = clone(G.S); D.revealed = D.revealed || {}; D.revealed[invId] = {card, ok}; D.rev = G.S.rev + 1;
  hostAccept(D);
}
function saveHost(S) { lsSet('gw-host', JSON.stringify(S)); }
function loadHost() { try { const s = lsGet('gw-host'); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

// client ----------------------------------------------------------------
async function joinGame(code) {
  code = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(code)) { toast('Enter the 5-letter code your host shared.'); return; }
  if (!peerReady()) return;
  const name = await ensureName(); if (!name) return;
  resetOnline(code);
  lsSet('gw-recent', code);
  G.net = {role: 'client', peer: null, conn: null, tries: 0, alive: true, timer: null};
  G.screen = 'loading'; render(); setLoad('Knocking on the door…');
  const peer = new Peer({debug: 0});
  G.net.peer = peer;
  peer.on('open', () => connectHost());
  peer.on('disconnected', () => { setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} }, 1500); });
  peer.on('error', err => {
    if (err.type === 'peer-unavailable') {
      if (!G.S && !G.lobby && G.net.tries === 0) { toast('No game is open with that code. Check it, and make sure the host still has the game on screen.'); goHome(); }
      else scheduleReconnect();
    } else if (['network', 'server-error', 'socket-error'].includes(err.type)) { netStatus('Connection trouble — retrying…'); scheduleReconnect(); }
    else if (err.type === 'browser-incompatible') { toast('This browser cannot join online games. Try Chrome, Edge or Safari.'); goHome(); }
  });
  const net = G.net;
  G.subs.push(() => { net.alive = false; clearTimeout(net.timer); try { peer.destroy(); } catch (e) {} });
}
function connectHost() {
  const n = G.net; if (!n || !n.alive || n.role !== 'client') return;
  if (n.peer.disconnected) { try { n.peer.reconnect(); } catch (e) {} }
  const conn = n.peer.connect(PEER_PREFIX + G.code, {reliable: true});
  n.conn = conn;
  conn.on('open', () => { n.tries = 0; send(conn, {t: 'hello', pid: G.me, name: myName()}); netStatus(); });
  conn.on('data', msg => { try { clientHandle(msg); } catch (e) { console.error(e); } });
  conn.on('close', () => { if (n.alive && n.conn === conn) { netStatus('Lost contact with the host. Reconnecting…'); scheduleReconnect(); } });
}
function scheduleReconnect() {
  const n = G.net; if (!n || !n.alive || n.role !== 'client' || n.timer) return;
  n.tries++;
  netStatus(`Waiting for the host… (attempt ${n.tries})`);
  n.timer = setTimeout(() => { n.timer = null; connectHost(); }, Math.min(10000, 1500 * n.tries));
}
function clientHandle(msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'lobby' && msg.L) { G.lobby = msg.L; G.seats = msg.L.seats || []; if (!G.S) { G.screen = 'lobby'; render(); } }
  else if (msg.t === 'state' && msg.S) { if (msg.err) toast(msg.err); onState(msg.S, !!msg.force); }
}

// shared ----------------------------------------------------------------
function claims() {
  const map = {}; let n = 0;
  for (const s of G.seats) for (const id of (s.picks || [])) if (!(id in map) && n < 4) { map[id] = s.uid; n++; }
  return map;
}
function toggleSeatPick(id) {
  const mine = G.seats.find(s => s.uid === G.me); if (!mine) return;
  const c = claims();
  let picks = (mine.picks || []).slice();
  if (picks.includes(id)) picks = picks.filter(x => x !== id);
  else { if (c[id] && c[id] !== G.me) return; if (Object.keys(c).length >= 4) { toast('Four investigators is the most the house will take.'); return; } picks.push(id); }
  mine.picks = picks;
  if (G.net.role === 'host') broadcast({t: 'lobby', L: G.lobby});
  else if (!send(G.net.conn, {t: 'picks', picks})) toast('Not connected to the host right now.');
  render();
}
function beginOnline() {
  if (!G.net || G.net.role !== 'host') return;
  const c = claims();
  const order = INVESTIGATORS.map(d => d.id).filter(id => c[id]);
  if (order.length < 2) { toast('Choose at least 2 investigators.'); return; }
  const S = newGame(order.map(id => ({id, owner: c[id]})));
  Object.assign(S, {code: G.code, host: G.me, created: G.lobby.created, mode: 'online',
    players: [...new Set([G.me, ...order.map(id => c[id])])], names: Object.fromEntries(G.lobby.seats.map(s => [s.uid, s.name]))});
  hostAccept(S);
}
async function takeover(i) {
  const ok = await confirmBox('Take this seat?', `You'll control ${nm(G.S.inv[i])} from now on. Use this if a player has left or stopped responding.`);
  if (!ok) return;
  const D = clone(G.S); D.inv[i].owner = G.me; D.rev = G.S.rev + 1;
  if (!D.players.includes(G.me)) D.players.push(G.me);
  log(D, `${myName() || 'The host'} takes over ${nm(D.inv[i])}.`);
  hostAccept(D);
}
async function invite() {
  const url = location.origin + location.pathname + '?join=' + G.code;
  const text = `Join my game of Greywater — code ${G.code}`;
  try { if (navigator.share) { await navigator.share({title: 'Greywater', text, url}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Invite link copied.'); } catch (e) { info('Invite link', `<p>Send this to your friends:</p><p style="word-break:break-all"><b>${esc(url)}</b></p>`, 'Done'); }
}
async function goHome(ask) {
  if (ask && G.mode === 'online' && G.net && G.net.role === 'host' && G.S && G.S.phase === 'play') {
    const ok = await confirmBox('Leave the game?', 'You are the host. Everyone else will be paused until you choose "Resume hosting" on this device.');
    if (!ok) return;
  }
  clearSubs(); G.net = null; G.netText = ''; G.mode = null; G.S = null; G.lobby = null; G.code = null; G.screen = 'home'; G.sheet = null; G.drawer = false; app.innerHTML = ''; render();
}

G.me = myId();
