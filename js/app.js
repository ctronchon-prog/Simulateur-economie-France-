/* Interface du site Maquette France 2027-2037.
   Chargé après js/moteur.js (le modèle) et js/programmes.js (les programmes par défaut).
   Une seule interface pour toutes les pages : <body data-page="…"> dit laquelle afficher. */
(function () {
'use strict';
const E = ENGINE, YEARS = E.YEARS, N = E.N;
const HORIZONS = [2027, 2028, 2029, 2030, 2031, 2032, 2037];
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = d => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const NF = [nf(0), nf(1), nf(2), nf(3)];
const fmt = (v, d) => (v == null || !isFinite(v)) ? '–' : NF[d == null ? 1 : d].format(Math.abs(v) < 0.5 * Math.pow(10, -(d == null ? 1 : d)) ? 0 : v).replace('-', '−');
const sgn = (v, d) => { const s = fmt(v, d); return (v > 0 && s !== fmt(0, d)) ? '+' + s : s; };
const ti = y => y - 2026;
const uid = () => 'p' + Math.random().toString(36).slice(2, 9);

/* ---------- Variables affichables ---------- */
const VARS = [
  { id: 'gdpG', nom: 'Croissance du PIB', unit: '%', dec: 1, kpi: 1 },
  { id: 'gdpIdx', nom: 'PIB en volume (2026 = 100)', unit: '', dec: 1, f: (R, t) => R._idx[t] },
  { id: 'u', nom: 'Taux de chômage', unit: '%', dec: 1, kpi: 1 },
  { id: 'empK', nom: 'Emploi total (millions)', unit: 'M', dec: 2, f: (R, t) => R.empK[t] / 1000 },
  { id: 'solde', nom: 'Solde public', unit: '% PIB', dec: 1, kpi: 1 },
  { id: 'debt', nom: 'Dette publique', unit: '% PIB', dec: 1, kpi: 1 },
  { id: 'infl', nom: 'Inflation', unit: '%', dec: 1, kpi: 1 },
  { id: 'pa', nom: 'Pouvoir d\'achat des ménages', unit: '%/an', dec: 1, kpi: 1 },
  { id: 'bal', nom: 'Balance commerciale', unit: '% PIB', dec: 1, kpi: 1 },
  { id: 's80', nom: 'Inégalités (revenus des 20 % les plus aisés / 20 % les plus modestes)', court: 'Inégalités (rapport 20 % / 20 %)', unit: '', dec: 2, kpi: 1 },
  { id: 'prim', nom: 'Solde primaire (hors intérêts)', unit: '% PIB', dec: 1 },
  { id: 'intPct', nom: 'Charge d\'intérêts', unit: '% PIB', dec: 1, kpi: 1 },
  { id: 'int', nom: 'Charge d\'intérêts (Md€)', unit: 'Md€', dec: 0 },
  { id: 'debtMd', nom: 'Dette publique (Md€)', unit: 'Md€', dec: 0 },
  { id: 'depPct', nom: 'Dépenses publiques', unit: '% PIB', dec: 1 },
  { id: 'po', nom: 'Prélèvements obligatoires', unit: '% PIB', dec: 1 },
  { id: 'oat', nom: 'Taux d\'emprunt de l\'État à 10 ans', unit: '%', dec: 2, kpi: 1 },
  { id: 'spread', nom: 'Écart de taux France-Allemagne', unit: 'pts', dec: 2 },
  { id: 'ecb', nom: 'Taux de dépôt de la BCE', unit: '%', dec: 2 },
  { id: 'cac', nom: 'CAC 40 (indice simulé)', unit: 'pts', dec: 0 },
  { id: 'wageG', nom: 'Salaire moyen, croissance nominale', unit: '%', dec: 1 },
  { id: 'margin', nom: 'Taux de marge des entreprises', unit: '% VA', dec: 1 },
  { id: 'cG', nom: 'Consommation des ménages, croissance', unit: '%', dec: 1 },
  { id: 'ieG', nom: 'Investissement des entreprises, croissance', unit: '%', dec: 1 },
  { id: 'xG', nom: 'Exportations, croissance', unit: '%', dec: 1 },
  { id: 'mG', nom: 'Importations, croissance', unit: '%', dec: 1 },
  { id: 'potG', nom: 'Croissance potentielle', unit: '%', dec: 2 },
  { id: 'pen', nom: 'Prix de l\'énergie importée (2026 = 100)', unit: '', dec: 0 },
  { id: 'gapV', nom: 'Écart de production', unit: '% pot.', dec: 1 }
];
const VAR = {}; VARS.forEach(v => VAR[v.id] = v);
const val = (R, id, t) => VAR[id].f ? VAR[id].f(R, t) : R[id][t];
const PG = PROGRAMMES, copyBar = PG.copyBar;
const PAGE = document.body.dataset.page || 'accueil';
const PAGES = { accueil: 'index.html', programmes: 'programmes.html', synthese: 'comparer.html', detail: 'detail.html', chocs: 'chocs.html', reglages: 'reglages.html', scenarios: 'scenarios.html', methode: 'methode.html' };
const KEY = 'maquette-france-site-etat';

/* ---------- État ---------- */
const ORIGIN = { lfi: PG.lfiProg, rn: PG.rnProg, exA: () => PG.exampleProgs()[0], exB: () => PG.exampleProgs()[1] };
const COVER_NAME = { lfi: 'La France insoumise', rn: 'Rassemblement national' };
const isCand = p => !!COVER_NAME[p.id];
const defaultProgs = () => { const ex = PG.exampleProgs(); return [ex[2], ex[3], ex[0], ex[1]]; };
const defaultPilot = P => { const p = { from: {} }; E.PILOT.forEach(k => { p[k.id] = k.abs ? P[k.abs] : k.def; p.from[k.id] = 2028; }); return p; };
const defaultState = () => {
  const P = E.defaultParams();
  return { v: 6, tab: PAGE, horizon: 2030, shown: ['lfi', 'rn'], chartVar: 'gdpG', chartMode: 'niveau', band: true, tableView: false,
    detailTab: 'finances', detailScen: 'lfi', secMode: 'va', programmes: defaultProgs(), openProg: 'lfi', asideVar: 'debt',
    shocks: E.SHOCKS.map(s => ({ id: s.id, on: false, level: 1, year: 2028 })), pilot: defaultPilot(P), sanctions: false, params: P, mode: 'simple' };
};
let state = defaultState();
try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 6) state = merge(defaultState(), s); } } catch (e) { }
state.tab = PAGE;
function merge(def, s) {
  const o = Object.assign({}, def, s);
  o.params = Object.assign({}, def.params, s.params || {});
  o.pilot = Object.assign({}, def.pilot, s.pilot || {}); o.pilot.from = Object.assign({}, def.pilot.from, (s.pilot || {}).from || {});
  o.shocks = def.shocks.map(d => Object.assign({}, d, (s.shocks || []).find(x => x.id === d.id) || {}));
  o.programmes = Array.isArray(s.programmes) ? s.programmes : def.programmes;
  return o;
}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } };
const snapshot = () => ({ programmes: state.programmes, shown: state.shown, shocks: state.shocks, pilot: state.pilot, sanctions: state.sanctions, params: state.params });
function loadSnapshot(s) {
  state = merge(defaultState(), Object.assign({}, state, s, { tab: 'synthese' }));
  state.shown = (state.shown || []).filter(id => id === 'env' || state.programmes.some(p => p.id === id));
  if (!state.programmes.some(p => p.id === state.detailScen)) state.detailScen = state.programmes[0] ? state.programmes[0].id : 'ref';
  recompute(); go('synthese');
}


/* ---------- Calcul ---------- */
let RES = { ref: null, env: null, progs: {} };
const envActive = () => state.shocks.some(s => s.on) || E.PILOT.some(k => { const v = state.pilot[k.id]; return k.abs ? Math.abs(v - state.params[k.abs]) > 1e-9 : !!v; }) || state.sanctions;
function addIdx(R) { R._idx = [100]; for (let t = 1; t < N; t++) R._idx[t] = R._idx[t - 1] * (1 + R.gdpG[t] / 100); return R; }
function simProg(p, P, B, opt) { const o = {}; ['central', 'pess', 'opt'].forEach(s => o[s] = addIdx(E.simulate(P, B, E.buildImpulses(P, B, p, state.shocks, state.pilot, s), opt))); return o; }
function recompute() {
  const P = state.params, B = E.baseline(P), opt = { sanctions: state.sanctions };
  RES.ref = addIdx(E.simulate(P, B, E.newImp(), {}));
  RES.env = envActive() ? addIdx(E.simulate(P, B, E.buildImpulses(P, B, null, state.shocks, state.pilot, 'central'), opt)) : null;
  RES.progs = {};
  state.programmes.forEach(p => { RES.progs[p.id] = simProg(p, P, B, opt); });
  persist();
}
// une case cochée ou décochée ne touche qu'un programme : on ne recalcule que lui
function recomputeProg(id) {
  const p = prog(id); if (!p || !RES.ref) return recompute();
  RES.progs[id] = simProg(p, state.params, E.baseline(state.params), { sanctions: state.sanctions }); persist();
}
const scenList = () => { const l = [{ id: 'ref', name: 'Référence', short: 'Réf.', color: 'var(--s0)', dash: true }]; if (RES.env) l.push({ id: 'env', name: 'Référence avec chocs', short: 'Réf. + chocs', color: 'var(--ink)', dash: true }); state.programmes.forEach((p, i) => l.push({ id: p.id, name: p.name || 'Programme', color: 'var(--s' + (i % 6 + 1) + ')' })); return l; };
const getR = id => id === 'ref' ? { central: RES.ref, pess: RES.ref, opt: RES.ref } : id === 'env' ? { central: RES.env, pess: RES.env, opt: RES.env } : RES.progs[id];
const shownList = () => scenList().filter(s => s.id === 'ref' || state.shown.includes(s.id));
const swatch = s => '<i class="sw' + (s.dash ? ' dash' : '') + '" style="--c:' + s.color + ';background:' + s.color + '"></i>';

/* ---------- Graphiques ---------- */
function niceTicks(lo, hi, n) {
  if (hi - lo < 1e-9) { hi = lo + 1; lo = lo - 1; }
  const raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag, step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const a = Math.floor(lo / step) * step, out = []; for (let v = a; v <= hi + step * 0.5; v += step) out.push(+v.toFixed(10)); return out;
}
function lineChart(el, cfg) {
  const W = Math.max(300, Math.floor(el.clientWidth || 600)), small = W < 560, H = small ? 240 : 310, m = { l: 46, r: 12, t: 10, b: 26 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b, n = YEARS.length;
  let lo = Infinity, hi = -Infinity;
  cfg.series.forEach(s => { s.vals.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); if (s.lo) { s.lo.forEach(v => lo = Math.min(lo, v)); s.hi.forEach(v => hi = Math.max(hi, v)); } });
  if (cfg.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const pad = (hi - lo) * 0.08 || 0.5; const ticks = niceTicks(lo - pad, hi + pad, small ? 4 : 5); lo = ticks[0]; hi = ticks[ticks.length - 1];
  const X = i => m.l + pw * i / (n - 1), Y = v => m.t + ph * (1 - (v - lo) / (hi - lo));
  const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1, td = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  let g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cfg.title) + '">';
  ticks.forEach(v => { g += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)" stroke-width="' + (Math.abs(v) < 1e-9 ? 1.6 : 1) + '"' + (Math.abs(v) < 1e-9 ? ' stroke="var(--muted)"' : '') + '/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11.5" fill="var(--muted)">' + fmt(v, td) + '</text>'; });
  YEARS.forEach((y, i) => { if (small && i % 2 === 1 && y !== 2037) return; if (small && y === 2036) return; g += '<text x="' + X(i) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="11.5" fill="var(--muted)">' + (small ? "'" + String(y).slice(2) : y) + '</text>'; });
  const mi = ti(cfg.mark);
  g += '<line x1="' + X(mi) + '" x2="' + X(mi) + '" y1="' + m.t + '" y2="' + (m.t + ph) + '" stroke="var(--muted)" stroke-dasharray="2 4"/>';
  g += '<rect x="' + X(1) + '" y="' + m.t + '" width="' + (X(1.5) - X(1)) + '" height="' + ph + '" fill="var(--muted)" opacity=".07"/>';
  cfg.series.forEach(s => { if (!s.lo) return; let d = ''; s.hi.forEach((v, i) => d += (i ? 'L' : 'M') + X(i) + ' ' + Y(v)); for (let i = n - 1; i >= 0; i--) d += 'L' + X(i) + ' ' + Y(s.lo[i]); g += '<path d="' + d + 'Z" fill="' + s.color + '" opacity=".14"/>'; });
  cfg.series.forEach(s => { let d = ''; s.vals.forEach((v, i) => d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)); g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2"' + (s.dash ? ' stroke-dasharray="6 4"' : '') + ' stroke-linejoin="round" stroke-linecap="round"/>'; });
  cfg.series.forEach(s => { g += '<circle cx="' + X(mi) + '" cy="' + Y(s.vals[mi]) + '" r="4.5" fill="' + s.color + '" stroke="var(--surface)" stroke-width="2"/>'; });
  g += '<line class="cx" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ph) + '" stroke="var(--ink2)" stroke-width="1" visibility="hidden"/>';
  g += '<rect class="hit" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '" fill="transparent"/></svg><div class="tip" hidden></div>';
  el.innerHTML = g;
  const svg = $('svg', el), tip = $('.tip', el), cx = $('.cx', el);
  const move = ev => {
    const r = svg.getBoundingClientRect(), sx = W / r.width, x = (ev.clientX - r.left) * sx;
    const i = Math.max(0, Math.min(n - 1, Math.round((x - m.l) / pw * (n - 1))));
    cx.setAttribute('x1', X(i)); cx.setAttribute('x2', X(i)); cx.setAttribute('visibility', 'visible');
    tip.innerHTML = '<div class="t">' + YEARS[i] + '</div>' + cfg.series.map(s => '<div class="r"><span>' + swatch(s) + esc(s.short || s.name) + '</span><b>' + (cfg.signed ? sgn(s.vals[i], cfg.dec) : fmt(s.vals[i], cfg.dec)) + '</b></div>').join('');
    tip.hidden = false; const tw = tip.offsetWidth, px = X(i) / sx; tip.style.left = Math.max(0, Math.min(r.width - tw, px + (px > r.width / 2 ? -tw - 12 : 12))) + 'px'; tip.style.top = '8px';
  };
  svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', () => { tip.hidden = true; cx.setAttribute('visibility', 'hidden'); });
}
function bars(items, dec, unit) {
  const mx = Math.max(1e-9, ...items.map(i => Math.abs(i.v)));
  return '<div class="bars">' + items.map(i => '<div class="bar" title="' + esc(i.label) + '"><span>' + esc(i.label) + (i.sub ? ' <span class="note">' + esc(i.sub) + '</span>' : '') + '</span><span class="track"><span class="fill' + (i.v < 0 ? ' n' : '') + '" style="width:' + (Math.abs(i.v) / mx * 50).toFixed(1) + '%"></span></span><span class="val">' + sgn(i.v, dec) + (unit ? ' ' + unit : '') + '</span></div>').join('') + '</div>';
}

/* ---------- Synthèse ---------- */
function horizonChips() { return '<div class="chips" role="group" aria-label="Année lue">' + HORIZONS.map(y => '<button class="chip" data-act="horizon" data-y="' + y + '" aria-pressed="' + (state.horizon === y) + '">' + y + '</button>').join('') + '</div>'; }
function renderSynthese() {
  const all = scenList(), shown = shownList(), t = ti(state.horizon), v = VAR[state.chartVar];
  let h = '<section class="card"><div class="row between"><span class="lbl">Courbes affichées</span><span class="note">Quatre programmes au plus</span></div><div class="chips">' +
    all.map(s => s.id === 'ref' ? '<span class="chip scen" aria-pressed="true">' + swatch(s) + 'Référence</span>' : '<button class="chip scen" data-act="show" data-id="' + s.id + '" aria-pressed="' + state.shown.includes(s.id) + '">' + swatch(s) + esc(s.name) + '</button>').join('') +
    '</div>' + envLine() + '</section>';
  // tableau comparatif
  const kp = VARS.filter(x => x.kpi);
  h += '<section class="card"><h2>Tableau de bord ' + state.horizon + '</h2><div class="scroll"><table><thead><tr><th></th>' + shown.map(s => '<th><span class="hd" title="' + esc(s.name) + '">' + swatch(s) + '<span class="nm">' + esc(s.short || s.name) + '</span></span></th>').join('') + '</tr></thead><tbody>';
  kp.forEach(k => {
    h += '<tr><td>' + esc(k.court || k.nom) + ' <span class="note">' + esc(k.unit) + '</span></td>';
    shown.forEach(s => { const R = getR(s.id), c = val(R.central, k.id, t), ref = val(RES.ref, k.id, t), a = val(R.pess, k.id, t), b = val(R.opt, k.id, t);
      h += '<td><span class="v">' + fmt(c, k.dec) + '</span>' + (s.id !== 'ref' ? '<span class="d">' + sgn(c - ref, k.dec) + '<span class="vs"> vs réf.</span></span>' : '') + (Math.abs(a - b) > 0.5 * Math.pow(10, -k.dec) ? '<span class="d">' + fmt(Math.min(a, b), k.dec) + '<span class="a"> à </span>' + fmt(Math.max(a, b), k.dec) + '</span>' : '') + '</td>'; });
    h += '</tr>';
  });
  h += '<tr><td>Emploi <span class="note">milliers, écart à la référence</span></td>' + shown.map(s => { const R = getR(s.id); return '<td><span class="v">' + (s.id === 'ref' ? fmt(RES.ref.empK[t], 0) : sgn(R.central.empK[t] - RES.ref.empK[t], 0)) + '</span>' + (s.id === 'ref' ? '<span class="d">niveau</span>' : '') + '</td>'; }).join('') + '</tr>';
  h += '</tbody></table></div><p class="note">Sous chaque valeur : l\'écart à la référence, puis la fourchette entre scénario pessimiste et scénario optimiste.</p></section>';
  // graphique
  h += '<section class="card"><div class="row between"><h2>Trajectoires 2026-2037</h2><div class="seg" role="group" aria-label="Mode"><button data-act="mode" data-m="niveau" aria-pressed="' + (state.chartMode === 'niveau') + '">Niveaux</button><button data-act="mode" data-m="ecart" aria-pressed="' + (state.chartMode === 'ecart') + '">Écarts à la référence</button></div></div>' +
    '<div class="row"><label class="lbl" for="chartVar">Variable</label><select id="chartVar" data-act="var">' + VARS.map(x => '<option value="' + x.id + '"' + (x.id === state.chartVar ? ' selected' : '') + '>' + esc(x.nom) + '</option>').join('') + '</select>' +
    '<label class="sw-t" style="font-weight:400"><input type="checkbox" id="band" data-act="band"' + (state.band ? ' checked' : '') + '>Fourchettes</label><label class="sw-t" style="font-weight:400"><input type="checkbox" id="tview" data-act="tview"' + (state.tableView ? ' checked' : '') + '>Tableau</label></div>' +
    '<div class="legend">' + shown.filter(s => state.chartMode === 'niveau' || s.id !== 'ref').map(s => '<span>' + swatch(s) + esc(s.name) + '</span>').join('') + '</div><div class="chart" id="chart"></div>';
  if (state.tableView) {
    h += '<div class="scroll"><table><thead><tr><th>' + esc(v.nom) + '</th>' + HORIZONS.map(y => '<th>' + y + '</th>').join('') + '</tr></thead><tbody>' + shown.map(s => { const R = getR(s.id).central; return '<tr><td><span class="hd">' + swatch(s) + esc(s.name) + '</span></td>' + HORIZONS.map(y => '<td>' + (state.chartMode === 'ecart' ? sgn(val(R, v.id, ti(y)) - val(RES.ref, v.id, ti(y)), Math.max(v.dec, 1)) : fmt(val(R, v.id, ti(y)), v.dec)) + '</td>').join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  h += '<p class="note">La zone grisée marque le second semestre 2027 : les mesures d\'un programme s\'appliquent à partir de juillet 2027. Le trait vertical marque l\'année lue.</p></section>';
  // alertes
  h += '<section class="card"><h2>Règles européennes et signaux de marché, ' + state.horizon + '</h2>' + shown.map(s => { const al = getR(s.id).central.alerts[t]; return '<div class="alerts"><span class="hd" style="justify-content:flex-start;font-weight:600">' + swatch(s) + esc(s.name) + '</span>' + (al.length ? al.map(a => '<span class="pill ' + a.lvl + '"><b>' + (a.lvl === 'crit' ? 'Alerte' : 'Vigilance') + '</b>' + esc(a.txt.replace(/(\d)\.(\d)/g, '$1,$2')) + '</span>').join('') : '<span class="pill ok"><b>RAS</b>Aucun seuil franchi</span>') + '</div>'; }).join('') +
    '<p class="note">Les sanctions ne sont appliquées dans le calcul que si la case est cochée dans la page Chocs et pilotage' + (state.sanctions ? ' (cochée actuellement)' : '') + '.</p></section>';
  $('#view').innerHTML = h; drawChart();
}
function envLine() {
  const on = state.shocks.filter(s => s.on).map(s => { const d = E.SHOCKS.find(x => x.id === s.id); return d.nom + ' (' + d.lv[s.level] + ', ' + s.year + ')'; });
  E.PILOT.forEach(k => { const v = state.pilot[k.id], dv = k.abs ? v - state.params[k.abs] : v; if (dv) on.push(k.nom + ' : ' + (k.abs ? fmt(v, 2) : sgn(v, k.step < 1 ? 1 : 0)) + ' ' + k.unit + ' dès ' + state.pilot.from[k.id]); });
  if (state.sanctions) on.push('sanctions européennes activées');
  return on.length ? '<p class="note"><b>Environnement modifié :</b> ' + esc(on.join(' · ')) + '. Il s\'applique à tous les programmes.</p>' : '';
}
function drawChart() {
  const el = $('#chart'); if (!el) return; const v = VAR[state.chartVar], ec = state.chartMode === 'ecart';
  const series = shownList().filter(s => !ec || s.id !== 'ref').map(s => {
    const R = getR(s.id), g = (X, t) => val(X, v.id, t) - (ec ? val(RES.ref, v.id, t) : 0);
    const o = { name: s.name, color: s.color, dash: s.dash, vals: YEARS.map((y, t) => g(R.central, t)) };
    if (state.band && s.id !== 'ref' && s.id !== 'env') { const a = YEARS.map((y, t) => g(R.pess, t)), b = YEARS.map((y, t) => g(R.opt, t)); o.lo = a.map((x, i) => Math.min(x, b[i], o.vals[i])); o.hi = a.map((x, i) => Math.max(x, b[i], o.vals[i])); }
    return o;
  });
  if (!series.length) { el.innerHTML = '<p class="note">Affichez au moins un programme, ou activez un choc, pour voir un écart à la référence.</p>'; return; }
  lineChart(el, { series, dec: Math.max(v.dec, ec ? 2 : v.dec), mark: state.horizon, zero: ec, signed: ec, title: v.nom });
}

/* ---------- Détail ---------- */
function renderDetail() {
  const all = scenList(); if (!all.some(s => s.id === state.detailScen)) state.detailScen = all[all.length - 1].id;
  const s = all.find(x => x.id === state.detailScen), R = getR(s.id).central, ref = RES.ref, t = ti(state.horizon), isRef = s.id === 'ref';
  const tabs = [['finances', 'Finances publiques'], ['secu', 'Sécurité sociale'], ['entreprises', 'Entreprises'], ['secteurs', 'Secteurs'], ['menages', 'Ménages']];
  let h = '<section class="card"><div class="row"><label class="lbl" for="dscen">Scénario examiné</label><select id="dscen" data-act="dscen">' + all.map(x => '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></div>' +
    '<div class="chips">' + tabs.map(x => '<button class="chip" data-act="dtab" data-d="' + x[0] + '" aria-pressed="' + (state.detailTab === x[0]) + '">' + x[1] + '</button>').join('') + '</div></section>';
  const Yn = R.gdpN[t], d = (a, b, dec) => isRef ? '' : '<span class="d">' + sgn(a - b, dec) + '</span>';
  const cell = (a, b, dec) => '<td><span class="v">' + fmt(a, dec) + '</span>' + d(a, b, dec) + '</td>';
  if (state.detailTab === 'finances') {
    const subs = [['etat', 'État et organismes centraux'], ['ct', 'Collectivités locales'], ['secu', 'Administrations de sécurité sociale']];
    h += '<section class="card"><h2>Comptes par administration, ' + state.horizon + '</h2><div class="scroll"><table><thead><tr><th></th><th>Dépenses, Md€</th><th>Recettes, Md€</th><th>Solde, Md€</th><th>Solde, % PIB</th></tr></thead><tbody>' +
      subs.map(x => '<tr><td>' + x[1] + '</td>' + cell(R.sub[x[0]].dep[t], ref.sub[x[0]].dep[t], 0) + cell(R.sub[x[0]].rec[t], ref.sub[x[0]].rec[t], 0) + cell(R.sub[x[0]].solde[t], ref.sub[x[0]].solde[t], 0) + cell(R.sub[x[0]].solde[t] / Yn * 100, ref.sub[x[0]].solde[t] / ref.gdpN[t] * 100, 1) + '</tr>').join('') +
      '<tr><td><b>Ensemble des administrations</b></td>' + cell(R.depMd[t], ref.depMd[t], 0) + cell(R.recMd[t], ref.recMd[t], 0) + cell(-R.def[t] / 100 * Yn, -ref.def[t] / 100 * ref.gdpN[t], 0) + cell(R.solde[t], ref.solde[t], 1) + '</tr></tbody></table></div>' +
      '<p class="note">' + (isRef ? '' : 'En petit : écart à la référence. ') + 'La répartition entre administrations est estimée ; le total est calé sur le budget.</p></section>';
    const tbl = (title, obj, lab, src) => '<section class="card"><h2>' + title + '</h2><div class="scroll"><table><thead><tr><th></th><th>Md€</th><th>% PIB</th></tr></thead><tbody>' + Object.keys(lab).map(k => '<tr><td>' + lab[k] + '</td>' + cell(obj[k][t], src[k][t], 0) + '<td>' + fmt(obj[k][t] / Yn * 100, 1) + '</td></tr>').join('') + '</tbody></table></div></section>';
    h += '<div class="grid2">' + tbl('Recettes ' + state.horizon, R.recI, E.REC_LABELS, ref.recI) + tbl('Dépenses ' + state.horizon, R.depN, E.DEP_LABELS, ref.depN) + '</div>';
    if (!isRef) h += '<section class="card"><h2>Chiffrage avant effets économiques, ' + state.horizon + '</h2><div class="kv"><span>Recettes nouvelles</span><span>' + sgn(R.xRev[t], 1) + ' Md€</span><span>Dépenses nouvelles</span><span>' + sgn(R.xSp[t], 1) + ' Md€</span><span>Effet direct sur le solde</span><span>' + sgn(R.xRev[t] - R.xSp[t], 1) + ' Md€</span><span>Effet final sur le solde, après bouclage économique</span><span>' + sgn(-R.def[t] / 100 * Yn + ref.def[t] / 100 * ref.gdpN[t], 1) + ' Md€</span></div></section>';
  } else if (state.detailTab === 'secu') {
    const base = ['mal', 'vie', 'fam', 'atmp', 'aut'], sb = (X, f) => base.reduce((a, k) => a + X.br[k][f][t], 0);
    h += '<section class="card"><h2>Branches, ' + state.horizon + '</h2><div class="scroll"><table><thead><tr><th></th><th>Dépenses, Md€</th><th>Solde, Md€</th></tr></thead><tbody>' +
      E.BRANCHES.slice(0, 5).map(b => '<tr><td>' + b.nom + '</td>' + cell(R.br[b.id].dep[t], ref.br[b.id].dep[t], 1) + cell(R.br[b.id].solde[t], ref.br[b.id].solde[t], 1) + '</tr>').join('') +
      '<tr><td><b>Régimes de base, ensemble</b></td>' + cell(sb(R, 'dep'), sb(ref, 'dep'), 1) + cell(sb(R, 'solde'), sb(ref, 'solde'), 1) + '</tr>' +
      E.BRANCHES.slice(5).map(b => '<tr><td>' + b.nom + '</td>' + cell(R.br[b.id].dep[t], ref.br[b.id].dep[t], 1) + cell(R.br[b.id].solde[t], ref.br[b.id].solde[t], 1) + '</tr>').join('') +
      '<tr><td><b>Administrations de sécurité sociale, agrégé</b></td>' + cell(R.sub.secu.dep[t], ref.sub.secu.dep[t], 0) + cell(R.sub.secu.solde[t], ref.sub.secu.solde[t], 1) + '</tr></tbody></table></div>' +
      '<p class="note">L\'agrégat ajoute aux branches les hôpitaux et la caisse d\'amortissement de la dette sociale, d\'où un solde plus favorable que la somme des branches.</p></section>';
    const bid = ['mal', 'vie', 'fam', 'une'], cols = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
    h += '<section class="card"><h2>Soldes des principales branches, Md€</h2><div class="legend">' + bid.map((k, i) => '<span><i class="sw" style="background:' + cols[i] + '"></i>' + E.BRANCHES.find(b => b.id === k).nom + '</span>').join('') + '</div><div class="chart" id="chart2"></div></section>';
  } else if (state.detailTab === 'entreprises') {
    const row = (nom, o, m) => '<tr><td>' + nom + '</td><td><span class="v">' + sgn(o.va[t], 1) + ' %</span></td><td><span class="v">' + sgn(o.emp[t], 0) + '</span></td><td><span class="v">' + sgn(o.inv[t], 1) + ' %</span></td>' + (m ? '<td><span class="v">' + fmt(o.margin[t], 1) + ' %</span></td>' : '<td>–</td>') + '</tr>';
    h += '<section class="card"><h2>Par taille d\'entreprise, ' + state.horizon + '</h2><div class="scroll"><table><thead><tr><th></th><th>Valeur ajoutée</th><th>Emplois, milliers</th><th>Investissement</th><th>Taux de marge</th></tr></thead><tbody>' + E.SIZES.map(z => row(z.nom, R.size[z.id], 1)).join('') + '</tbody></table></div><h2>Catégories transversales</h2><div class="scroll"><table><thead><tr><th></th><th>Valeur ajoutée</th><th>Emplois, milliers</th><th>Investissement</th><th>Taux de marge</th></tr></thead><tbody>' + E.TRANSV.map(z => row(z.nom, R.trv[z.id], 0)).join('') + '</tbody></table></div>' +
      '<p class="note">Valeur ajoutée, emplois et investissement sont des écarts à la référence. Les catégories transversales recoupent les tailles : elles ne s\'additionnent pas.' + (isRef ? ' La référence sert de point zéro : choisissez un programme ou activez un choc.' : '') + '</p></section>';
    h += '<section class="card"><h2>Valeur ajoutée par taille, écart à la référence</h2>' + bars(E.SIZES.map(z => ({ label: z.nom, v: R.size[z.id].va[t] })).concat(E.TRANSV.map(z => ({ label: z.id === 'expo' ? 'Exposées à la concurrence' : 'Multinationales étrangères', v: R.trv[z.id].va[t] }))), 1, '%') + '</section>';
  } else if (state.detailTab === 'secteurs') {
    const emp = state.secMode === 'emp';
    const items = E.SECTORS.map(x => ({ label: x.nom, v: emp ? R.sec[x.id].emp[t] : R.sec[x.id].va[t] })).concat([{ label: E.TOURISM.nom, v: emp ? R.tourEmp[t] : R.tourVa[t] }]);
    h += '<section class="card"><div class="row between"><h2>Secteurs, écart à la référence en ' + state.horizon + '</h2><div class="seg"><button data-act="secmode" data-m="va" aria-pressed="' + !emp + '">Valeur ajoutée</button><button data-act="secmode" data-m="emp" aria-pressed="' + emp + '">Emplois</button></div></div>' + bars(items, emp ? 0 : 1, emp ? 'k' : '%') +
      '<p class="note">' + (emp ? 'Emplois en milliers.' : 'Valeur ajoutée en volume.') + ' Le tourisme recoupe l\'hébergement-restauration, les transports et les loisirs : il est présenté à part et ne s\'ajoute pas aux autres secteurs.' + (isRef ? ' La référence sert de point zéro : choisissez un programme ou activez un choc.' : '') + '</p></section>';
    h += '<section class="card"><h2>Poids et niveau des secteurs</h2><div class="scroll"><table><thead><tr><th></th><th>Valeur ajoutée ' + state.horizon + ', Md€ 2026</th><th>Part de l\'emploi</th></tr></thead><tbody>' + E.SECTORS.map(x => '<tr><td>' + x.nom + '</td>' + cell(R.sec[x.id].lvl[t], ref.sec[x.id].lvl[t], 0) + '<td>' + fmt(x.emp, 1) + ' %</td></tr>').join('') + '</tbody></table></div></section>';
  } else {
    const men = E.D.dec.rdb.map((sh, i) => 1900e9 * sh / 100 / 3.1e6);
    h += '<section class="card"><h2>Pouvoir d\'achat par dixième de niveau de vie, ' + state.horizon + '</h2>' + bars(R.dec.map((x, i) => ({ label: 'D' + (i + 1) + (i === 0 ? ' · les plus modestes' : i === 9 ? ' · les plus aisés' : ''), v: x[t] })), 2, '%') +
      '<p class="note">Écart de revenu disponible réel par rapport à la référence, en niveau cumulé.' + (isRef ? ' La référence sert de point zéro : choisissez un programme ou activez un choc.' : '') + '</p></section>';
    h += '<div class="grid2"><section class="card"><h2>Actifs et retraités</h2>' + bars([{ label: 'Ménages d\'actifs', v: R.rdbA[t] }, { label: 'Ménages de retraités', v: R.rdbR[t] }], 2, '%') + '<div class="kv"><span>Rapport entre les 20 % les plus aisés et les 20 % les plus modestes</span><span>' + fmt(R.s80[t], 2) + (isRef ? '' : ' (' + sgn(R.s80[t] - ref.s80[t], 2) + ')') + '</span><span>Pouvoir d\'achat moyen, croissance ' + state.horizon + '</span><span>' + sgn(R.pa[t], 1) + ' %</span></div></section>' +
      '<section class="card"><h2>En euros par ménage et par an</h2><div class="scroll"><table><thead><tr><th>Dixième</th><th>Revenu disponible moyen</th><th>Écart, € de 2026</th></tr></thead><tbody>' + R.dec.map((x, i) => '<tr><td>D' + (i + 1) + '</td><td>' + fmt(men[i], 0) + ' €</td><td><span class="v">' + sgn(men[i] * x[t] / 100, 0) + ' €</span></td></tr>').join('') + '</tbody></table></div><p class="note">Ordres de grandeur : le revenu de chaque dixième est réparti sur 3,1 millions de ménages.</p></section></div>';
  }
  $('#view').innerHTML = h;
  if (state.detailTab === 'secu') { const bid = ['mal', 'vie', 'fam', 'une'], cols = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)']; lineChart($('#chart2'), { series: bid.map((k, i) => ({ name: E.BRANCHES.find(b => b.id === k).nom, color: cols[i], vals: R.br[k].solde.slice() })), dec: 1, mark: state.horizon, zero: true, signed: true, title: 'Soldes des branches' }); }
}


/* ---------- Programmes ---------- */
const yearOpts = (sel, from) => { let o = ''; for (let y = from || 2027; y <= 2037; y++) o += '<option' + (y === sel ? ' selected' : '') + '>' + y + '</option>'; return o; };
const rampOpts = sel => [1, 2, 3, 4, 5].map(n => '<option value="' + n + '"' + (n === (sel || 1) ? ' selected' : '') + '>' + (n === 1 ? 'immédiate' : n + ' ans') + '</option>').join('');
const SRC = { c: 'chiffré par le candidat', m: 'mesure du candidat, effet calculé par la maquette', e: 'ordre de grandeur de la maquette' };
const openM = {};
const hasCh = m => m.chiffre !== '' && m.chiffre != null;
function fmtPop(n, who) { // n en millions
  if (!n) return ''; const u = n * 1e6;
  return (u < 10000 ? fmt(Math.round(u / (u < 1000 ? 10 : 100)) * (u < 1000 ? 10 : 100), 0) : u < 1e6 ? fmt(Math.round(u / 1000), 0) + ' 000' : fmt(n, 1) + ' millions de') + ' ' + who;
}
function measTitle(m) {
  if (m.nom) return m.nom;
  if (m.bar) return "Barème de l'impôt sur le revenu et de la CSG";
  if (m.ass) return (E.ASS[m.ass] || {}).nom || 'Mesure par assiette';
  if (m.custom) return 'Mesure libre';
  return (E.LEV[m.lever] || {}).nom || 'Mesure';
}
// effet direct sur le solde public, en Md€ par an à plein régime (null si la mesure n'a pas de chiffrage budgétaire direct)
function measSolde(m) {
  if (m.bar) { const r = E.MICRO.bareme(m.bar, state.params.eti); return r.dIR + r.dCSG; }
  if (m.ass) { const r = E.assInfo(m); if (!r) return null; return hasCh(m) ? Math.sign(r.md) * Math.abs(+m.chiffre) : r.md; }
  if (m.custom) { const ch = E.CUSTOM_CH.find(c => c.id === m.canal); return ch && !ch.struct ? ch.sens * (+m.montant || 0) * ((m.eff || [50, 100, 100])[1] / 100) : null; }
  const l = E.LEV[m.lever], v = +m.value || 0; if (!l || !l.sens || !l.y) return null;
  return l.sens * (hasCh(m) && l.unit !== 'Md€' ? Math.sign(v) * Math.abs(+m.chiffre) : v * l.y);
}
function measShort(m) {
  const s = measSolde(m); let t;
  if (s != null) t = 'solde ' + sgn(s, 1) + ' Md€';
  else if (m.custom) { const ch = E.CUSTOM_CH.find(c => c.id === m.canal); t = sgn(+m.montant || 0, 1) + ' ' + ((ch && ch.unit) || ''); }
  else { const l = E.LEV[m.lever]; t = sgn(+m.value || 0, 1) + ' ' + (l ? l.unit : ''); }
  const st = m.start || 2027;
  return t + ' · ' + (m.end ? (m.end <= st ? st + ' seulement' : st + ' à ' + m.end) : st);
}
function measHint(m) {
  const P = state.params;
  if (m.bar) {
    const r = E.MICRO.bareme(m.bar, P.eti);
    return '<div class="kv"><span>Impôt sur le revenu</span><span>' + sgn(r.dIR, 1) + ' Md€</span><span>CSG</span><span>' + sgn(r.dCSG, 1) + ' Md€</span><span>Total avant effets économiques</span><span>' + sgn(r.dIR + r.dCSG, 1) + ' Md€</span><span>Personnes qui paient moins / plus</span><span>' + fmt(r.win, 0) + ' % / ' + fmt(r.lose, 0) + ' %</span><span>Bascule pour un salarié seul</span><span>' + (r.cross ? fmt(Math.round(r.cross / 10) * 10, 0) + ' € nets par mois' : 'aucune') + '</span></div>' +
      '<div class="scroll"><table><thead><tr><th>Salaire net par mois</th>' + r.cas.map(c => '<th>' + fmt(c.net, 0) + ' €</th>').join('') + '</tr></thead><tbody><tr><td>Impôt et CSG, écart par an</td>' + r.cas.map(c => '<td>' + sgn(-c.gain, 0) + ' €</td>').join('') + '</tr></tbody></table></div>' +
      '<p class="note">Calcul sur une distribution reconstituée des salaires et des pensions, personne par personne, sans enfant à charge. Calcul statique par défaut : le réglage « Réaction des hauts revenus », en mode expert, fait baisser les revenus déclarés au-delà de 100 000 € par an quand le taux marginal monte. Les revenus du capital ne passent pas par ce barème. La décote actuelle est conservée tant que la première tranche reste à 0 %.</p>';
  }
  if (m.ass) {
    const r = E.assInfo(m); if (!r) return ''; const a = r.a, parts = [];
    if (r.n) parts.push(fmtPop(r.n, a.who) + ' concerné' + (a.who === 'personnes' ? 'es' : 's'));
    if (r.base != null) parts.push('assiette de ' + fmt(r.base, r.base < 20 ? 1 : 0) + ' Md€');
    if (!r.md) return esc(parts.join(' · ')) + (parts.length ? ' · ' : '') + 'taux nul : sans effet.';
    parts.push((r.md > 0 ? 'rendement mécanique de ' : 'coût de ') + fmt(Math.abs(r.md), 1) + ' Md€ par an');
    const c = hasCh(m) ? Math.abs(+m.chiffre) : Math.abs(r.md), up = r.md > 0;
    if (hasCh(m)) parts.push('montant retenu : ' + fmt(c, 1) + ' Md€ (chiffrage du candidat)');
    parts.push('fourchette de ' + fmt(c * (up ? P.pessYield : P.optCost), 1) + ' à ' + fmt(c * (up ? P.optYield : P.pessCost), 1) + ' Md€');
    return esc(parts.join(' · ')) + '.';
  }
  if (m.custom) { const ch = E.CUSTOM_CH.find(c => c.id === m.canal); if (!ch) return ''; const u = ch.unit || 'Md€', e = m.eff || [50, 100, 100]; return esc('Effet retenu : ' + fmt(m.montant * e[0] / 100, 1) + ' ' + u + ' (pessimiste), ' + fmt(m.montant * e[1] / 100, 1) + ' ' + u + ' (central), ' + fmt(m.montant * e[2] / 100, 1) + ' ' + u + ' (optimiste).'); }
  const l = E.LEV[m.lever], v = +m.value || 0; if (!l) return '';
  const special = { tariff: 'Renchérit les importations ; rétorsions sur les exportations incluses.', migr: "Écart annuel par rapport à la tendance actuelle ; l'effet se cumule.", hours: "Une baisse crée des embauches à production donnée, renchérit l'heure de travail et réduit la production potentielle. Réglages dans la page Réglages, mode expert.", idxsal: "100 % : les salaires suivent les prix dans l'année. Sans effet tant que l'inflation ne s'écarte pas de la référence ; amplifie ensuite les hausses de prix et protège le pouvoir d'achat des salariés.", ppb: 'Prêts, garanties et participations hors budget. Part réellement additionnelle : ' + fmt(P.ppbAdd * 100, 0) + ' % en central (' + fmt(P.ppbAdd * P.pessSupply * 100, 0) + ' % à ' + fmt(P.ppbAdd * P.optSupply * 100, 0) + ' %), soit ' + fmt(P.ppbAdd * v, 0) + " Md€ d'investissement en plus par an. Aucun effet direct sur le déficit : les garanties et un éventuel reclassement en dette publique ne sont pas comptés.", prixbloc: "Montant que le blocage retire aux marges des entreprises et rend aux ménages. Pas de coût budgétaire direct, sauf la TVA perdue. Le risque de pénurie n'est pas modélisé." };
  if (special[l.id]) return esc(special[l.id]);
  if (!l.sens || !l.y) return "Agit sur l'offre de travail.";
  const md = (hasCh(m) && l.unit !== 'Md€') ? Math.abs(+m.chiffre) : Math.abs(v * l.y), good = l.sens * v > 0;
  const sg = l.unit === 'Md€' ? (l.sens > 0 ? ' <span class="note">(valeur positive : hausse du prélèvement)</span>' : ' <span class="note">(valeur positive : hausse de la dépense)</span>') : '';
  return esc(v ? (good ? 'Améliore' : 'Dégrade') + ' le solde public de ' + fmt(md, 1) + ' Md€ par an avant effets économiques' + (l.slow ? ', à terme' : '') + '.' : 'Valeur nulle : sans effet.') + sg;
}
function edWhen(m, at) { return '<label>À partir de<select data-act="mf" data-f="start" ' + at + ' aria-label="Année de départ">' + yearOpts(m.start) + '</select></label><label>Montée en charge<select data-act="mf" data-f="ramp" ' + at + ' aria-label="Montée en charge">' + rampOpts(m.ramp) + '</select></label><label>Jusqu\'en<select data-act="mf" data-f="end" ' + at + ' aria-label="Dernière année"><option value=""' + (m.end ? '' : ' selected') + '>durable</option>' + yearOpts(m.end || 0) + '</select></label>'; }
function edName(m, at) { return '<label style="flex:1;min-width:200px">Intitulé<input type="text" data-act="mf" data-f="nom" ' + at + ' value="' + esc(m.nom || '') + '"></label>'; }
function edBarTable(m, k, at) {
  const rows = m.bar[k], lab = k === 'ir' ? 'Impôt sur le revenu' : 'CSG sur les revenus d\'activité', unit = k === 'ir' ? 'revenu imposable par part, € par an' : 'revenu brut, € par an';
  let h = '<div class="bt"><label class="sw-t"><input type="checkbox" data-act="baron" data-k="' + k + '" ' + at + (rows ? ' checked' : '') + '>' + lab + ' : barème modifié</label>';
  if (!rows) return h + '<p class="note">Barème en vigueur conservé.</p></div>';
  h += '<table><thead><tr><th>À partir de <span class="note">' + unit + '</span></th><th>Taux, %</th><th></th></tr></thead><tbody>' + rows.map((r, j) => '<tr><td><input type="number" data-act="bf" data-k="' + k + '" data-r="' + j + '" data-c="0" ' + at + ' value="' + r[0] + '" step="100" min="0" aria-label="Seuil de la tranche ' + (j + 1) + '"></td><td><input type="number" data-act="bf" data-k="' + k + '" data-r="' + j + '" data-c="1" ' + at + ' value="' + r[1] + '" step="0.1" min="0" max="100" aria-label="Taux de la tranche ' + (j + 1) + '"></td><td><button class="x" data-act="bardel" data-k="' + k + '" data-r="' + j + '" ' + at + ' aria-label="Supprimer la tranche">×</button></td></tr>').join('') + '</tbody></table>';
  return h + '<button class="btn" data-act="baradd" data-k="' + k + '" ' + at + '>Ajouter une tranche</button></div>';
}
function measEditor(m, p, i) {
  const at = 'data-p="' + p.id + '" data-i="' + i + '"', idp = p.id + '-' + i; let h = '';
  if (m.bar) {
    h += '<div class="row">' + edName(m, at) + '</div><div class="row"><button class="btn" data-act="barpreset" data-v="lfi" ' + at + '>Barème LFI à 14 tranches</button><button class="btn" data-act="barpreset" data-v="now" ' + at + '>Barème en vigueur</button></div>' +
      '<div class="grid2">' + edBarTable(m, 'ir', at) + edBarTable(m, 'csg', at) + '</div>' +
      '<div class="row"><label>Aucun perdant sous, € nets par mois<input type="number" data-act="mf" data-f="garde" ' + at + ' value="' + (m.bar.garde || '') + '" step="100" min="0" placeholder="sans garantie"></label>' + edWhen(m, at) + '</div>';
  } else if (m.ass) {
    const a = E.ASS[m.ass] || E.ASSIETTES[0], groups = {}; E.ASSIETTES.forEach(x => (groups[x.g] = groups[x.g] || []).push(x));
    h += '<div class="row">' + edName(m, at) + '<label>Qui est concerné<select data-act="mf" data-f="ass" ' + at + '>' + Object.keys(groups).map(g => '<optgroup label="' + esc(g) + '">' + groups[g].map(x => '<option value="' + x.id + '"' + (x.id === a.id ? ' selected' : '') + '>' + esc(x.nom) + '</option>').join('') + '</optgroup>').join('') + '</select></label></div><div class="row">';
    if (a.seuil) h += '<label>À partir de, ' + a.seuil + '<input type="number" data-act="mf" data-f="lo" ' + at + ' value="' + (m.lo == null ? '' : m.lo) + '" min="0" placeholder="0"></label><label>Jusqu\'à<input type="number" data-act="mf" data-f="hi" ' + at + ' value="' + (m.hi == null ? '' : m.hi) + '" min="0" placeholder="sans plafond"></label>';
    if (a.grp) h += '<label>Champ<select data-act="mf" data-f="grp" ' + at + '>' + a.grp.map(g => '<option value="' + g[0] + '"' + (g[0] === (m.grp || a.grp[0][0]) ? ' selected' : '') + '>' + esc(g[1]) + '</option>').join('') + '</select></label>';
    if (a.kind === 'tax') { h += '<label>Taux, ' + (a.id === 'a_benef' || a.id === 'a_ms' ? 'points' : '%') + '<input type="number" data-act="mf" data-f="taux" ' + at + ' value="' + (m.taux || 0) + '" step="0.1"></label>'; if (a.seuil) h += '<label>Appliqué<select data-act="mf" data-f="marg" ' + at + '><option value="1"' + (m.marg ? ' selected' : '') + '>à la fraction au-dessus du seuil</option><option value="0"' + (m.marg ? '' : ' selected') + '>à la totalité</option></select></label>'; }
    else h += '<label>Montant, € par mois et par personne<input type="number" data-act="mf" data-f="taux" ' + at + ' value="' + (m.taux || 0) + '" step="10"></label>';
    h += '</div><div class="row">' + edWhen(m, at) + '<label>Chiffrage du candidat, Md€<input type="number" data-act="mf" data-f="chiffre" ' + at + ' value="' + (m.chiffre == null ? '' : m.chiffre) + '" step="0.5" placeholder="calcul"></label></div>';
  } else if (m.custom) {
    const ch = E.CUSTOM_CH.find(c => c.id === m.canal) || E.CUSTOM_CH[0], e = m.eff || [50, 100, 100];
    h += '<div class="row">' + edName(m, at) + '<label>Nature de la mesure<select data-act="mf" data-f="canal" ' + at + '>' + E.CUSTOM_CH.map(c => '<option value="' + c.id + '"' + (c.id === m.canal ? ' selected' : '') + '>' + esc(c.nom) + '</option>').join('') + '</select></label></div>' +
      '<div class="row"><label>Effet annoncé, ' + (ch.unit || 'Md€ par an') + '<input type="number" data-act="mf" data-f="montant" ' + at + ' value="' + (m.montant || 0) + '" step="0.5"></label>' +
      ['basse', 'centrale', 'haute'].map((n, k) => '<label>Efficacité ' + n + ', %<input type="number" data-act="mf" data-f="eff' + k + '" ' + at + ' value="' + e[k] + '" step="5" min="0" max="300"></label>').join('') + edWhen(m, at) + '</div>';
  } else {
    const l = E.LEV[m.lever]; if (!l) return '';
    h += (m.nom != null ? '<div class="row">' + edName(m, at) + '</div><p class="note">Levier : ' + esc(l.nom) + '</p>' : '') +
      '<div class="row"><label>Valeur<span class="step"><button data-act="stepm" data-s="-1" ' + at + ' aria-label="Diminuer">−</button><input type="number" id="mv-' + idp + '" data-act="mf" data-f="value" ' + at + ' value="' + (m.value || 0) + '" step="' + l.step + '"><button data-act="stepm" data-s="1" ' + at + ' aria-label="Augmenter">+</button><span class="unit">' + esc(l.unit) + '</span></span></label>' + edWhen(m, at) +
      (l.unit !== 'Md€' && l.y ? '<label>Chiffrage du candidat, Md€<input type="number" data-act="mf" data-f="chiffre" ' + at + ' value="' + (m.chiffre == null ? '' : m.chiffre) + '" step="0.5" placeholder="modèle"></label>' : '') + '</div>';
  }
  return h + '<div class="hint" id="mh-' + idp + '">' + measHint(m) + '</div><div class="row between">' + (m.src && SRC[m.src] ? '<span class="tag src-' + m.src + '">' + SRC[m.src] + '</span>' : '<span></span>') + '<button class="btn danger" data-act="delmeas" ' + at + '>Supprimer la mesure</button></div>';
}

/* ---------- Programmes : mesures cochables, résultat en direct ---------- */
const progColor = id => 'var(--s' + (Math.max(0, state.programmes.findIndex(p => p.id === id)) % 6 + 1) + ')';
// découpe la liste des mesures en rubriques, d'après le champ « sec » de la première mesure de chaque rubrique
function sections(p) {
  const out = []; let cur = null;
  p.measures.forEach((m, i) => { if (m.sec || !cur) { cur = { nom: m.sec || 'Mesures', items: [] }; out.push(cur); } cur.items.push(i); });
  return out;
}
function secHead(p, s, k) {
  const on = s.items.filter(i => !p.measures[i].off), tot = on.reduce((a, i) => a + (measSolde(p.measures[i]) || 0), 0);
  return '<h2>' + esc(s.nom) + '</h2><span class="sm">' + on.length + ' sur ' + s.items.length + ' · effet direct sur le solde ' + sgn(tot, 1) + ' Md€</span><button class="lnk" data-act="sectog" data-p="' + p.id + '" data-k="' + k + '">' + (on.length ? 'Tout décocher' : 'Tout cocher') + '</button>';
}
function refreshSecHeads(p) { sections(p).forEach((s, k) => { const el = document.getElementById('sh-' + p.id + '-' + k); if (el) el.innerHTML = secHead(p, s, k); }); }
function measRow(m, p, i) {
  const key = p.id + '-' + i, t = measTitle(m);
  return '<div class="mrow' + (m.off ? ' off' : '') + '"><input type="checkbox" class="ck" data-act="mtog" data-p="' + p.id + '" data-i="' + i + '"' + (m.off ? '' : ' checked') + ' aria-label="Appliquer la mesure : ' + esc(t) + '">' +
    '<details class="meas" data-m="' + key + '"' + (openM[key] ? ' open' : '') + '><summary><span class="mt">' + esc(t) + (m.src ? '<i class="dot src-' + m.src + '" title="' + SRC[m.src] + '"></i>' : '') + '</span><span class="ms" id="msh-' + key + '">' + esc(measShort(m)) + '</span></summary><div class="mb">' + measEditor(m, p, i) + '</div></details></div>';
}
const KPI = [['gdpG', 'Croissance', '%'], ['u', 'Chômage', '%'], ['solde', 'Solde public', '% du PIB'], ['debt', 'Dette publique', '% du PIB'], ['infl', 'Inflation', '%'], ['pa', 'Pouvoir d\'achat', '% par an']];
function asideHTML(p) {
  const R = RES.progs[p.id], t = ti(state.horizon), c = R.central, ref = RES.env || RES.ref, n = p.measures.length, on = p.measures.filter(m => !m.off).length;
  let h = '<div class="row between"><h2>Résultat en ' + state.horizon + '</h2><span class="note">' + on + ' mesure' + (on > 1 ? 's' : '') + ' cochée' + (on > 1 ? 's' : '') + ' sur ' + n + '</span></div><div class="kpis">' +
    KPI.map(k => { const v = val(c, k[0], t), r = val(ref, k[0], t), a = val(R.pess, k[0], t), b = val(R.opt, k[0], t);
      return '<div class="kpi"><span class="kl">' + k[1] + '</span><span class="kn">' + fmt(v, 1) + '<small> ' + k[2] + '</small></span><span class="kd">' + sgn(v - r, 1) + ' vs réf.</span>' + (Math.abs(a - b) >= 0.05 ? '<span class="kd">de ' + fmt(Math.min(a, b), 1) + ' à ' + fmt(Math.max(a, b), 1) + '</span>' : '') + '</div>'; }).join('') + '</div>' +
    '<div class="kv"><span>Emploi, écart à la référence</span><span>' + sgn(c.empK[t] - ref.empK[t], 0) + ' milliers</span><span>PIB, écart à la référence</span><span>' + sgn((c._idx[t] / ref._idx[t] - 1) * 100, 2) + ' %</span><span>Effet direct sur le solde, avant effets économiques</span><span>' + sgn(c.xRev[t] - c.xSp[t], 1) + ' Md€</span></div>' +
    '<div class="row"><label class="lbl" for="avar">Courbe</label><select id="avar" data-act="avar">' + VARS.map(x => '<option value="' + x.id + '"' + (x.id === state.asideVar ? ' selected' : '') + '>' + esc(x.court || x.nom) + '</option>').join('') + '</select></div><div class="chart" id="achart"></div>' +
    '<p class="note">Trait plein : le programme, avec sa fourchette entre scénario pessimiste et scénario optimiste. Tirets : la référence' + (RES.env ? ' avec chocs' : '') + '. Sous chaque chiffre : l\'écart à la référence, puis la fourchette.</p>' +
    '<div class="row"><a class="btn" href="' + PAGES.synthese + '">Comparer les programmes</a><a class="btn" href="' + PAGES.detail + '">Voir le détail</a></div>';
  return h;
}
function drawAside() {
  const el = $('#achart'), p = prog(state.openProg); if (!el || !p || !RES.progs[p.id]) return;
  const v = VAR[state.asideVar] || VAR.debt, R = RES.progs[p.id], ref = RES.env || RES.ref, vals = X => YEARS.map((y, t) => val(X, v.id, t)), a = vals(R.pess), b = vals(R.opt), c = vals(R.central);
  lineChart(el, { series: [{ name: 'Référence', short: 'Réf.', color: 'var(--s0)', dash: true, vals: vals(ref) }, { name: p.name, short: 'Programme', color: progColor(p.id), vals: c, lo: a.map((x, i) => Math.min(x, b[i], c[i])), hi: a.map((x, i) => Math.max(x, b[i], c[i])) }], dec: v.dec, mark: state.horizon, title: v.nom });
}
// rafraîchit le panneau de résultat et les sous-totaux du programme affiché
function progSummary(id) {
  if (PAGE !== 'programmes' || id !== state.openProg) return; const el = $('#aside'), p = prog(id); if (!el || !p || !RES.progs[id]) return;
  el.innerHTML = asideHTML(p); drawAside(); refreshSecHeads(p);
}
function renderProgrammes() {
  if (!prog(state.openProg)) state.openProg = state.programmes[0] ? state.programmes[0].id : null;
  const p = prog(state.openProg);
  let h = '<section class="pick"><span class="lbl">Programme affiché</span><div class="chips" role="group" aria-label="Programme affiché">' +
    state.programmes.map((x, i) => '<button class="chip" data-act="selprog" data-p="' + x.id + '" aria-pressed="' + (!!p && x.id === p.id) + '"><i class="sw" style="background:var(--s' + (i % 6 + 1) + ')"></i><span>' + esc(x.name || 'Programme') + '</span></button>').join('') +
    '<button class="chip add" data-act="addprog">+ Nouveau programme</button></div></section>';
  if (!p) { $('#view').innerHTML = h + '<section class="card"><p class="note">Aucun programme. Créez-en un pour le comparer à la référence.</p></section>'; return; }
  state.detailScen = p.id;
  h += '<div class="pgrid"><section class="card aside" id="aside" aria-live="polite"></section><div class="pmain">' +
    '<section class="card"><h1 class="ptitle">' + esc(p.name || 'Programme') + '</h1>' + (p.desc ? '<p class="note">' + esc(p.desc) + '</p>' : '') +
    '<p class="note">Cochez ou décochez une mesure : le résultat se recalcule aussitôt. Touchez son intitulé pour voir et modifier son chiffrage. Tout s\'applique au plus tôt en juillet 2027.</p>' +
    (p.measures.some(m => m.src) ? '<p class="note"><i class="dot src-c"></i>chiffré par le candidat <i class="dot src-m"></i>mesure du candidat, effet calculé par la maquette <i class="dot src-e"></i>ordre de grandeur de la maquette</p>' : '') + '</section>';
  sections(p).forEach((s, k) => { h += '<section class="card secbox"><div class="sech" id="sh-' + p.id + '-' + k + '">' + secHead(p, s, k) + '</div>' + s.items.map(i => measRow(p.measures[i], p, i)).join('') + '</section>'; });
  const groups = {}; E.LEVERS.forEach(l => (groups[l.g] = groups[l.g] || []).push(l));
  h += '<details class="card manage"' + (p.measures.length ? '' : ' open') + '><summary>Modifier le programme : nom, nouvelles mesures, copie</summary><div class="progbody">' +
    '<div class="row"><label class="lbl" for="pn-' + p.id + '">Nom</label><input type="text" id="pn-' + p.id + '" data-act="pname" data-p="' + p.id + '" value="' + esc(p.name) + '" style="flex:1;min-width:180px"></div>' +
    '<p class="note">Une mesure nouvelle peut être un levier du catalogue, une mesure définie par son assiette (qui est concerné, à quel taux), un barème d\'impôt sur le revenu et de CSG, ou une mesure libre évaluée par une fourchette d\'efficacité.</p>' +
    '<div class="row"><select id="add-' + p.id + '" aria-label="Levier à ajouter"><option value="">Ajouter un levier…</option>' + Object.keys(groups).map(g => '<optgroup label="' + esc(g) + '">' + groups[g].map(l => '<option value="' + l.id + '">' + esc(l.nom) + ' (' + esc(l.unit) + ')</option>').join('') + '</optgroup>').join('') + '</select><button class="btn" data-act="addmeas" data-p="' + p.id + '">Ajouter</button></div>' +
    '<div class="row"><button class="btn" data-act="addass" data-p="' + p.id + '">Mesure par assiette</button><button class="btn" data-act="addbar" data-p="' + p.id + '">Barème impôt sur le revenu et CSG</button><button class="btn" data-act="addcustom" data-p="' + p.id + '">Mesure libre</button></div>' +
    '<div class="row"><button class="btn" data-act="dupprog" data-p="' + p.id + '">Dupliquer le programme</button>' + (ORIGIN[p.id] ? '<button class="btn" data-act="resetprog" data-p="' + p.id + '">Rétablir la version d\'origine</button>' : '') + '<button class="btn danger" data-act="delprog" data-p="' + p.id + '">Supprimer le programme</button></div></div></details>';
  h += '</div></div>';
  $('#view').innerHTML = h; progSummary(p.id);
}

/* ---------- Chocs et pilotage ---------- */
function renderChocs() {
  let h = '<section class="card"><h2>Pilotage direct</h2><p class="note">Ces réglages modifient l\'environnement de tous les programmes. Le taux de la BCE est entièrement entre vos mains : le modèle ne le fait pas réagir à l\'inflation.</p>';
  E.PILOT.forEach(k => { const v = state.pilot[k.id], base = k.abs ? state.params[k.abs] : 0, mod = Math.abs(v - base) > 1e-9;
    h += '<div class="param' + (mod ? ' mod' : '') + '" id="pp-' + k.id + '"><span class="name">' + esc(k.nom) + '</span><span class="num" id="pv-' + k.id + '">' + (k.abs ? fmt(v, 2) : sgn(v, k.step < 1 ? (k.step < 0.1 ? 2 : 1) : 0)) + ' ' + k.unit + '</span><input type="range" id="pr-' + k.id + '" data-act="pilot" data-k="' + k.id + '" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + v + '" aria-label="' + esc(k.nom) + '"><span class="help"><label>à partir de <select id="pf-' + k.id + '" data-act="pfrom" data-k="' + k.id + '" style="min-height:30px;padding:2px 6px">' + yearOpts(state.pilot.from[k.id]) + '</select></label> · <button class="btn ghost" style="min-height:28px;padding:2px 8px" data-act="preset" data-k="' + k.id + '">remettre à ' + (k.abs ? fmt(base, 2) + ' %' : 'zéro') + '</button></span></div>'; });
  h += '</section><section class="card"><h2>Chocs exogènes</h2><p class="note">Activez un choc, choisissez son année et son intensité. Plusieurs chocs peuvent se cumuler.</p><div class="grid2">';
  state.shocks.forEach(s => { const d = E.SHOCKS.find(x => x.id === s.id);
    h += '<div class="shock' + (s.on ? ' on' : '') + '"><label class="sw-t"><input type="checkbox" id="so-' + s.id + '" data-act="shon" data-id="' + s.id + '"' + (s.on ? ' checked' : '') + '>' + esc(d.nom) + '</label><span class="note">' + esc(d.desc) + '</span><div class="row"><div class="seg" role="group" aria-label="Intensité">' + d.lv.map((n, i) => '<button data-act="shlv" data-id="' + s.id + '" data-l="' + i + '" aria-pressed="' + (s.level === i) + '">' + esc(n) + '</button>').join('') + '</div><label class="note">en <select id="sy-' + s.id + '" data-act="shyr" data-id="' + s.id + '" style="min-height:34px">' + yearOpts(s.year) + '</select></label></div></div>'; });
  h += '</div></section><section class="card"><h2>Règles européennes</h2><label class="sw-t"><input type="checkbox" id="sanc" data-act="sanc"' + (state.sanctions ? ' checked' : '') + '>Déclencher les sanctions dans le modèle</label><p class="note">Les alertes s\'affichent toujours dans la page Comparer. Case cochée, un déficit supérieur à 3 % du PIB sans effort budgétaire d\'au moins 0,5 point de PIB dans l\'année entraîne, l\'année suivante, une amende et une hausse de l\'écart de taux. Les deux montants se règlent dans la page Réglages, en mode expert.</p></section>';
  $('#view').innerHTML = h;
}

/* ---------- Réglages ---------- */
const pdec = p => p.step >= 1 ? 0 : p.step >= 0.1 ? 1 : p.step >= 0.01 ? 2 : 3;
function renderReglages() {
  const simple = state.mode === 'simple', list = E.PARAMS.filter(p => !simple || p.simple), groups = {};
  list.forEach(p => (groups[p.group] = groups[p.group] || []).push(p));
  let h = '<section class="card"><div class="row between"><h2>Réglages du modèle</h2><div class="seg"><button data-act="pmode" data-m="simple" aria-pressed="' + simple + '">Simple</button><button data-act="pmode" data-m="expert" aria-pressed="' + !simple + '">Expert</button></div></div><p class="note">' + (simple ? 'Les ' + list.length + ' réglages qui pèsent le plus. Le mode expert ouvre les ' + E.PARAMS.length + ' paramètres.' : 'Tous les paramètres : élasticités, délais, indexations, fourchettes.') + '</p><div class="row"><button class="btn" data-act="resetp">Rétablir les valeurs par défaut</button></div></section>';
  h += '<section class="card"><h2>Multiplicateurs obtenus avec ces réglages</h2><div class="scroll"><table><thead><tr><th>Effet sur le PIB, en %</th><th>1re année</th><th>2e année</th><th>5e année</th></tr></thead><tbody id="mult"></tbody></table></div><p class="note">Chaque ligne est un test : la mesure est appliquée seule en 2028 et son effet sur le niveau du PIB est lu un, deux et cinq ans plus tard.</p></section><div class="grid2">';
  Object.keys(groups).forEach(g => { h += '<section class="card"><h3>' + esc(g) + '</h3><div>' + groups[g].map(p => { const v = state.params[p.id]; return '<div class="param' + (Math.abs(v - p.def) > 1e-9 ? ' mod' : '') + '" id="q-' + p.id + '"><span class="name">' + esc(p.label) + '</span><span class="num" id="qv-' + p.id + '">' + fmt(v, pdec(p)) + '</span><input type="range" id="qr-' + p.id + '" data-act="param" data-k="' + p.id + '" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" value="' + v + '" aria-label="' + esc(p.label) + '">' + (p.help ? '<span class="help">' + esc(p.help) + '</span>' : '') + '</div>'; }).join('') + '</div></section>'; });
  h += '</div>'; $('#view').innerHTML = h; drawMult();
}
function drawMult() { const el = $('#mult'); if (!el) return; el.innerHTML = E.multipliers(state.params).map(m => '<tr><td>' + esc(m.nom) + '</td>' + m.v.map(x => '<td>' + sgn(x, 2) + '</td>').join('') + '</tr>').join(''); }

/* ---------- Scénarios : enregistrés dans ce navigateur, transmis par copier-coller ---------- */
const localList = () => { try { return JSON.parse(localStorage.getItem('maquette-fr-scenarios') || '[]'); } catch (e) { return []; } };
const saveLocal = l => { try { localStorage.setItem('maquette-fr-scenarios', JSON.stringify(l)); return true; } catch (e) { return false; } };
const db = null, share = { mode: 'local', list: localList(), can: null, names: {} };
function renderScenarios() {
  const shared = share.mode === 'partage';
  let h = '<section class="card"><h2>Enregistrer le scénario en cours</h2><p class="note">Un scénario contient les programmes, les chocs, le pilotage et les réglages. ' + (shared ? 'Il est enregistré avec cette page : les personnes à qui vous la partagez voient la même liste, et peuvent y ajouter les leurs si elles ont le droit de contribuer.' : share.mode === 'attente' ? 'Connexion à l\'espace partagé en cours…' : 'Il est enregistré sur cet appareil, dans ce navigateur. Pour le transmettre à quelqu\'un, utilisez Copier, plus bas.') + '</p>' +
    (share.slow ? '<p class="note">La liste partagée met du temps à répondre ; elle peut être incomplète.</p>' : '') + (share.can === false ? '<p class="note">Vous consultez cette page en lecture seule : vous pouvez charger les scénarios, pas en enregistrer.</p>' : '') +
    '<div class="row"><input type="text" id="scname" placeholder="Nom du scénario" style="flex:1;min-width:180px" aria-label="Nom du scénario"><button class="btn primary" data-act="scsave"' + (share.can === false || share.mode === 'attente' ? ' disabled' : '') + '>Enregistrer</button></div><p class="note" id="scmsg" role="status"></p></section>';
  h += '<section class="card"><h2>Scénarios enregistrés</h2>' + (share.list.length ? share.list.map(s => '<div class="sc"><div><b>' + esc(s.name) + '</b><div class="m">' + esc(new Date(s.at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })) + (s.by && share.names[s.by] ? ' · ' + esc(share.names[s.by]) : '') + '</div></div><div class="row"><button class="btn" data-act="scload" data-id="' + esc(s.id) + '">Charger</button><button class="btn danger" data-act="scdel" data-id="' + esc(s.id) + '"' + (share.can === false ? ' disabled' : '') + '>Supprimer</button></div></div>').join('') : '<p class="note">Aucun scénario enregistré pour l\'instant.</p>') + '</section>';
  h += '<section class="card"><h2>Copier ou importer</h2><p class="note">Pour transmettre un scénario par message, copiez-le, puis collez-le dans la zone ci-dessous sur l\'autre appareil.</p><div class="row"><button class="btn" data-act="sccopy">Copier le scénario en cours</button><button class="btn" data-act="scimport">Charger le texte collé</button><button class="btn danger" data-act="scfresh">Repartir de zéro</button></div><textarea id="scjson" rows="4" style="width:100%" aria-label="Scénario au format texte" placeholder="Collez ici un scénario copié"></textarea></section>';
  $('#view').innerHTML = h;
}
async function scSave() {
  const name = ($('#scname').value || '').trim() || 'Scénario du ' + new Date().toLocaleDateString('fr-FR'), msg = $('#scmsg');
  const doc = { name, at: new Date().toISOString(), by: share.uid || '', data: JSON.stringify(snapshot()) };
  if (share.mode === 'partage') { try { await db.collection('scenarios').doc().set(doc); msg.textContent = 'Scénario enregistré et partagé.'; } catch (e) { if (e && e.code === 'invalid_argument') { share.can = false; } msg.textContent = 'Enregistrement refusé : ' + (e && e.code === 'invalid_argument' ? 'vous n\'avez pas le droit d\'écrire sur cette page.' : 'l\'espace partagé ne répond pas, réessayez.'); } }
  else { const l = localList(); l.unshift(Object.assign({ id: uid() }, doc)); if (saveLocal(l)) { share.list = l; renderScenarios(); $('#scmsg').textContent = 'Scénario enregistré sur cet appareil.'; } else msg.textContent = 'Enregistrement impossible sur cet appareil : utilisez Copier.'; }
}

const METH_EXTRA = `<section class="card"><h2>Consommation par dixième de niveau de vie</h2><p class="note">Chaque dixième des ménages dépense une part différente d'un euro de revenu supplémentaire : 98 % pour le premier, puis 95, 91, 87, 82, 76, 69, 60, 48 et 28 % pour le dernier. Le coefficient multiplicateur rapproche ces parts de 100 % sans jamais les dépasser : avec sa valeur par défaut, elles passent à 99, 98, 96, 93, 89, 84, 78, 70, 57 et 35 %. Les trois premiers dixièmes dépensent dans l'année ; les suivants étalent, le dernier sur deux ans environ. Ces valeurs sont des ordres de grandeur tirés des enquêtes de budget, pas une mesure officielle.</p></section>
<section class="card"><h2>Mesures par assiette et barèmes</h2><p class="note">Une mesure par assiette part de la population visée et d'un taux : le modèle en déduit le nombre de personnes, l'assiette et le rendement, puis répartit l'effet entre dixièmes. Il s'appuie sur des distributions reconstituées, calées sur les masses du modèle : 30,7 millions d'actifs (salaire net médian autour de 2 300 € par mois, 4 600 € au neuvième décile, 11 000 € au dernier centième), 17,2 millions de retraités, 31 millions de ménages pour le patrimoine (dont 1 800 au-dessus de 100 M€, qui détiendraient 1 450 Md€) et 1,5 million d'héritiers par an. Le sommet de la distribution des patrimoines et celle des héritages sont les parties les plus fragiles.</p><p class="note">Le rendement affiché est mécanique : il ne tient pas compte des réactions des contribuables. Le scénario pessimiste n'en retient que la part réglée dans les fourchettes ; le chiffrage du candidat, quand il est saisi, remplace le calcul.</p></section>
<section class="card"><h2>Programme LFI : ce qui vient d'où</h2><ul class="src"><li><b>Chiffré par le candidat</b> : les lignes du contre-budget 2027, soit 81,7 Md€ de dépenses et 106,4 Md€ de recettes. La répartition des 22 Md€ de niches entre ménages et entreprises est de la maquette.</li><li><b>Impôt sur le revenu</b> : barème à 14 tranches de l'amendement déposé en 2021, de 1 % dès le premier euro à 90 % au-delà de 411 683 € par part, seuils non revalorisés. Le barème de CSG à 14 tranches n'a jamais été publié : celui de la maquette est construit pour que tout salarié seul paie moins sous 4 000 € nets par mois et que l'ensemble rapporte environ 5,5 Md€, chiffre avancé en 2024. Une garantie neutralise les pertes sous 4 000 €.</li><li><b>SMIC à 1 700 €</b> : +15 % par rapport aux 1 477,93 € nets de novembre 2026. L'effet sur l'emploi est calé sur l'estimation d'Éric Heyer (OFCE) pour un SMIC à 1 600 € en 2024 : destructions liées au coût, compensées presque entièrement par la demande et par le gonflement des allègements de cotisations.</li><li><b>Pôle public bancaire</b> : 100 Md€ de financements en plus par an, hors budget selon le projet. La maquette n'en retient que 40 % comme investissement réellement additionnel.</li><li><b>Ordres de grandeur de la maquette</b> : blocage des prix (15 Md€ pris sur les marges ; au prix actuel du carburant, l'écart avec 1,70 € représente plutôt 20 Md€ par an), fin des exonérations au-dessus de 2 SMIC (6 Md€), seconde étape vers la retraite à 60 ans et 40 annuités (27 Md€ à terme), durée du travail (−3 %), garantie d'emploi (300 000 postes), recrutements publics (200 000), garantie d'autonomie étendue (15 Md€), 100 % Sécu (12 Md€), fraude (8 Md€ de plus).</li><li><b>Non modélisé</b> : annulation ou gel de la dette détenue par la BCE, circuit du Trésor, renationalisations, contrôle des capitaux, écart de salaires de 1 à 20, transfert des cotisations des complémentaires santé vers la Sécurité sociale, réforme de la caisse d'amortissement de la dette sociale.</li></ul></section>`;
const METH_RN = `<section class="card"><h2>Programme RN : ce qui vient d'où</h2><ul class="src"><li><b>Chiffré par le parti</b> : les postes de la trajectoire 2027-2032 du 6 octobre 2026, dans leur montant de 2031 : 49,1 Md€ de baisses d'impôts, 136,7 Md€ d'amélioration nette du solde hors mesures du budget 2027 conservées. Le document n'étant pas en ligne, les montants viennent de la retranscription de l'Institut de l'Entreprise.</li><li><b>Ventilation de la maquette</b> : les lignes « solde du poste ». Le plan donne le total de chaque poste et quelques mesures ; le reste est réparti ici entre fonctionnement, prestations et aides. Les économies sur les prestations pèsent sur le revenu des ménages concernés, celles sur le fonctionnement sur la demande publique.</li><li><b>Budget 2027</b> : la référence contient déjà les mesures du gouvernement. Le RN n'en conserve que 3,6 Md€ ; les 24,4 Md€ restants sont donc annulés dans le programme, pour moitié en impôts, pour moitié en prestations (hypothèse).</li><li><b>Retraites</b> : en 2024, abrogation de la réforme et départ à 60 ans après 40 annuités pour les carrières commencées avant 20 ans ; en 2026, âge légal de 62 ans, 60 ans pour les carrières longues, 42 annuités, 9,5 Md€. La seconde version est retenue.</li><li><b>Ordres de grandeur de la maquette</b> : solde migratoire réduit de 100 000 par an, hausses de salaires exonérées (0,8 Md€, chiffrage de l'Institut Montaigne en 2024).</li><li><b>Non modélisé</b> : règle d'or constitutionnelle, pilier de retraite par capitalisation, fonds souverain, renationalisation des autoroutes, préférence nationale dans les marchés publics, protectionnisme ciblé, réaction des partenaires européens à une baisse unilatérale de la contribution.</li><li><b>Évaluations extérieures</b> : l'Institut de l'Entreprise ne retient qu'environ 7,5 Md€ d'amélioration nette en 2031, contre 141,7 Md€ affichés. Le scénario pessimiste de la maquette, lui, retient 75 % des économies, comme pour les autres programmes.</li></ul></section>`;
const METH_SRC = `<li><a href="https://www.institut-entreprise.fr/wp-content/uploads/2026/10/Analyse-primaire-contre-budget-RN-Note-de-contexte-IDEP.pdf">Institut de l'Entreprise, note du 6 octobre 2026</a> : retranscription et évaluation du plan du RN</li><li><a href="https://www.institutmontaigne.org/legislatives-2024/rassemblement-national/synthese">Institut Montaigne, chiffrage du programme RN des législatives 2024</a></li><li><a href="https://www.francetransactions.com/actus/actualites-socio-economiques/proposition-rn-budget-2027.html">France Transactions</a> et <a href="https://www.lagazettedescommunes.com/etat-et-collectivites/reformes-institutionnelles/parlement/plf-2027-le-contre-budget-du-rn-fait-bondir-les-elus-locaux.2DUUXNFQD5G5HA2QPBP46EVQLE.html">La Gazette des communes</a> : postes publics, collectivités</li><li><a href="https://melenchon2027.fr/programme/livre/">L'Avenir en commun, programme 2027</a>, et deux documents de campagne transmis : contre-budget 2027, pôle public bancaire</li><li><a href="https://www.toutsurmesfinances.com/impots/programme-nouveau-front-populaire-impots.html">Tout sur mes finances</a> : barème à 14 tranches de l'amendement LFI</li><li><a href="https://www.institutmontaigne.org/presidentielle-2022/jean-luc-melenchon/rendre-la-csg-progressive-sur-14-tranches/">Institut Montaigne, chiffrage 2022 de la CSG progressive</a></li><li><a href="https://desintox.lafranceinsoumise.fr/vous-voulez-augmenter-les-impots/">La France insoumise</a> : seuil de 4 000 € nets</li><li><a href="https://www.moneyvox.fr/votre-argent/actualites/98673/smic-a-1-600-euros-les-pour-et-les-contre">MoneyVox</a> : estimation OFCE de l'effet d'un SMIC à 1 600 €</li><li><a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F1419">Service-public.fr</a> : barème 2026 de l'impôt sur le revenu</li><li><a href="https://www.toutsurmesfinances.com/argent/a/smic-brut-net-montants-taux-et-revalorisation">Tout sur mes finances</a> : SMIC net depuis juin 2026</li>`;
/* ---------- Méthode ---------- */
function renderMethode() {
  $('#view').innerHTML = '<section class="card"><h2>Ce que fait le modèle</h2><p class="note">Un modèle néo-keynésien annuel, calculé en écart à une trajectoire de référence. À court terme l\'activité dépend de la demande : consommation par dixième de niveau de vie, investissement, dépense publique, commerce extérieur. Les prix et les salaires s\'ajustent progressivement selon le chômage ; la compétitivité et l\'offre (capital, population active, productivité) ramènent ensuite l\'économie vers son potentiel. La croissance de fond n\'est pas calculée par le modèle : elle est posée, comme la somme de la croissance de la population active et des gains de productivité, corrigée du prix de l\'énergie, avec un rattrapage spontané que l\'on peut couper. Chaque mesure et chaque choc entre comme une impulsion, puis le modèle boucle : revenus, emploi, prix, recettes, dépenses, intérêts, dette, taux.</p>' +
    '<p class="note">La référence part du projet de budget pour 2027 (croissance de 1,0 %, ramenée ici à 0,8 % pour se rapprocher des prévisions indépendantes) : inflation de 1,8 %, déficit de 5,0 % du PIB, dette de 121,7 %, dépenses publiques à 56,9 % du PIB, prélèvements à 44,2 %, charge d\'intérêts de 91,2 Md€. Après 2027 elle prolonge la politique en place, sans réforme : la dépense primaire suit sa tendance et la dette se renouvelle aux taux de marché.</p>' +
    '<p class="note">Trois lectures par programme : le chiffrage central reprend les montants du candidat ; le scénario pessimiste réduit les recettes et les économies obtenues, gonfle les coûts, affaiblit les effets d\'offre et rend les marchés plus nerveux ; le scénario optimiste fait l\'inverse.</p></section>' +
    '<section class="card"><h2>Limites à garder en tête</h2><ul class="src"><li>C\'est une maquette, pas l\'équivalent des modèles du Trésor, de la Banque de France ou de l\'OFCE. Les élasticités viennent des ordres de grandeur publiés, pas d\'une estimation économétrique propre.</li><li>La ventilation par administration, par secteur, par taille d\'entreprise et par dixième de revenu repose sur des clés de répartition approchées.</li><li>Les rendements par défaut des leviers (un point de TVA, un point de CSG…) sont des ordres de grandeur à vérifier mesure par mesure.</li><li>Les résultats à dix ans indiquent une direction, pas une prévision.</li><li>Le plafond européen de dépense est un paramètre à ajuster selon la trajectoire négociée avec la Commission.</li><li>La BCE ne réagit pas d\'elle-même à l\'inflation : un programme qui fait monter les prix n\'est freiné par les taux que si vous les relevez dans la page Chocs et pilotage.</li></ul></section>' + METH_EXTRA + METH_RN +
    '<section class="card"><h2>Sources du calage</h2><ul class="src">' +
    '<li><a href="https://www.economie.gouv.fr/actualites/video-presentation-du-projet-de-budget-pour-2027">Ministère de l\'Économie, présentation du projet de budget pour 2027</a> : croissance, déficit, dépenses, charge d\'intérêts</li>' +
    '<li><a href="https://www.touteleurope.eu/economie-et-social/budget-2027-ce-qu-il-faut-retenir-des-mesures-annoncees-par-le-gouvernement-lecornu/">Toute l\'Europe, budget 2027</a> : déficit 2025 et 2026, dette 2026 et 2027</li>' +
    '<li><a href="https://www.legifiscal.fr/actualites-fiscales/4656-presentation-plf-2027.html">LégiFiscal, principales mesures du projet de loi de finances</a> : prélèvements obligatoires, dépenses publiques</li>' +
    '<li><a href="https://www.senat.fr/lessentiel/plfss2027.pdf">Sénat, l\'essentiel sur le budget de la Sécurité sociale 2027</a> et <a href="https://www.politiquematin.fr/plfss-2027-senat-transmission-deficit-127-milliards-20261103-0036">PolitiqueMatin</a> : soldes et dépenses par branche</li>' +
    '<li><a href="https://www.insee.fr/fr/statistiques/9039499">Insee, comptes trimestriels du 2e trimestre 2026</a> : taux de marge, acquis de croissance</li>' +
    '<li><a href="https://www.insee.fr/fr/statistiques/9032359">Insee, chômage au 2e trimestre 2026</a> : 8,3 %</li>' +
    '<li><a href="https://www.insee.fr/fr/statistiques/fichier/version-html/9107965/IR266_IPCprov_oct26.pdf">Insee, prix à la consommation, octobre 2026</a></li>' +
    '<li><a href="https://www.top10banques.com/guides/bce-taux-inchanges-a-250-et-christine-lagarde-annonce-son-depart-pour-le-7-fevrier-2027">Décision de la BCE du 29 octobre 2026</a> : taux de dépôt à 2,50 %</li>' +
    '<li><a href="https://fr.euronews.com/2026/10/01/budget-2027-le-gouvernement-propose-un-effort-de-54-milliards-deuros-pour-ramener-le-defic">Euronews</a> : prévisions de croissance de la Banque de France et de l\'OFCE</li>' + METH_SRC +
    '</ul><p class="note">Taux d\'emprunt à 10 ans de référence : 4,7 %, soit 3,5 % pour l\'Allemagne et 1,2 point d\'écart, niveaux d\'octobre 2026 arrondis ; ils se modifient dans les réglages. Données relevées les 10 et 11 novembre 2026.</p></section>';
}


/* ---------- Page de garde ---------- */
function coverCta() {
  const a = $('#cover-cta'); if (!a) return; const on = state.programmes.filter(p => isCand(p) && state.shown.includes(p.id));
  a.href = on.length === 1 ? PAGES.programmes + '#' + on[0].id : on.length > 1 ? PAGES.synthese : PAGES.programmes;
}
function renderAccueil() {
  const box = $('#cover-progs'); if (!box) return;
  box.innerHTML = state.programmes.filter(isCand).map(p => '<label class="cand"><input type="checkbox" data-act="cshow" data-id="' + p.id + '"' + (state.shown.includes(p.id) ? ' checked' : '') + '><span class="cn">' + COVER_NAME[p.id] + '</span><span class="ct">extrapolation</span></label>').join('') +
    '<label class="cand soon"><input type="checkbox" disabled><span class="cn">Autres candidats</span><span class="ct">à venir</span></label>';
  coverCta();
}

/* ---------- Bandeau de résultat ---------- */
function liveBar() {
  const el = $('#live'), show = ['programmes', 'chocs', 'reglages'].includes(state.tab); el.style.display = show ? 'block' : 'none'; if (!show) return;
  const id = state.tab === 'programmes' && RES.progs[state.openProg] ? state.openProg : (state.shown.find(x => RES.progs[x]) || (RES.env ? 'env' : 'ref'));
  const s = scenList().find(x => x.id === id), R = getR(id).central, t = ti(state.horizon), ref = RES.ref;
  const it = (k, l, dec) => '<span><span class="k">' + l + '</span> <b>' + fmt(val(R, k, t), dec) + '</b>' + (id !== 'ref' ? ' <span class="k">(' + sgn(val(R, k, t) - val(ref, k, t), dec) + ')</span>' : '') + '</span>';
  $('.in', el).innerHTML = '<span class="hd">' + swatch(s) + '<b>' + esc(s.name) + '</b> · ' + state.horizon + '</span>' + it('gdpG', 'Croissance', 1) + it('u', 'Chômage', 1) + it('solde', 'Solde', 1) + it('debt', 'Dette', 1) + it('infl', 'Inflation', 1);
}

/* ---------- Navigation et événements ---------- */
const RENDER = { accueil: renderAccueil, synthese: renderSynthese, detail: renderDetail, programmes: renderProgrammes, chocs: renderChocs, reglages: renderReglages, scenarios: renderScenarios, methode: renderMethode };
function render() { const ys = $('#year'); if (ys) ys.value = state.horizon; RENDER[PAGE](); if ($('#live')) liveBar(); }
function rerenderIf(tab) { if (PAGE === tab) render(); }
// chaque section est une page : changer de section, c'est changer de page (l'état est enregistré avant)
function go(tab) { state.tab = PAGE; persist(); if (tab === PAGE) { render(); window.scrollTo(0, 0); } else location.href = PAGES[tab] || PAGES.synthese; }
let timer = null; const soon = fn => { clearTimeout(timer); timer = setTimeout(fn, 60); };
const prog = id => state.programmes.find(p => p.id === id);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.tagName === 'TEXTAREA') return; const a = b.dataset.act, d = b.dataset;
  if (a === 'horizon') { state.horizon = +d.y; render(); persist(); }
  else if (a === 'show') { const i = state.shown.indexOf(d.id); if (i >= 0) state.shown.splice(i, 1); else { if (state.shown.filter(x => x !== 'env').length >= 4 && d.id !== 'env') state.shown.splice(state.shown.findIndex(x => x !== 'env'), 1); state.shown.push(d.id); } render(); persist(); }
  else if (a === 'mode') { state.chartMode = d.m; render(); persist(); }
  else if (a === 'dtab') { state.detailTab = d.d; render(); persist(); }
  else if (a === 'secmode') { state.secMode = d.m; render(); }
  else if (a === 'pmode') { state.mode = d.m; render(); persist(); }
  else if (a === 'resetp') { state.params = E.defaultParams(); recompute(); render(); }
  else if (a === 'addprog') { const p = { id: uid(), name: 'Programme ' + (state.programmes.length + 1), measures: [] }; state.programmes.push(p); state.openProg = p.id; if (state.shown.filter(x => x !== 'env').length < 4) state.shown.push(p.id); recompute(); render(); }
  else if (a === 'dupprog') { const p = prog(d.p), c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.name = p.name + ' (copie)'; state.programmes.push(c); state.openProg = c.id; recompute(); render(); }
  else if (a === 'delprog') { state.programmes = state.programmes.filter(p => p.id !== d.p); state.shown = state.shown.filter(x => x !== d.p); recompute(); render(); }
  else if (a === 'addmeas') { const sel = document.getElementById('add-' + d.p); if (sel && sel.value) { const P2 = prog(d.p); P2.measures.push({ lever: sel.value, value: 0, start: 2027, ramp: 1 }); openM[d.p + '-' + (P2.measures.length - 1)] = true; state.openProg = d.p; recompute(); render(); } }
  else if (a === 'addcustom') { const P2 = prog(d.p); P2.measures.push({ custom: 1, nom: '', canal: 'c_revmen', montant: 10, eff: [30, 60, 100], start: 2028, ramp: 2 }); openM[d.p + '-' + (P2.measures.length - 1)] = true; state.openProg = d.p; recompute(); render(); }
  else if (a === 'addass') { const P2 = prog(d.p); P2.measures.push({ ass: 'a_rev', nom: '', lo: 4000, hi: null, taux: 1, marg: 1, start: 2028, ramp: 1 }); openM[d.p + '-' + (P2.measures.length - 1)] = true; state.openProg = d.p; recompute(); render(); }
  else if (a === 'addbar') { const P2 = prog(d.p); P2.measures.push({ bar: { ir: copyBar(E.MICRO.IR_LFI), csg: copyBar(E.MICRO.CSG_LFI), garde: 4000 }, nom: '', start: 2028, ramp: 1 }); openM[d.p + '-' + (P2.measures.length - 1)] = true; state.openProg = d.p; recompute(); render(); }
  else if (a === 'barpreset') { const m = prog(d.p).measures[+d.i]; if (d.v === 'lfi') m.bar = { ir: copyBar(E.MICRO.IR_LFI), csg: copyBar(E.MICRO.CSG_LFI), garde: 4000 }; else m.bar = { ir: copyBar(E.MICRO.IR_NOW), csg: null, garde: null }; state.openProg = d.p; recompute(); render(); }
  else if (a === 'baradd') { const m = prog(d.p).measures[+d.i], r = m.bar[d.k], last = r[r.length - 1] || [0, 0]; r.push([Math.round(last[0] * 1.5 / 1000) * 1000 || 10000, last[1]]); state.openProg = d.p; recompute(); render(); }
  else if (a === 'bardel') { const m = prog(d.p).measures[+d.i]; m.bar[d.k].splice(+d.r, 1); if (!m.bar[d.k].length) m.bar[d.k] = null; state.openProg = d.p; recompute(); render(); }
  else if (a === 'delmeas') { const ms = prog(d.p).measures, n = ms.length; ms.splice(+d.i, 1); for (let k = +d.i; k < n; k++) { openM[d.p + '-' + k] = openM[d.p + '-' + (k + 1)]; } delete openM[d.p + '-' + (n - 1)]; state.openProg = d.p; recompute(); render(); }
  else if (a === 'stepm') { const m = prog(d.p).measures[+d.i], l = E.LEV[m.lever]; m.value = +((+m.value || 0) + (+d.s) * l.step).toFixed(4); const inp = document.getElementById('mv-' + d.p + '-' + d.i); if (inp) inp.value = m.value; afterMeasure(d.p, +d.i); }
  else if (a === 'shlv') { const s = state.shocks.find(x => x.id === d.id); s.level = +d.l; recompute(); render(); }
  else if (a === 'preset') { const k = E.PILOT.find(x => x.id === d.k); state.pilot[k.id] = k.abs ? state.params[k.abs] : 0; recompute(); render(); }
  else if (a === 'scsave') scSave();
  else if (a === 'scload') { const s = share.list.find(x => x.id === d.id); if (s) { try { loadSnapshot(JSON.parse(s.data)); } catch (err) { } } }
  else if (a === 'scdel') { if (share.mode === 'partage') { db.collection('scenarios').doc(d.id).delete().catch(() => { const m = $('#scmsg'); if (m) m.textContent = 'Suppression refusée.'; }); } else { const l = localList().filter(x => x.id !== d.id); saveLocal(l); share.list = l; render(); } }
  else if (a === 'sccopy') { const txt = JSON.stringify(snapshot()), ta = $('#scjson'); ta.value = txt; ta.select(); try { navigator.clipboard.writeText(txt).then(() => { $('#scmsg').textContent = 'Scénario copié.'; }, () => { $('#scmsg').textContent = 'Copie automatique refusée : le texte est sélectionné ci-dessous, copiez-le à la main.'; }); } catch (err) { $('#scmsg').textContent = 'Le texte est sélectionné ci-dessous, copiez-le à la main.'; } }
  else if (a === 'scimport') { try { loadSnapshot(JSON.parse($('#scjson').value)); } catch (err) { $('#scmsg').textContent = 'Texte illisible : collez un scénario copié depuis cette page.'; } }
  else if (a === 'scfresh') { const keep = state.tab; state = defaultState(); state.programmes = []; state.shown = []; state.detailScen = 'ref'; recompute(); go('programmes'); }
});
function afterMeasure(pid, i) { state.openProg = pid; soon(() => { recompute(); const m = prog(pid).measures[i], el = document.getElementById('mh-' + pid + '-' + i), sh = document.getElementById('msh-' + pid + '-' + i); if (el && m) el.innerHTML = measHint(m); if (sh && m) sh.textContent = measShort(m); progSummary(pid); liveBar(); }); }
document.addEventListener('input', e => {
  const b = e.target; if (!b.dataset || !b.dataset.act) return; const a = b.dataset.act, d = b.dataset;
  if (a === 'param') { const p = E.PARAMS.find(x => x.id === d.k); state.params[d.k] = +b.value; $('#qv-' + d.k).textContent = fmt(+b.value, pdec(p)); $('#q-' + d.k).classList.toggle('mod', Math.abs(+b.value - p.def) > 1e-9); soon(() => { recompute(); drawMult(); liveBar(); }); }
  else if (a === 'pilot') { const k = E.PILOT.find(x => x.id === d.k), v = +b.value; state.pilot[d.k] = v; $('#pv-' + d.k).textContent = (k.abs ? fmt(v, 2) : sgn(v, k.step < 1 ? (k.step < 0.1 ? 2 : 1) : 0)) + ' ' + k.unit; $('#pp-' + d.k).classList.toggle('mod', Math.abs(v - (k.abs ? state.params[k.abs] : 0)) > 1e-9); soon(() => { recompute(); liveBar(); }); }
  else if (a === 'mf' && b.tagName === 'INPUT') { setMeasure(b); }
  else if (a === 'bf') { const m = prog(d.p).measures[+d.i]; if (m && m.bar && m.bar[d.k] && m.bar[d.k][+d.r]) { m.bar[d.k][+d.r][+d.c] = Math.max(0, +b.value || 0); afterMeasure(d.p, +d.i); } }
  else if (a === 'pname') { prog(d.p).name = b.value; const sp = b.closest('details').querySelector('summary span'); if (sp) sp.textContent = b.value || 'Programme'; persist(); liveBar(); }
});
function setMeasure(b) {
  const d = b.dataset, m = prog(d.p).measures[+d.i], f = d.f; if (!m) return;
  if (f === 'nom') { m.nom = b.value; const t = b.closest('details.meas'); if (t) { const sp = t.querySelector('.mt'); if (sp && sp.firstChild) sp.firstChild.nodeValue = measTitle(m); } }
  else if (f === 'canal' || f === 'grp') m[f] = b.value;
  else if (f === 'ass') { const a = E.ASS[b.value]; m.ass = b.value; m.lo = a.seuil ? (a.id === 'a_pat' ? 1.3 : a.id === 'a_succ' ? 150 : a.kind === 'cash' ? 0 : 4000) : null; m.hi = a.id === 'v_adultes' ? 1500 : null; m.grp = a.grp ? a.grp[0][0] : null; m.taux = a.kind === 'cash' ? 100 : 1; m.marg = a.seuil ? 1 : 0; m.chiffre = null; }
  else if (f.startsWith('eff')) { m.eff = (m.eff || [50, 100, 100]).slice(); m.eff[+f.slice(3)] = +b.value || 0; }
  else if (f === 'chiffre' || f === 'lo' || f === 'hi' || f === 'end') m[f] = b.value === '' ? null : +b.value;
  else if (f === 'garde') m.bar.garde = b.value === '' ? null : +b.value;
  else m[f] = +b.value || 0;
  afterMeasure(d.p, +d.i);
}
document.addEventListener('change', e => {
  const b = e.target; if (!b.dataset || !b.dataset.act) return; const a = b.dataset.act, d = b.dataset;
  if (a === 'var') { state.chartVar = b.value; render(); persist(); }
  else if (a === 'band') { state.band = b.checked; drawChart(); persist(); }
  else if (a === 'tview') { state.tableView = b.checked; render(); persist(); }
  else if (a === 'dscen') { state.detailScen = b.value; render(); persist(); }
  else if (a === 'mf' && b.tagName === 'SELECT') { setMeasure(b); if (d.f === 'canal' || d.f === 'ass') { state.openProg = d.p; soon(() => { recompute(); render(); }); } }
  else if (a === 'baron') { const m = prog(d.p).measures[+d.i]; m.bar[d.k] = b.checked ? (d.k === 'ir' ? copyBar(E.MICRO.IR_NOW) : [[0, 9.5]]) : null; state.openProg = d.p; recompute(); render(); }
  else if (a === 'pfrom') { state.pilot.from[d.k] = +b.value; recompute(); liveBar(); }
  else if (a === 'shon') { state.shocks.find(x => x.id === d.id).on = b.checked; if (b.checked && !state.shown.includes('env')) state.shown.push('env'); recompute(); render(); }
  else if (a === 'shyr') { state.shocks.find(x => x.id === d.id).year = +b.value; recompute(); liveBar(); }
  else if (a === 'sanc') { state.sanctions = b.checked; recompute(); liveBar(); }
});
document.addEventListener('toggle', e => { const d = e.target; if (!d.classList) return; if (d.classList.contains('prog') && d.open) { state.openProg = d.dataset.p; liveBar(); } else if (d.classList.contains('meas')) openM[d.dataset.m] = d.open; }, true);
let rz = null; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (state.tab === 'synthese') drawChart(); else if (state.tab === 'detail' && state.detailTab === 'secu') render(); }, 150); });

document.addEventListener('change', e => {
  const b = e.target, d = b.dataset || {}, a = d.act;
  if (a === 'mtog') { const p = prog(d.p), m = p && p.measures[+d.i]; if (!m) return; if (b.checked) delete m.off; else m.off = true; b.closest('.mrow').classList.toggle('off', !b.checked); recomputeProg(p.id); progSummary(p.id); liveBar(); }
  else if (a === 'avar') { state.asideVar = b.value; drawAside(); persist(); }
  else if (a === 'year') { state.horizon = +b.value; render(); persist(); }
  else if (a === 'cshow') { const i = state.shown.indexOf(d.id); if (b.checked && i < 0) { if (state.shown.filter(x => x !== 'env').length >= 4) state.shown.splice(state.shown.findIndex(x => x !== 'env'), 1); state.shown.push(d.id); } else if (!b.checked && i >= 0) state.shown.splice(i, 1); persist(); coverCta(); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const d = b.dataset, a = d.act;
  if (a === 'selprog') { state.openProg = d.p; try { history.replaceState(null, '', '#' + d.p); } catch (err) { } render(); persist(); }
  else if (a === 'sectog') { const p = prog(d.p), s = p && sections(p)[+d.k]; if (!s) return; const anyOn = s.items.some(i => !p.measures[i].off); s.items.forEach(i => { if (anyOn) p.measures[i].off = true; else delete p.measures[i].off; }); recomputeProg(p.id); render(); }
  else if (a === 'resetprog') { const i = state.programmes.findIndex(p => p.id === d.p); if (i >= 0 && ORIGIN[d.p] && window.confirm('Rétablir la version d\'origine de ce programme ? Vos modifications et vos cases décochées seront perdues.')) { state.programmes[i] = ORIGIN[d.p](); Object.keys(openM).forEach(k => delete openM[k]); recompute(); render(); } }
});
document.addEventListener('input', e => {
  const b = e.target; if (!b.dataset || b.dataset.act !== 'pname') return;
  const t = $('.ptitle'), c = $('.chip[data-act="selprog"][aria-pressed="true"] span'); if (t) t.textContent = b.value || 'Programme'; if (c) c.textContent = b.value || 'Programme';
});
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (PAGE === 'programmes') drawAside(); }, 150); });

if (PAGE === 'programmes') { const h0 = location.hash.slice(1); if (prog(h0)) state.openProg = h0; }
if (PAGE !== 'accueil') recompute();
render();
})();
