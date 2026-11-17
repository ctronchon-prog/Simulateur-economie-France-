/* Moteur du modèle — économie française, néo-keynésien annuel, écarts à une trajectoire de référence.
   Pur JavaScript, sans DOM. Unités : Md€ courants sauf mention ; écarts en % ou en points. */
(function (root) {
'use strict';
const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037];
const N = YEARS.length;
const Z = () => new Array(N).fill(0);
const sum = a => a.reduce((x, y) => x + y, 0);

/* ---------- Données de calage 2026 ---------- */
const D = {
  Y0: 3052,
  sh: { C: 0.526, G: 0.265, Ie: 0.130, Ih: 0.050, Ig: 0.043, X: 0.339, M: 0.353 },
  E0: 30600, Epub: 5800, LFshareU: 8.3,
  MSpriv: 930, MSpub: 270, Mixed: 140, CapInc: 400, Pens: 423, Ben: 190, RDB: 1900,
  netfac: 0.87, VAsnf: 1560, margin0: 31.5, EqW: 2000, cac0: 7800,
  // lecture Keen : dette privée (% du PIB, 1er trimestre 2026), solde courant 2026 (% du PIB), impôts de production nets (% de la valeur ajoutée),
  // taux moyen de la dette privée (%), part de la dette publique détenue par des non-résidents retenue comme point de repère (%)
  dHh0: 58.8, dFirm0: 75.4, ca0: -0.6, prodTaxVA: 2.2, iPriv0: 3.0, nrRef: 55,
  // recettes 2026 (Md€) — total 1561 = 51,7 % du PIB
  R0: { tva: 215, ir: 98, csg: 160, cot: 465, is: 68, prod: 110, acc: 62, cap: 85, autres: 63, horspo: 235 },
  // dépenses 2026 par nature (Md€) — total 1724 = 57,1 % du PIB
  S0: { presta: 770, salaires: 371, fonct: 157, invest: 130, interets: 79.2, subv: 91, autres: 126.2 },
  sub0: { etat: { dep: 650, solde: -139 }, ct: { dep: 335, solde: -15 }, secu: { dep: 739.4, solde: -9 } },
  br: { // [dépenses 2026, solde 2026, dépenses 2027, solde 2027]
    mal: [269.5, -12.5, 277.1, -7.8], vie: [307.0, -8.0, 316.2, -4.8], fam: [59.0, 0.3, 60.2, 1.6],
    atmp: [18.1, -1.3, 19.5, -1.5], aut: [43.0, -0.3, 44.5, -0.2], une: [46.0, -1.5, 47.5, -1.8], comp: [108.0, 2.5, 111.5, 2.0]
  },
  dec: {
    rdb: [3.7, 5.2, 6.2, 7.1, 7.9, 8.8, 9.9, 11.4, 13.8, 26.0],
    mpc: [0.98, 0.95, 0.91, 0.87, 0.82, 0.76, 0.69, 0.60, 0.48, 0.28],
    lamD: [1, 1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6, 0.5],
    wages: [1.5, 3.5, 5.5, 7, 8.5, 9.5, 11, 13, 15.5, 25],
    pens: [4, 7, 8.5, 9, 9.5, 10, 10.5, 11.5, 13, 17],
    ben: [22, 17, 13, 10, 8.5, 7.5, 6.5, 6, 5, 4.5],
    low: [30, 24, 18, 11, 7, 4, 3, 2, 1, 0],
    fam: [13, 13, 12, 11, 11, 10, 9, 8, 7, 6],
    cap: [1, 1.5, 2, 2.5, 3, 4, 5.5, 8, 13.5, 59],
    ir: [0, 0, 0, 0.5, 1.5, 3, 5, 8, 14, 68],
    irtop: [0, 0, 0, 0, 0, 0, 0, 0, 8, 92],
    csg: [1, 2, 3.5, 5, 6.5, 8, 10, 12.5, 16.5, 35],
    wealth: [0, 0, 0, 0, 0, 0, 0, 1, 4, 95],
    succ: [0, 0, 0, 1, 2, 3, 5, 9, 20, 60],
    smic: [12, 20, 22, 17, 11, 7, 5, 3, 2, 1],
    pubw: [1, 3, 6, 9, 11, 13, 15, 16, 15, 11],
    equal: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    jobs: [8, 13, 15, 14, 12, 10, 9, 8, 6, 5],
    tiltE: [1.35, 1.25, 1.18, 1.10, 1.05, 1.0, 0.95, 0.90, 0.85, 0.72],
    retShare: [14, 22, 27, 28, 27, 26, 25, 24, 24, 23]
  }
};
Object.keys(D.dec).forEach(k => { if (!['mpc', 'lamD', 'tiltE', 'retShare'].includes(k)) { const s = sum(D.dec[k]); D.dec[k] = D.dec[k].map(v => v / s); } });

/* Secteurs : part de VA (%), part d'emploi (%), ventilation des débouchés, cyclicité, tendance, sensibilités */
const SECTORS = [
  { id: 'agri', nom: 'Agriculture', va: 1.6, emp: 2.4, L: [.55, .03, 0, .02, 0, .40], cyc: 0.4, tr: -0.3, en: -0.04, r: 0 },
  { id: 'indus', nom: 'Industrie (hors filières ci-dessous)', va: 7.6, emp: 7.2, L: [.30, .17, .03, .05, .03, .42], cyc: 1.4, tr: -0.2, en: -0.03, r: -0.2 },
  { id: 'auto', nom: 'Automobile', va: 0.6, emp: 0.7, L: [.38, .12, 0, .01, .01, .48], cyc: 2.2, tr: -1.0, en: -0.02, r: -0.8 },
  { id: 'aero', nom: 'Aéronautique et spatial', va: 1.0, emp: 0.8, L: [.02, .10, 0, .06, .02, .80], cyc: 0.9, tr: 1.5, en: -0.01, r: -0.1 },
  { id: 'luxe', nom: 'Luxe', va: 1.3, emp: 0.7, L: [.20, 0, 0, 0, 0, .80], cyc: 1.3, tr: 1.0, en: 0, r: 0 },
  { id: 'def', nom: 'Défense', va: 0.9, emp: 0.7, L: [0, 0, 0, .35, .35, .30], cyc: 0.3, tr: 2.0, en: 0, r: 0 },
  { id: 'energie', nom: 'Énergie, eau, déchets', va: 2.6, emp: 1.4, L: [.50, .15, .03, .12, .05, .15], cyc: 0.5, tr: 0.3, en: 0.05, r: -0.1 },
  { id: 'constr', nom: 'Construction', va: 5.4, emp: 6.2, L: [.05, .25, .42, .04, .22, .02], cyc: 1.5, tr: -0.3, en: -0.01, r: -1.0 },
  { id: 'commerce', nom: 'Commerce', va: 10.4, emp: 12.6, L: [.70, .10, .02, .03, .01, .14], cyc: 1.1, tr: 0, en: -0.01, r: -0.1 },
  { id: 'transp', nom: 'Transports et logistique', va: 4.6, emp: 5.0, L: [.42, .12, .02, .08, .03, .33], cyc: 1.1, tr: 0.2, en: -0.05, r: -0.1 },
  { id: 'hr', nom: 'Hébergement-restauration', va: 2.9, emp: 4.6, L: [.72, .04, 0, .03, 0, .21], cyc: 1.4, tr: 0.3, en: -0.02, r: 0 },
  { id: 'tech', nom: 'Tech et numérique', va: 5.6, emp: 3.6, L: [.33, .40, 0, .09, .03, .15], cyc: 1.0, tr: 2.0, en: 0, r: -0.3 },
  { id: 'finimmo', nom: 'Finance et immobilier', va: 16.6, emp: 4.2, L: [.70, .10, .10, .03, 0, .07], cyc: 0.6, tr: 0, en: 0, r: -0.5 },
  { id: 'servent', nom: 'Services aux entreprises', va: 14.2, emp: 15.5, L: [.20, .40, .04, .10, .04, .22], cyc: 1.2, tr: 0.5, en: -0.01, r: -0.2 },
  { id: 'nonmar', nom: 'Services non marchands', va: 22.0, emp: 30.4, L: [.06, 0, 0, .92, .02, 0], cyc: 1.0, tr: -0.2, en: 0, r: 0 },
  { id: 'autres', nom: 'Autres services', va: 2.7, emp: 4.0, L: [.85, .03, 0, .08, 0, .04], cyc: 1.0, tr: 0, en: 0, r: 0 }
];
const TOURISM = { id: 'tour', nom: 'Tourisme (compte satellite)', va: 3.6, emp: 4.4 };
const SIZES = [
  { id: 'ge', nom: 'Grandes entreprises', va: 32, emp: 29, xs: 0.36, cr: 0.15, low: 0.05, is: 0.45, prod: 0.40, cotlow: 0.18, m0: 30.5 },
  { id: 'eti', nom: 'ETI', va: 26, emp: 25, xs: 0.28, cr: 0.25, low: 0.08, is: 0.25, prod: 0.30, cotlow: 0.20, m0: 29.5 },
  { id: 'pme', nom: 'PME', va: 23, emp: 29, xs: 0.12, cr: 0.40, low: 0.15, is: 0.20, prod: 0.20, cotlow: 0.32, m0: 28.0 },
  { id: 'tpe', nom: 'TPE', va: 19, emp: 17, xs: 0.03, cr: 0.50, low: 0.25, is: 0.10, prod: 0.10, cotlow: 0.30, m0: 38.0 }
];
const TRANSV = [
  { id: 'expo', nom: 'Entreprises exposées à la concurrence internationale', va: 27, emp: 22, xs: 0.55 },
  { id: 'fmn', nom: 'Multinationales étrangères implantées en France', va: 17, emp: 11, xs: 0.45 }
];
const BRANCHES = [
  { id: 'mal', nom: 'Maladie' }, { id: 'vie', nom: 'Vieillesse (base)' }, { id: 'fam', nom: 'Famille' },
  { id: 'atmp', nom: 'Accidents du travail' }, { id: 'aut', nom: 'Autonomie' },
  { id: 'une', nom: 'Assurance chômage (Unédic)' }, { id: 'comp', nom: 'Retraites complémentaires' }
];
const REC_LABELS = { tva: 'TVA', ir: 'Impôt sur le revenu', csg: 'CSG-CRDS', cot: 'Cotisations sociales', is: 'Impôt sur les sociétés', prod: 'Impôts de production', acc: 'Accises (énergie, tabac, alcool)', cap: 'Fiscalité du patrimoine', autres: 'Autres prélèvements', horspo: 'Recettes hors prélèvements' };
const DEP_LABELS = { presta: 'Prestations sociales', salaires: 'Masse salariale publique', fonct: 'Fonctionnement', invest: 'Investissement public', interets: 'Charge d\'intérêts', subv: 'Aides aux entreprises', autres: 'Autres dépenses' };

/* ---------- Paramètres ---------- */
const PARAMS = [
  // id, libellé, défaut, min, max, pas, groupe, simple?, aide
  ['g2027', 'Croissance 2027 de référence (%)', 0.8, -1, 2.5, 0.1, 'Référence', 1, 'Budget : 1,0 · Banque de France : 0,9 · Crédit Agricole : 0,8 · OFCE : 0,7'],
  ['pi2027', 'Inflation 2027 de référence (%)', 1.8, 0, 5, 0.1, 'Référence', 1, 'Hypothèse du budget : 1,8'],
  ['lfg', 'Population active, croissance (%/an)', 0.1, -0.5, 1, 0.05, 'Moteur de long terme', 1, 'Démographie, taux d\'activité, immigration'],
  ['prodG', 'Productivité, gains tendanciels (%/an)', 0.9, -0.5, 2.5, 0.05, 'Moteur de long terme', 1, 'Avec la population active, donne la croissance potentielle'],
  ['penTrend', 'Prix réel de l\'énergie dans la référence (%/an dès 2028)', 0, -10, 15, 0.5, 'Moteur de long terme', 1, 'Zéro : énergie stable au niveau de 2027'],
  ['enPot', 'Sensibilité du potentiel à l\'énergie (% de PIB pour +10 % de prix durable)', 0.15, 0, 2, 0.05, 'Moteur de long terme', 1, 'Vision standard : 0,1 à 0,2 · thèse de l\'énergie facteur central : 1 et plus'],
  ['nairu', 'Chômage structurel (%)', 7.8, 5, 10, 0.1, 'Référence', 1, ''],
  ['gDep', 'Tendance de la dépense primaire en volume (%/an)', 1.1, -1, 3, 0.1, 'Référence', 1, 'À politique inchangée, après 2027'],
  ['bund', 'Taux allemand à 10 ans (%)', 3.5, 0, 7, 0.1, 'Référence', 0, ''],
  ['spreadBase', 'Écart de taux France-Allemagne de référence (pts)', 1.2, 0, 4, 0.05, 'Référence', 0, ''],
  ['ecbBase', 'Taux de dépôt BCE de référence (%)', 2.5, 0, 6, 0.25, 'Référence', 0, ''],
  ['piLT', 'Inflation de long terme (%)', 1.8, 0, 4, 0.1, 'Référence', 0, ''],
  ['u2027', 'Taux de chômage 2027 de référence (%)', 8.6, 6, 11, 0.1, 'Référence', 0, ''],
  ['gap2026', 'Écart de production 2026 (% du potentiel)', -0.9, -4, 2, 0.1, 'Référence', 0, ''],
  ['gapClose', 'Rattrapage spontané vers le potentiel (vitesse)', 0.3, 0, 1, 0.05, 'Moteur de long terme', 1, 'Zéro : pas de rattrapage sans demande supplémentaire'],
  ['ondam', 'Tendance des dépenses maladie (%/an, valeur)', 3.3, 1, 5, 0.1, 'Référence', 0, ''],
  ['kappa', 'Coefficient multiplicateur (ajustement)', 1.3, 0.3, 2.5, 0.05, 'Demande', 1, 'Rapproche de 100 % la part du revenu consommée par chaque dixième, sans jamais la dépasser, et amplifie l\'accélérateur d\'investissement'],
  ['mpcScale', 'Propension à consommer (ajustement)', 1.0, 0.5, 1.2, 0.05, 'Demande', 1, 'Multiplie la propension de chaque dixième : 98 % pour le premier, 28 % pour le dernier, avant ajustement'],
  ['mc', 'Contenu en importations de la consommation', 0.2, 0.1, 0.45, 0.01, 'Demande', 1, 'Fuite par les importations'],
  ['mi', 'Contenu en importations de l\'investissement', 0.34, 0.1, 0.6, 0.01, 'Demande', 0, ''],
  ['mg', 'Contenu en importations de la dépense publique', 0.10, 0.02, 0.3, 0.01, 'Demande', 0, ''],
  ['mx', 'Contenu en importations des exportations', 0.30, 0.1, 0.5, 0.01, 'Demande', 0, ''],
  ['lamC', 'Vitesse d\'ajustement de la consommation', 0.75, 0.3, 1, 0.05, 'Demande', 0, 'Valeur moyenne : les trois premiers dixièmes dépensent dans l\'année, les derniers lissent sur plusieurs années'],
  ['sigC', 'Sensibilité de la consommation au taux réel (%/pt)', 0.25, 0, 1, 0.05, 'Demande', 0, ''],
  ['precaution', 'Épargne de précaution (% de conso par pt de chômage)', 0.35, 0, 1, 0.05, 'Demande', 0, ''],
  ['wealth', 'Effet de richesse (propension à consommer le patrimoine actions)', 0.01, 0, 0.06, 0.005, 'Demande', 0, ''],
  ['acc1', 'Accélérateur d\'investissement', 1.3, 0.5, 2.5, 0.05, 'Demande', 0, ''],
  ['rhoI', 'Inertie de l\'investissement', 0.4, 0, 0.8, 0.05, 'Demande', 0, ''],
  ['aR', 'Sensibilité de l\'investissement au taux (%/pt, par an)', 0.9, 0, 2.5, 0.05, 'Taux et finance', 1, ''],
  ['hR', 'Sensibilité du logement au taux (%/pt, par an)', 1.8, 0, 4, 0.1, 'Taux et finance', 0, ''],
  ['aProf', 'Sensibilité de l\'investissement au taux de marge (%/pt)', 0.4, 0, 1.5, 0.05, 'Demande', 0, ''],
  ['passLong', 'Transmission du taux BCE aux taux longs', 0.5, 0, 1, 0.05, 'Taux et finance', 1, ''],
  ['sDebt', 'Sensibilité de l\'écart de taux à la dette (pts par pt de PIB)', 0.02, 0, 0.1, 0.005, 'Taux et finance', 1, ''],
  ['sDef', 'Sensibilité de l\'écart de taux au déficit (pts par pt de PIB)', 0.10, 0, 0.4, 0.01, 'Taux et finance', 0, ''],
  ['roll', 'Part de la dette refinancée chaque année', 0.13, 0.05, 0.3, 0.01, 'Taux et finance', 0, ''],
  ['shortShare', 'Part des refinancements à taux court', 0.2, 0, 0.5, 0.05, 'Taux et finance', 0, ''],
  ['ecbWd', 'Effet du taux BCE sur la demande étrangère (%/pt)', 0.5, 0, 1.5, 0.05, 'Taux et finance', 0, ''],
  ['ecbEur', 'Effet du taux BCE sur l\'euro (%/pt)', 2.0, 0, 6, 0.25, 'Taux et finance', 0, ''],
  ['eqR', 'Sensibilité des actions au taux long (%/pt)', 6, 0, 15, 0.5, 'Taux et finance', 0, ''],
  ['epsX', 'Élasticité-prix des exportations', 0.7, 0.1, 1.5, 0.05, 'Extérieur', 1, ''],
  ['epsM', 'Élasticité-prix des importations', 0.4, 0, 1.2, 0.05, 'Extérieur', 0, ''],
  ['xWd', 'Élasticité des exportations à la demande mondiale', 1.0, 0.5, 1.5, 0.05, 'Extérieur', 0, ''],
  ['phil', 'Pente de la courbe de Phillips (pts de salaire par pt de chômage)', 0.3, 0, 1.2, 0.05, 'Prix et salaires', 1, ''],
  ['idxW', 'Indexation immédiate des salaires sur les prix', 0.3, 0, 1, 0.05, 'Prix et salaires', 0, ''],
  ['idxW2', 'Indexation retardée des salaires sur les prix', 0.4, 0, 1, 0.05, 'Prix et salaires', 0, ''],
  ['aUlc', 'Poids des coûts salariaux dans les prix', 0.55, 0.3, 0.8, 0.05, 'Prix et salaires', 0, ''],
  ['aM', 'Poids des prix d\'importation dans les prix', 0.22, 0.1, 0.4, 0.01, 'Prix et salaires', 0, ''],
  ['passTVA', 'Répercussion de la TVA dans les prix', 0.75, 0, 1, 0.05, 'Prix et salaires', 0, ''],
  ['smicDiff', 'Diffusion du SMIC au salaire moyen (pt par %)', 0.1, 0, 0.5, 0.01, 'Prix et salaires', 0, ''],
  ['idxPens', 'Indexation des pensions sur les prix', 1.0, 0, 1, 0.05, 'Prix et salaires', 0, ''],
  ['idxBen', 'Indexation des autres prestations', 0.9, 0, 1, 0.05, 'Prix et salaires', 0, ''],
  ['idxPub', 'Indexation des salaires publics', 0.3, 0, 1, 0.05, 'Prix et salaires', 0, ''],
  ['okun', 'Coefficient d\'Okun (référence)', 0.45, 0.2, 0.8, 0.05, 'Emploi', 0, ''],
  ['lamE', 'Vitesse d\'ajustement de l\'emploi', 0.5, 0.2, 1, 0.05, 'Emploi', 1, ''],
  ['sigL', 'Élasticité de l\'emploi au coût du travail', 0.3, 0, 1, 0.05, 'Emploi', 1, ''],
  ['jobsLow', 'Emplois par Md€ d\'allègement bas salaires (milliers)', 20, 0, 40, 1, 'Emploi', 0, ''],
  ['jobsAll', 'Emplois par Md€ d\'allègement général (milliers)', 6, 0, 20, 1, 'Emploi', 0, ''],
  ['smicEmp', 'Élasticité de l\'emploi peu qualifié au SMIC', 0.35, 0, 1.2, 0.05, 'Emploi', 0, 'Destructions directes, avant les effets de la demande et des allègements. Calé pour que le résultat à mi-chemin soit proche du chiffrage d\'Éric Heyer (OFCE) pour un SMIC à 1 600 € : un peu moins de 30 000 destructions nettes'],
  ['smicAll', 'SMIC : effet sur l\'emploi des allègements de cotisations qui gonflent avec lui (part)', 0.8, 0, 1, 0.05, 'Emploi', 0, 'Le barème des allègements est indexé sur le SMIC : sa hausse abaisse le coût des salaires voisins'],
  ['flex', 'Flexion des taux d\'activité', 0.3, 0, 0.7, 0.05, 'Emploi', 0, ''],
  ['rttProd', 'Durée du travail : gains de productivité horaire (part de la baisse compensée)', 0.4, 0, 0.8, 0.05, 'Emploi', 0, 'Évaluations des 35 heures : un tiers à la moitié'],
  ['rttShare', 'Durée du travail : part de la baisse compensée par des embauches, à production donnée', 1.0, 0, 1, 0.05, 'Emploi', 0, 'Le reste est absorbé par l\'organisation du travail'],
  ['rttComp', 'Durée du travail : compensation salariale', 1.0, 0, 1, 0.1, 'Emploi', 0, '1 : salaire mensuel maintenu'],
  ['supplyDirect', 'Part de l\'offre supplémentaire employée immédiatement', 0.6, 0, 1, 0.05, 'Offre', 0, ''],
  ['hyst', 'Effets d\'hystérèse sur le potentiel', 0.15, 0, 0.3, 0.01, 'Offre', 0, ''],
  ['kpubElas', 'Élasticité du potentiel au capital public', 0.08, 0, 0.3, 0.01, 'Offre', 0, ''],
  ['educTfp', 'Rendement de l\'éducation-recherche (% de productivité par Md€, à 10 ans)', 0.02, 0, 0.08, 0.005, 'Offre', 0, ''],
  ['ppbAdd', 'Pôle public bancaire : part réellement additionnelle des financements', 0.4, 0, 1, 0.05, 'Offre', 0, 'Le reste se substitue à des financements privés ou bute sur les capacités de production'],
  ['eti', 'Réaction des hauts revenus à l\'impôt (élasticité du revenu imposable)', 0, 0, 0.8, 0.05, 'Finances publiques', 0, 'Au-delà de 100 000 € par an. 0 : calcul statique, comme les chiffrages des partis ; les études retiennent 0,2 à 0,5'],
  ['elasIR', 'Élasticité de l\'impôt sur le revenu', 1.5, 1, 2.2, 0.05, 'Finances publiques', 0, ''],
  ['elasIS', 'Élasticité de l\'impôt sur les sociétés aux profits', 1.6, 0.8, 3, 0.1, 'Finances publiques', 0, ''],
  ['benPerU', 'Coût public par chômeur supplémentaire (k€/an)', 13.5, 5, 25, 0.5, 'Finances publiques', 0, ''],
  ['pessYield', 'Scénario pessimiste : part obtenue des recettes et économies', 0.75, 0.3, 1, 0.05, 'Fourchettes', 1, ''],
  ['pessCost', 'Scénario pessimiste : dérive des coûts', 1.15, 1, 1.6, 0.05, 'Fourchettes', 0, ''],
  ['optYield', 'Scénario optimiste : part obtenue des recettes et économies', 1.10, 1, 1.4, 0.05, 'Fourchettes', 1, ''],
  ['optCost', 'Scénario optimiste : coûts', 0.95, 0.6, 1, 0.05, 'Fourchettes', 0, ''],
  ['pessSupply', 'Scénario pessimiste : effets d\'offre obtenus', 0.5, 0, 1, 0.05, 'Fourchettes', 0, ''],
  ['optSupply', 'Scénario optimiste : effets d\'offre obtenus', 1.25, 1, 2, 0.05, 'Fourchettes', 0, ''],
  ['scenCompta', 'Rendement des mesures : n\'agit que sur les comptes publics', 1, 0, 1, 1, 'Fourchettes', 0, 'Une recette qui rapporte moins que prévu, une économie qui fuit ou un surcoût ne changent pas ce que la mesure fait aux ménages et aux entreprises : seul le solde public en pâtit. Effets d\'offre et réaction des marchés jouent contre le programme dans le scénario pessimiste, pour lui dans l\'optimiste. 0 : ancienne façon, où une recette manquée restait dans la poche des contribuables', 1],
  ['pessMkt', 'Scénario pessimiste : nervosité des marchés', 1.5, 1, 3, 0.1, 'Fourchettes', 0, ''],
  ['optMkt', 'Scénario optimiste : nervosité des marchés', 0.75, 0.2, 1, 0.05, 'Fourchettes', 0, ''],
  ['euCap', 'Plafond européen de dépense primaire nette (%/an, valeur)', 1.2, 0, 4, 0.1, 'Europe', 0, 'Seuil d\'alerte, à ajuster selon la trajectoire négociée'],
  ['sanctionSpread', 'Sanctions : hausse de l\'écart de taux (pts)', 0.25, 0, 1, 0.05, 'Europe', 0, ''],
  ['sanctionFine', 'Sanctions : amende (% du PIB par an)', 0.1, 0, 0.5, 0.05, 'Europe', 0, ''],
  ['nrShare', 'Part de la dette publique détenue par des non-résidents (%)', 55, 0, 90, 1, 'Taux et finance', 1, 'Dette négociable de l\'État : 57,5 % début 2026, 70 % en 2010. Règle les intérêts versés à l\'étranger et l\'ampleur du choc « attaque des marchés »'],
  ['credOn', 'Le crédit agit sur la demande', 0, 0, 1, 1, 'Dette privée et crédit', 0, '', 1],
  ['credLh', 'Part du logement neuf financée par emprunt', 0.8, 0, 1, 0.05, 'Dette privée et crédit', 0, 'Sert à suivre la dette des ménages'],
  ['credLf', 'Part de l\'investissement des entreprises financée par emprunt', 0.4, 0, 1, 0.05, 'Dette privée et crédit', 0, 'Sert à suivre la dette des entreprises'],
  ['credRate', 'Crédit nouveau en moins pour 1 point de taux en plus (% de l\'encours, par an)', 0.5, 0, 2, 0.05, 'Dette privée et crédit', 0, 'Canal bancaire. N\'agit que si le crédit est activé'],
  ['credDem', 'Part du crédit supplémentaire dépensée en biens et services neufs', 0.5, 0, 1, 0.05, 'Dette privée et crédit', 0, 'Le reste achète des actifs existants. N\'agit que si le crédit est activé'],
  ['demLed', 'Lecture du long terme : 0 = l\'offre fixe le potentiel, 1 = le potentiel suit la demande', 0.5, 0, 1, 0.05, 'Lecture du long terme', 1, 'Le résultat central est calculé avec ce réglage ; la fourchette va toujours de 0 à 1'],
  ['demAbs', 'Lecture demande : part de l\'écart au potentiel absorbée chaque année', 0.8, 0, 1, 0.05, 'Lecture du long terme', 0, 'Hystérèse : le potentiel rejoint l\'activité'],
  ['demNairu', 'Lecture demande : vitesse à laquelle le chômage structurel suit le chômage', 0.4, 0, 1, 0.05, 'Lecture du long terme', 0, 'Économie « à haute pression »'],
  ['verdoorn', 'Lecture demande : gain de productivité pour 1 % d\'activité en plus', 0.3, 0, 0.6, 0.05, 'Lecture du long terme', 0, 'Loi de Kaldor-Verdoorn : estimations entre 0,3 et 0,5'],
  ['extSpread', 'Lecture demande : hausse du taux d\'emprunt par point de solde courant perdu', 0.1, 0, 0.5, 0.05, 'Lecture du long terme', 0, 'Frein extérieur. Convention de la maquette'],
  ['kappaS', 'Lecture offre : coefficient multiplicateur', 0.5, 0.3, 2.5, 0.05, 'Multiplicateurs', 1, 'En lecture demande, c\'est le coefficient multiplicateur général qui s\'applique ; à mi-chemin, la moyenne des deux'],
  ['evict', 'Lecture offre : part de la dépense publique qui remplace de la dépense privée (éviction)', 0.35, 0, 0.7, 0.05, 'Multiplicateurs', 1, 'Zéro en lecture demande. Avec 0,35, un euro de dépense publique fait environ 0,7 euro de PIB la première année'],
  ['capGap', 'Surchauffe : écart au potentiel à partir duquel la production plafonne (% du PIB)', 1.5, 0, 99, 0.5, 'Limites', 0, 'Au-delà, la demande part en importations. 99 : pas de plafond'],
  ['capRoom', 'Surchauffe : marge maximale au-dessus de ce seuil (% du PIB)', 2.5, 0.5, 6, 0.5, 'Limites', 0, 'Depuis 1980, l\'écart au potentiel estimé pour la France n\'a pas dépassé 3 à 4 %'],
  ['uSoft', 'Chômage à partir duquel les embauches deviennent difficiles (%)', 5, 0, 8, 0.5, 'Limites', 0, 'Zéro : pas de plancher'],
  ['uMin', 'Chômage plancher (%)', 3, 1, 5, 0.5, 'Limites', 0, 'La France n\'est pas descendue sous 3 % depuis le début des années 1970'],
  ['philConv', 'Salaires : accélération quand le chômage passe sous son niveau structurel (par point)', 0.25, 0, 0.6, 0.05, 'Limites', 0, 'Courbe de Phillips non linéaire. Zéro : effet proportionnel'],
  ['fisher', 'Part de l\'inflation supplémentaire répercutée dans le taux à dix ans', 0.3, 0, 1, 0.05, 'Taux et finance', 1, 'Partielle : un emprunt à dix ans ne compense que l\'inflation attendue sur dix ans'],
  ['tayFr', 'Réaction de la BCE à l\'inflation française (point de taux par point d\'inflation)', 0.3, 0, 1.5, 0.05, 'Taux et finance', 0, 'Environ 0,3 : la France pèse un cinquième de la zone euro, et la BCE monte ses taux de 1,5 point par point d\'inflation'],
  ['mktConv', 'Marchés : nervosité supplémentaire par point de dette au-dessus du seuil', 0.02, 0, 0.06, 0.005, 'Taux et finance', 0, 'Les réactions à la dette et au déficit sont multipliées par exp(ce réglage × points de dette au-dessus du seuil)'],
  ['mktBase', 'Marchés : seuil de dette à partir duquel la nervosité augmente (% du PIB)', 120, 80, 200, 5, 'Taux et finance', 0, ''],
  ['passNow', 'Part des hausses de coûts salariaux répercutée dans les prix dès la première année', 0.5, 0.2, 1, 0.05, 'Prix et salaires', 0, 'Le reste l\'année suivante'],
  ['demPass', 'Lecture demande : part des hausses de coûts salariaux prise sur les marges plutôt que sur les prix', 0.6, 0, 0.8, 0.05, 'Lecture du long terme', 0, ''],
  ['demSigL', 'Lecture demande : part de l\'effet du coût du travail sur l\'emploi qui disparaît', 0.9, 0, 1, 0.05, 'Lecture du long terme', 0, 'Régime tiré par les salaires'],
  ['demProf', 'Lecture demande : part de l\'effet des marges sur l\'investissement qui disparaît', 0.9, 0, 1, 0.05, 'Lecture du long terme', 0, ''],
  ['ppbLoss', 'Pôle public bancaire : pertes attendues, à la charge de l\'État (% des financements)', 4, 0, 15, 0.5, 'Offre', 0, 'Ordre de grandeur des pertes estimées sur les prêts garantis par l\'État de 2020'],
  ['hrsOut', 'Heures en plus, lecture offre : production supplémentaire par point d\'heures', 0.8, 0, 1, 0.05, 'Emploi', 0, ''],
  ['hrsSpeed', 'Heures en plus, lecture offre : part des débouchés gagnée chaque année', 0.3, 0.1, 1, 0.05, 'Emploi', 0, 'La production supplémentaire ne se vend pas tout de suite : à 0,3, environ la moitié est écoulée au bout de deux ans, les quatre cinquièmes au bout de cinq'],
  ['ageKeep', 'Âge de la retraite, lecture demande : part des personnes concernées qui gardent (recul) ou quittent (avancée) un emploi', 0.75, 0, 1, 0.05, 'Emploi', 0, 'L\'OFCE retient 80 % vers l\'emploi et 20 % vers le chômage pour la réforme de 2023'],
  ['ageFade', 'Âge de la retraite, lecture demande : part de cet effet direct qui s\'efface chaque année', 0.2, 0, 0.5, 0.05, 'Lecture du long terme', 0, 'En lecture demande, les entreprises ajustent peu à peu leurs embauches au niveau de leurs commandes'],
  ['migrC', 'Lecture demande : dépense d\'un nouvel arrivant, par rapport à celle d\'un habitant moyen', 1, 0, 1.5, 0.05, 'Lecture du long terme', 0, 'Consommation et logement. À 0, les nouveaux arrivants cherchent un emploi sans rien dépenser'],
  ['ppbCap', 'Pôle public bancaire : montant annuel au-delà duquel les bons projets se raréfient (Md€)', 150, 0, 300, 10, 'Offre', 0, 'Chaque milliard de plus finance un peu moins d\'investissement nouveau. 0 : pas de limite'],
  ['ppbDebt', 'Pôle public bancaire : part des financements comptée dans la dette publique (%)', 0, 0, 100, 10, 'Finances publiques', 0, 'Les banques publiques existantes (Bpifrance, KfW en Allemagne) sont hors dette publique. Eurostat pourrait en juger autrement pour une banque qui prête sur ordre de l\'État. Les prêts sont supposés remboursés en dix ans'],
  ['pbCap', 'Blocage des prix : montant que les marges des secteurs visés peuvent absorber (Md€)', 10, 0, 40, 1, 'Offre', 0, 'Au-delà, l\'État compense (sinon les rayons se vident). 0 : tout est pris sur les marges'],
  ['tarRet', 'Droits de douane : exportations perdues par point de droits, par riposte des partenaires (%)', 0.45, 0, 1, 0.05, 'Extérieur', 0, ''],
  ['tarTfp', 'Droits de douane : perte de productivité par point de droits, au bout de cinq ans (%)', 0.06, 0, 0.12, 0.01, 'Extérieur', 0, 'Sur 151 pays de 1963 à 2014, le FMI (Furceri et al.) trouve une perte de production d\'environ 0,1 % par point de droits au bout de cinq ans'],
  ['pubHire', 'Santé, éducation : part de la masse salariale en plus qui va à des embauches', 0.5, 0, 1, 0.05, 'Emploi', 0, 'Le reste revalorise les salaires'],
  ['gwOut', 'Santé, éducation : salaires publics comptés comme emploi public et non comme commandes aux entreprises', 1, 0, 1, 1, 'Multiplicateurs', 0, 'Évite de compter deux fois le revenu des agents', 1],
  ['wDE0', 'Allemagne : hausse annuelle du coût du travail supposée dans la référence (%)', 3.4, 0, 10, 0.1, 'Extérieur', 0, 'Coût horaire dans l\'industrie : 42,1 € en 2020, 49,8 € en 2025 (Insee, Eurostat). France sur la même période : 2,6 % par an'],
  ['wIT0', 'Italie : hausse annuelle du coût du travail supposée dans la référence (%)', 2.5, 0, 10, 0.1, 'Extérieur', 0, 'Coût horaire dans l\'industrie : 29,2 € en 2020, 33,0 € en 2025 (Insee, Eurostat)'],
  ['wES0', 'Espagne : hausse annuelle du coût du travail supposée dans la référence (%)', 3.0, 0, 10, 0.1, 'Extérieur', 0, 'Coût horaire dans l\'industrie : 24,8 € en 2020, 28,7 € en 2025 (Insee, Eurostat)'],
  ['wUS0', 'États-Unis : hausse annuelle du coût du travail supposée dans la référence (%)', 4.1, 0, 10, 0.1, 'Extérieur', 0, 'Indice du coût de l\'emploi, secteur privé, en dollars : moyenne des hausses annuelles de 2021 à 2025 (BLS)'],
  ['wCN0', 'Chine : hausse annuelle du coût du travail supposée dans la référence (%)', 6.5, 0, 12, 0.1, 'Extérieur', 0, 'Salaire moyen des unités urbaines non privées, en yuans : moyenne des hausses annuelles de 2020 à 2024 (Bureau national des statistiques)'],
  ['partPass', 'Partenaires : part d\'une hausse de leur coût du travail qui passe dans leurs prix', 0.55, 0, 1, 0.05, 'Extérieur', 0, 'Même valeur que pour la France'],
  ['smicHi', 'SMIC : élasticité de l\'emploi peu qualifié au-delà de +15 %', 0.3, 0, 1, 0.05, 'Emploi', 0, 'L\'estimation retenue pour le SMIC vaut pour des hausses modérées ; au-delà, de plus en plus de salariés sont concernés'],
  ['taxSat', 'Impôts sur le capital et les hauts revenus : rendement qui plafonne aux fortes doses', 1, 0, 1, 1, 'Limites', 0, '1 : oui. 0 : chaque euro voté rentre'],
  ['credServ', 'Dépense en moins par euro d\'intérêts privés en plus', 0.3, 0, 1, 0.05, 'Dette privée et crédit', 0, 'Poids de la charge de la dette privée. N\'agit que si le crédit est activé']
].map(a => ({ id: a[0], label: a[1], def: a[2], min: a[3], max: a[4], step: a[5], group: a[6], simple: !!a[7], help: a[8], sw: !!a[9] }));
const defaultParams = () => { const p = {}; PARAMS.forEach(x => p[x.id] = x.def); return p; };

/* ---------- Trajectoire de référence ---------- */
function baseline(P) {
  const B = {}; ['gpot', 'pen', 'g', 'gap', 'pi', 'defl', 'Yr', 'Yn', 'Pgdp', 'Pc', 'u', 'E', 'LF', 'ecb', 'oat', 'wg', 'msg', 'dep', 'rec', 'int', 'def', 'D', 'iavg'].forEach(k => B[k] = Z());
  B.Yr[0] = B.Yn[0] = D.Y0; B.g[0] = 0.5; B.gap[0] = P.gap2026; B.pi[0] = 2.2; B.defl[0] = 1.6; B.Pgdp[0] = B.Pc[0] = 1;
  B.u[0] = 8.3; B.E[0] = D.E0; B.LF[0] = D.E0 / (1 - 0.083);
  const prodTr = Math.max(0, P.prodG); B.pen[0] = 100; B.gpot[0] = P.lfg + P.prodG;
  for (let t = 1; t < N; t++) {
    const dpen = t >= 2 ? P.penTrend : 0; B.pen[t] = B.pen[t - 1] * (1 + dpen / 100);
    const gp = P.lfg + P.prodG - P.enPot / 10 * dpen; B.gpot[t] = gp;
    const g = t === 1 ? P.g2027 : gp + P.gapClose * (-B.gap[t - 1]);
    B.g[t] = g; B.gap[t] = B.gap[t - 1] + g - gp;
    B.pi[t] = (t === 1 ? P.pi2027 : P.piLT + (B.pi[t - 1] - P.piLT) * 0.3) + 0.03 * dpen;
    B.defl[t] = t === 1 ? 1.7 + (B.pi[t] - 1.8) : B.pi[t] - 0.1;
    B.Yr[t] = B.Yr[t - 1] * (1 + g / 100); B.Pgdp[t] = B.Pgdp[t - 1] * (1 + B.defl[t] / 100); B.Pc[t] = B.Pc[t - 1] * (1 + B.pi[t] / 100);
    B.Yn[t] = B.Yr[t] * B.Pgdp[t];
    B.u[t] = t === 1 ? P.u2027 : B.u[t - 1] - P.okun * (g - gp) - 0.15 * (B.u[t - 1] - P.nairu);
    B.LF[t] = B.LF[t - 1] * (1 + P.lfg / 100); B.E[t] = B.LF[t] * (1 - B.u[t] / 100);
    B.wg[t] = B.pi[t] + 0.9 * prodTr; B.msg[t] = B.wg[t] + (B.E[t] / B.E[t - 1] - 1) * 100;
  }
  for (let t = 0; t < N; t++) { B.ecb[t] = P.ecbBase; B.oat[t] = P.bund + P.spreadBase; }
  // Finances publiques
  const YnPLF = D.Y0 * 1.010 * 1.017;
  B.dep[0] = 0.571 * D.Y0; B.rec[0] = 0.517 * D.Y0; B.int[0] = 79.2; B.D[0] = 1.193 * D.Y0; B.def[0] = B.dep[0] - B.rec[0]; B.iavg[0] = 79.2 / (1.16 * 2980);
  B.dep[1] = 0.569 * YnPLF; B.rec[1] = 0.519 * YnPLF * (B.Yn[1] / YnPLF); B.int[1] = 91.2; B.def[1] = B.dep[1] - B.rec[1];
  B.D[1] = 1.217 * YnPLF + (B.def[1] - 0.05 * YnPLF); B.iavg[1] = 91.2 / B.D[0];
  for (let t = 2; t < N; t++) {
    const rmkt = (P.shortShare * (B.ecb[t] + 0.2) + (1 - P.shortShare) * B.oat[t]) / 100;
    B.iavg[t] = B.iavg[t - 1] + P.roll * (rmkt - B.iavg[t - 1]);
    B.int[t] = B.iavg[t] * B.D[t - 1];
    const prim = (B.dep[t - 1] - B.int[t - 1]) * (1 + P.gDep / 100) * (1 + B.defl[t] / 100);
    B.dep[t] = prim + B.int[t]; B.rec[t] = B.rec[t - 1] * B.Yn[t] / B.Yn[t - 1];
    B.def[t] = B.dep[t] - B.rec[t]; B.D[t] = B.D[t - 1] + B.def[t];
  }
  // Recettes par instrument, dépenses par nature
  const R0tot = sum(Object.values(D.R0)); B.recI = {}; Object.keys(D.R0).forEach(k => B.recI[k] = B.rec.map(v => v * D.R0[k] / R0tot));
  const S0prim = sum(Object.values(D.S0)) - D.S0.interets; B.depN = {};
  Object.keys(D.S0).forEach(k => B.depN[k] = k === 'interets' ? B.int.slice() : B.dep.map((v, t) => (v - B.int[t]) * D.S0[k] / S0prim));
  // Branches de la sécurité sociale
  B.br = {}; const grow = { mal: t => P.ondam, vie: t => B.pi[t - 1] + 1.5, fam: t => B.pi[t - 1] + 0.1, atmp: t => 3.0, aut: t => 4.0, une: t => B.wg[t] + ((B.LF[t] * B.u[t]) / (B.LF[t - 1] * B.u[t - 1]) - 1) * 100, comp: t => B.pi[t - 1] + 1.6 };
  BRANCHES.forEach(b => {
    const d = D.br[b.id], dep = Z(), rec = Z();
    dep[0] = d[0]; rec[0] = d[0] + d[1]; dep[1] = d[2]; rec[1] = (d[2] + d[3]) * (B.Yn[1] / YnPLF);
    for (let t = 2; t < N; t++) { dep[t] = dep[t - 1] * (1 + grow[b.id](t) / 100); rec[t] = rec[t - 1] * (1 + B.msg[t] / 100); }
    B.br[b.id] = { dep, rec, solde: dep.map((v, t) => rec[t] - v) };
  });
  // Sous-secteurs
  const brDep = t => sum(BRANCHES.map(b => B.br[b.id].dep[t])), brSol = t => sum(BRANCHES.map(b => B.br[b.id].solde[t]));
  B.sub = { etat: { dep: Z(), rec: Z(), solde: Z() }, ct: { dep: Z(), rec: Z(), solde: Z() }, secu: { dep: Z(), rec: Z(), solde: Z() } };
  const autresSecu0 = D.sub0.secu.solde - brSol(0);
  for (let t = 0; t < N; t++) {
    const s = B.sub;
    s.secu.dep[t] = D.sub0.secu.dep * brDep(t) / brDep(0); s.secu.solde[t] = brSol(t) + autresSecu0 * B.Yn[t] / D.Y0;
    s.ct.dep[t] = D.sub0.ct.dep * B.Yn[t] / D.Y0; s.ct.solde[t] = (t === 0 ? -0.005 : -0.004) * B.Yn[t];
    s.etat.dep[t] = B.dep[t] - s.secu.dep[t] - s.ct.dep[t]; s.etat.solde[t] = -B.def[t] - s.secu.solde[t] - s.ct.solde[t];
    ['etat', 'ct', 'secu'].forEach(k => s[k].rec[t] = s[k].dep[t] + s[k].solde[t]);
  }
  // Demande, comptes des ménages
  B.C = B.Yr.map(v => v * D.sh.C); B.G = B.Yr.map(v => v * D.sh.G); B.Ie = B.Yr.map(v => v * D.sh.Ie); B.Ih = B.Yr.map(v => v * D.sh.Ih);
  B.Ig = B.Yr.map(v => v * D.sh.Ig); B.X = B.Yr.map(v => v * D.sh.X); B.M = B.Yr.map(v => v * D.sh.M);
  B.nom = B.Yn.map(v => v / D.Y0); // indice nominal pour les bases
  B.rdbrG = B.g.map((g, t) => t === 0 ? -0.2 : g - 0.3 + (t === 1 ? -0.3 : 0));
  B.bal = B.Yn.map((v, t) => -0.3 + Math.min(0.3, 0.1 * t));
  B.cac = B.Yn.map((v, t) => D.cac0 * Math.pow(1.035, t));
  return B;
}

/* ---------- Accumulateur d'impulsions ---------- */
const CH = ['G', 'Ig', 'pInd', 'pE', 'firmMargin', 'ucost', 'ieff', 'smic', 'lfs', 'tfp', 'nairu', 'jobs', 'gjobs', 'wd', 'pen', 'eur', 'spread', 'cspread', 'eq', 'cshock', 'ieshock', 'ihshock', 'xshock', 'kdes', 'ecb', 'conf', 'tariff', 'emp', 'wshock', 'defDem', 'tour', 'agri', 'tech', 'attr', 'isAmt', 'isGe', 'prodAmt', 'cotLowAmt', 'eduCum', 'mImp', 'idxw', 'hrs', 'csave', 'lfsA', 'Gw', 'ppbI', 'ppbD', 'wDE', 'wIT', 'wES', 'wUS', 'wCN'];
function newImp() {
  const I = { hh: D.dec.rdb.map(() => Z()), hhA: Z(), hhR: Z(), rev: {}, spend: {}, sub: { etat: Z(), ct: Z(), secu: Z() }, br: {} };
  Object.keys(D.R0).forEach(k => I.rev[k] = Z()); Object.keys(D.S0).forEach(k => I.spend[k] = Z());
  BRANCHES.forEach(b => I.br[b.id] = Z()); CH.forEach(k => I[k] = Z());
  return I;
}
function acc(I, t) {
  const split = (md, sp, sign) => { sp = sp || { etat: 1 }; Object.keys(sp).forEach(k => { if (I.sub[k]) I.sub[k][t] += sign * md * sp[k]; else if (I.br[k]) { /* branche */ } }); };
  return {
    rev(inst, md, sp, br) { I.rev[inst][t] += md; split(md, sp, +1); if (br) Object.keys(br).forEach(k => I.br[k][t] += md * br[k]); },
    spend(nat, md, sp, br) { I.spend[nat][t] += md; split(md, sp, -1); if (br) Object.keys(br).forEach(k => I.br[k][t] -= md * br[k]); },
    hh(vec, md, actShare) { for (let d = 0; d < 10; d++) I.hh[d][t] += md * vec[d]; I.hhA[t] += md * actShare; I.hhR[t] += md * (1 - actShare); },
    transfer(from, to, md) { I.sub[from][t] -= md; I.sub[to][t] += md; },
    hhv(arr, mult, actMd, retMd) { for (let d = 0; d < 10; d++) I.hh[d][t] += mult * arr[d]; I.hhA[t] += actMd; I.hhR[t] += retMd; },
    add(k, v) { I[k][t] += v; }
  };
}

/* ---------- Catalogue des leviers ----------
   fx(A, u, P, c) : u = unités après montée en charge ; c.idx = indexation sur le PIB nominal ;
   c.r = facteur de chiffrage (scénario, chiffrage du candidat, efficacité) ; c.sup = facteur d'offre.
   sens : +1 si une valeur positive améliore le solde public, −1 si elle le dégrade. */
const dc = D.dec;
const TVA_SPLIT = { etat: .5, ct: .22, secu: .28 };
const LEVERS = [
  // Fiscalité des ménages
  { id: 'tva', g: 'Fiscalité des ménages', nom: 'TVA, taux normal', unit: 'pt', y: 8.4, min: -5, max: 5, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = u * 8.4 * c.idx * c.r; A.rev('tva', m, TVA_SPLIT, { mal: .25 }); A.add('pInd', P.passTVA * m / (1650 * c.idx) * 100); } },
  { id: 'tvar', g: 'Fiscalité des ménages', nom: 'TVA, taux réduits', unit: 'pt', y: 4.1, min: -5, max: 5, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = u * 4.1 * c.idx * c.r; A.rev('tva', m, TVA_SPLIT, { mal: .25 }); A.add('pInd', P.passTVA * m / (1650 * c.idx) * 100); A.hh(dc.low, -0.15 * m, .8); A.hh(dc.cap, 0.15 * m, .6); } },
  { id: 'ir', g: 'Fiscalité des ménages', nom: 'Impôt sur le revenu, ensemble du barème', unit: 'Md€', y: 1, min: -40, max: 40, step: 1, sens: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('ir', m); A.hh(dc.ir, -m, .78); } },
  { id: 'irtop', g: 'Fiscalité des ménages', nom: 'Impôt sur le revenu, hauts revenus', unit: 'Md€', y: 1, min: -20, max: 30, step: 1, sens: 1, fx: (A, u, P, c) => { const m = sat(u, 20, 50, P) * c.idx * c.r; A.rev('ir', m); A.hh(dc.irtop, -m, .8); } },
  { id: 'csg', g: 'Fiscalité des ménages', nom: 'CSG, tous revenus', unit: 'pt', y: 17, min: -3, max: 3, step: 0.1, sens: 1, fx: (A, u, P, c) => { const m = u * 17 * c.idx * c.r; A.rev('csg', m, { secu: 1 }, { mal: .45, fam: .10, vie: .15, aut: .12, une: .11 }); A.hh(dc.csg, -m, .76); } },
  { id: 'csgret', g: 'Fiscalité des ménages', nom: 'CSG sur les pensions', unit: 'pt', y: 3.8, min: -3, max: 3, step: 0.1, sens: 1, fx: (A, u, P, c) => { const m = u * 3.8 * c.idx * c.r; A.rev('csg', m, { secu: 1 }, { mal: .6, vie: .4 }); A.hh(dc.pens, -m, 0); } },
  { id: 'isf', g: 'Fiscalité des ménages', nom: 'Impôt sur la fortune', unit: 'Md€', y: 1, min: -3, max: 30, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = sat(u, 20, 45, P) * c.idx * c.r; A.rev('cap', m); A.hh(dc.wealth, -m, .55); A.add('attr', -0.15 * u); A.add('ieff', -0.03 * u); } },
  { id: 'capinc', g: 'Fiscalité des ménages', nom: 'Fiscalité des revenus du capital', unit: 'Md€', y: 1, min: -10, max: 20, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = sat(u, 15, 40, P) * c.idx * c.r; A.rev('cap', m); A.hh(dc.cap, -m, .55); A.add('ieff', -0.04 * u); } },
  { id: 'succ', g: 'Fiscalité des ménages', nom: 'Droits de succession', unit: 'Md€', y: 1, min: -15, max: 20, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = sat(u, 20, 45, P) * c.idx * c.r; A.rev('cap', m); A.hh(dc.succ, -m * 0.5, .7); } },
  { id: 'accise', g: 'Fiscalité des ménages', nom: 'Taxes sur l\'énergie et le carbone', unit: 'Md€', y: 1, min: -20, max: 20, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('acc', m, { etat: .7, ct: .3 }); A.add('pE', 0.8 * m / (1650 * c.idx) * 100); } },
  // Fiscalité des entreprises
  { id: 'is', g: 'Fiscalité des entreprises', nom: 'Impôt sur les sociétés, taux', unit: 'pt', y: 2.7, min: -10, max: 10, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = u * 2.7 * c.idx * c.r; A.rev('is', m); A.add('isAmt', m); A.add('ieff', -0.4 * u); A.add('attr', -1.0 * u); A.hh(dc.cap, -0.2 * m, .55); } },
  { id: 'isge', g: 'Fiscalité des entreprises', nom: 'Surtaxe sur les grandes entreprises', unit: 'Md€', y: 1, min: -8, max: 20, step: 0.5, sens: 1, fx: (A, u, P, c) => { const m = sat(u, 15, 40, P) * c.idx * c.r; A.rev('is', m); A.add('isAmt', m); A.add('isGe', u); A.add('ieff', -0.10 * u); A.add('attr', -0.3 * u); A.hh(dc.cap, -0.2 * m, .55); } },
  { id: 'prodtax', g: 'Fiscalité des entreprises', nom: 'Impôts de production', unit: 'Md€', y: 1, min: -60, max: 20, step: 1, sens: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('prod', m, { ct: .6, etat: .2, secu: .2 }); A.add('prodAmt', m); A.add('firmMargin', -m); A.add('ucost', 0.5 * m); A.add('ieff', -0.18 * u); A.add('attr', -0.4 * u); } },
  { id: 'cotlow', g: 'Fiscalité des entreprises', nom: 'Cotisations patronales sur les bas salaires', unit: 'Md€', y: 1, min: -30, max: 30, step: 1, sens: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('cot', m, { secu: 1 }, { mal: .35, vie: .35, fam: .15, une: .15 }); A.add('ucost', m); A.add('cotLowAmt', m); A.add('jobs', -P.jobsLow * u * c.sup); A.add('nairu', 0.02 * u * c.sup); } },
  { id: 'cotall', g: 'Fiscalité des entreprises', nom: 'Cotisations patronales, tous salaires', unit: 'Md€', y: 1, min: -40, max: 40, step: 1, sens: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('cot', m, { secu: 1 }, { mal: .30, vie: .40, fam: .12, une: .18 }); A.add('ucost', m); A.add('jobs', -P.jobsAll * u * c.sup); A.add('attr', -0.2 * u); } },
  { id: 'subv', g: 'Fiscalité des entreprises', nom: 'Aides et crédits d\'impôt aux entreprises', unit: 'Md€', y: 1, min: -60, max: 30, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('subv', m); A.add('firmMargin', m); A.add('ieff', 0.15 * u); A.add('attr', 0.2 * u); } },
  // Travail et salaires
  { id: 'smic', g: 'Travail et salaires', nom: 'SMIC, hausse au-delà de l\'indexation', unit: '%', y: 1.4, min: -5, max: 25, step: 0.5, sens: -1, fx: (A, u, P, c) => { A.spend('subv', 1.4 * u * c.idx * c.r, { secu: 1 }, { mal: .4, vie: .4, fam: .2 }); A.add('smic', u); const m = 1.1 * u * c.idx; A.hh(dc.smic, m, 1); A.hh(dc.wages, -m, 1); A.add('jobs', -P.smicEmp * u / 100 * 2700 + P.smicAll * P.jobsLow * 0.6 * u - (u > 15 ? P.smicHi * (u - 15) / 100 * 2700 * (1 + (u - 15) / 20) : 0)); A.add('ucost', -P.smicAll * 0.6 * u * c.idx); A.add('nairu', 0.01 * u); } },
  { id: 'cotsal', g: 'Travail et salaires', nom: 'Cotisations salariales', unit: 'Md€', y: 1, min: -100, max: 30, step: 1, sens: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('cot', m, { secu: 1 }, { vie: .6, mal: .2, une: .2 }); A.hh(dc.wages, -m, 1); } },
  { id: 'age', g: 'Travail et salaires', nom: 'Âge légal de départ à la retraite', unit: 'an', y: 5, min: -4, max: 4, step: 0.25, sens: 1, supply: 1, slow: 6, fx: (A, u, P, c) => { const m = 8 * u * c.idx * c.r; A.spend('presta', -m, { secu: .85, etat: .15 }, { vie: .62, comp: .23 }); A.hh(dc.pens, -m, 0); const b = 3 * u * c.idx; A.spend('presta', b, { secu: .8, ct: .2 }, { une: .5, mal: .3 }); A.hh(dc.ben, b, .9); A.add('lfs', 0.7 * u * c.sup); A.add('lfsA', 0.7 * u * c.sup); } },
  { id: 'hours', g: 'Travail et salaires', nom: 'Durée effective du travail (baisse : salaire mensuel maintenu ; hausse : heures payées ; 39 h légales valent +2 à +3 %)', unit: '%', y: 0, min: -12, max: 8, step: 0.5, sens: 0, supply: 1, fx: (A, u, P, c) => { A.add('hrs', (1 - P.rttProd) * u); A.add('wshock', u > 0 ? (1 - P.rttProd) * u : u * (1 - P.rttComp)); } },
  { id: 'idxsal', g: 'Travail et salaires', nom: 'Indexation des salaires sur les prix (échelle mobile)', unit: '%', y: 0, min: 0, max: 100, step: 10, sens: 0, fx: (A, u) => { A.add('idxw', u); } },
  { id: 'chom', g: 'Travail et salaires', nom: 'Assurance chômage, générosité', unit: 'Md€', y: 1, min: -15, max: 15, step: 0.5, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('presta', m, { secu: 1 }, { une: 1 }); A.hh(dc.jobs, m, 1); A.add('nairu', 0.04 * u); } },
  { id: 'migr', g: 'Travail et salaires', nom: 'Solde migratoire', unit: 'milliers/an', y: 0, min: -200, max: 300, step: 10, sens: 0, cumul: 1, fx: (A, u, P, c) => { A.add('lfs', 0.0018 * u); A.spend('fonct', 0.006 * u * c.idx, { etat: .5, ct: .3, secu: .2 }, { mal: .2 }); A.add('G', 0.006 * u); A.add('cshock', (P.demLed || 0) * P.migrC * 0.0015 * u); } },
  // Dépenses publiques
  { id: 'gjobs', g: 'Dépenses publiques', nom: 'Emplois publics', unit: 'milliers', y: 0.055, min: -500, max: 500, step: 10, sens: -1, fx: (A, u, P, c) => { const m = 0.055 * u * c.idx * c.r; A.spend('salaires', m, { etat: .5, ct: .3, secu: .2 }, { mal: .2 }); A.add('gjobs', u); A.add('G', m / c.idx); A.hh(dc.pubw, m * 0.62, 1); } },
  { id: 'gpoint', g: 'Dépenses publiques', nom: 'Point d\'indice des fonctionnaires', unit: '%', y: 2.4, min: -5, max: 20, step: 0.5, sens: -1, fx: (A, u, P, c) => { const m = u * 2.4 * c.idx * c.r; A.spend('salaires', m, { etat: .45, ct: .3, secu: .25 }, { mal: .25 }); A.hh(dc.pubw, m * 0.62, 1); A.rev('cot', m * 0.2, { secu: 1 }, { vie: .5, mal: .5 }); } },
  { id: 'gfonct', g: 'Dépenses publiques', nom: 'Fonctionnement de l\'État et des opérateurs', unit: 'Md€', y: 1, min: -40, max: 40, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('fonct', m); A.add('G', m / c.idx); } },
  { id: 'ipub', g: 'Dépenses publiques', nom: 'Investissement public', unit: 'Md€', y: 1, min: -30, max: 60, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('invest', m, { etat: .6, ct: .4 }); A.add('Ig', m / c.idx); } },
  { id: 'def', g: 'Dépenses publiques', nom: 'Défense', unit: 'Md€', y: 1, min: -20, max: 50, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r, v = m / c.idx; A.spend('fonct', 0.5 * m); A.spend('invest', 0.5 * m); A.add('G', 0.5 * v); A.add('Ig', 0.5 * v); A.add('defDem', v); A.add('mImp', 0.12 * v); } },
  { id: 'sante', g: 'Dépenses publiques', nom: 'Santé et hôpital', unit: 'Md€', y: 1, min: -30, max: 40, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('presta', 0.6 * m, { secu: 1 }, { mal: .6 }); A.spend('salaires', 0.4 * m, { secu: 1 }, { mal: .4 }); A.add('G', m / c.idx); A.hh(dc.pubw, 0.4 * m * 0.62, 1); const wg = P.gwOut * 0.4 * m / c.idx; A.add('gjobs', P.pubHire * wg / 0.055); A.add('Gw', (1 - P.pubHire) * wg); } },
  { id: 'educ', g: 'Dépenses publiques', nom: 'Éducation et recherche', unit: 'Md€', y: 1, min: -20, max: 40, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('salaires', 0.6 * m); A.spend('fonct', 0.4 * m); A.add('G', m / c.idx); A.hh(dc.pubw, 0.6 * m * 0.62, 1); A.add('eduCum', m / c.idx * c.sup); const wg = P.gwOut * 0.6 * m / c.idx; A.add('gjobs', P.pubHire * wg / 0.055); A.add('Gw', (1 - P.pubHire) * wg); } },
  { id: 'pens', g: 'Dépenses publiques', nom: 'Revalorisation des pensions (écart à l\'inflation)', unit: 'pt', y: 4.2, min: -4, max: 6, step: 0.25, sens: -1, fx: (A, u, P, c) => { const m = u * 4.2 * c.idx * c.r; A.spend('presta', m, { secu: .85, etat: .15 }, { vie: .62, comp: .23 }); A.hh(dc.pens, m * 0.91, 0); } },
  { id: 'benlow', g: 'Dépenses publiques', nom: 'Minima sociaux et aides ciblées bas revenus', unit: 'Md€', y: 1, min: -20, max: 40, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('presta', m, { etat: .6, ct: .3, secu: .1 }, { fam: .1 }); A.hh(dc.low, m, .85); A.add('nairu', 0.01 * u); } },
  { id: 'benfam', g: 'Dépenses publiques', nom: 'Prestations familiales et logement', unit: 'Md€', y: 1, min: -20, max: 30, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('presta', m, { secu: .7, etat: .3 }, { fam: .7 }); A.hh(dc.fam, m, .95); } },
  { id: 'univ', g: 'Dépenses publiques', nom: 'Transfert forfaitaire à tous les ménages', unit: 'Md€', y: 1, min: 0, max: 60, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('presta', m); A.hh(dc.equal, m, .74); } },
  { id: 'dotct', g: 'Dépenses publiques', nom: 'Dotations aux collectivités', unit: 'Md€', y: 1, min: -20, max: 20, step: 0.5, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r, v = m / c.idx; A.spend('fonct', 0.4 * m, { ct: 1 }); A.spend('invest', 0.35 * m, { ct: 1 }); A.add('G', 0.4 * v); A.add('Ig', 0.35 * v); A.transfer('etat', 'ct', m); } },
  { id: 'esub', g: 'Dépenses publiques', nom: 'Bouclier sur les prix de l\'énergie', unit: 'Md€', y: 1, min: 0, max: 50, step: 1, sens: -1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.spend('subv', m); A.add('pE', -0.8 * m / (1650 * c.idx) * 100); } },
  // International
  { id: 'ppb', g: 'Investissement hors budget et prix', nom: 'Financements d\'un pôle public bancaire (hors budget)', unit: 'Md€', y: 0, min: 0, max: 200, step: 5, sens: 0, fx: (A, u, P, c) => { const ue = P.ppbCap > 0 ? P.ppbCap * (1 - Math.exp(-u / P.ppbCap)) : u; A.add('ieff', P.ppbAdd * c.sup * ue / (D.Y0 * D.sh.Ie * 1.027) * 100); A.add('ppbI', P.ppbAdd * c.sup * ue); A.add('ppbD', P.ppbDebt / 100 * u * c.idx); A.spend('subv', P.ppbLoss / 100 * u * c.idx, { etat: 1 }); } },
  { id: 'prixbloc', g: 'Investissement hors budget et prix', nom: 'Blocage de prix pris sur les marges (carburants, première nécessité)', unit: 'Md€', y: 0, min: 0, max: 40, step: 1, sens: 0, fx: (A, u, P, c) => { const m = u * c.idx, a = P.pbCap > 0 ? P.pbCap * (1 - Math.exp(-u / P.pbCap)) : u; A.add('pE', -0.8 * m / (1650 * c.idx) * 100); A.add('firmMargin', -a * c.idx); if (u - a > 0) A.spend('subv', (u - a) * c.idx, { etat: 1 }); A.rev('tva', -0.167 * m, TVA_SPLIT, { mal: .25 }); A.add('ieff', -0.05 * a); } },
  { id: 'tariff', g: 'International', nom: 'Droits de douane aux frontières', unit: 'pt', y: 0, min: 0, max: 30, step: 1, sens: 0, fx: (A, u) => { A.add('tariff', u); } },
  { id: 'eu', g: 'International', nom: 'Contribution au budget européen', unit: 'Md€', y: 1, min: -15, max: 10, step: 0.5, sens: -1, fx: (A, u, P, c) => { A.spend('autres', u * c.idx * c.r); } }
];
const LEV = {}; LEVERS.forEach(l => LEV[l.id] = l);
LEV.fraude = { id: 'fraude', nom: 'Fraude', unit: 'Md€', y: 1, sens: 1, hidden: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('autres', m); A.hh(dc.cap, -0.4 * m, .6); A.add('firmMargin', -0.6 * m); } };
LEV.fin = { id: 'fin', nom: 'Finance', unit: 'Md€', y: 1, sens: 1, hidden: 1, fx: (A, u, P, c) => { const m = u * c.idx * c.r; A.rev('autres', m); A.hh(dc.cap, -0.5 * m, .55); A.add('firmMargin', -0.3 * m); A.add('eq', -0.3 * u); } };
/* Canaux proposés pour les mesures libres */
const CUSTOM_CH = [
  { id: 'c_revmen', nom: 'Recette nouvelle sur les ménages aisés', lever: 'isf', sens: 1 },
  { id: 'c_revall', nom: 'Recette nouvelle sur tous les ménages', lever: 'csg', div: 17, sens: 1 },
  { id: 'c_revent', nom: 'Recette nouvelle sur les entreprises', lever: 'isge', sens: 1 },
  { id: 'c_revfin', nom: 'Recette nouvelle sur la finance et les marchés', lever: 'fin', sens: 1 },
  { id: 'c_fraude', nom: 'Lutte contre la fraude, recettes récupérées', lever: 'fraude', sens: 1 },
  { id: 'c_eco', nom: 'Économies de fonctionnement', lever: 'gfonct', neg: 1, sens: 1 },
  { id: 'c_ecosoc', nom: 'Économies sur les prestations sociales', lever: 'benfam', neg: 1, sens: 1 },
  { id: 'c_translow', nom: 'Aide nouvelle aux ménages modestes', lever: 'benlow', sens: -1 },
  { id: 'c_transall', nom: 'Aide nouvelle à tous les ménages', lever: 'univ', sens: -1 },
  { id: 'c_invest', nom: 'Programme d\'investissement public', lever: 'ipub', sens: -1 },
  { id: 'c_aideent', nom: 'Aide nouvelle aux entreprises', lever: 'subv', sens: -1 },
  { id: 'c_cout', nom: 'Baisse du coût du travail', lever: 'cotall', neg: 1, sens: -1 },
  { id: 'c_tfp', nom: 'Gain de productivité attendu', struct: 'tfp', unit: '%' },
  { id: 'c_lfs', nom: 'Hausse de l\'offre de travail attendue', struct: 'lfs', unit: '%' },
  { id: 'c_nairu', nom: 'Baisse du chômage structurel attendue', struct: 'nairu', neg: 1, unit: 'pts' }
];

/* ---------- Microsimulation : distributions synthétiques des revenus, des patrimoines et des héritages ----------
   Sert aux mesures définies par assiette (qui est touché, à quel taux) et aux barèmes d'impôt sur le revenu et de CSG.
   Revenus annuels nets avant impôt, valeurs 2026. Les formes sont calées sur les grandeurs publiées (médiane, neuvième
   décile, centile supérieur) et les totaux sur les masses du modèle. */
const MICRO = (function () {
  function invNorm(p) {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    let q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  // population : effectif (millions), médiane, dispersion, queues de Pareto au-delà de P95 et P99, position dans l'échelle des niveaux de vie
  function build(o) {
    const p95 = o.med * Math.exp(1.6449 * o.sig), p99 = p95 * Math.pow(5, 1 / o.a1);
    const Q = p => p <= 0.95 ? o.med * Math.exp(o.sig * invNorm(Math.max(p, 2e-3))) : p <= 0.99 ? p95 * Math.pow(0.05 / (1 - p), 1 / o.a1) : p99 * Math.pow(0.01 / (1 - p), 1 / o.a2);
    const cells = [], seg = (p0, p1, n) => { for (let i = 0; i < n; i++) { const a = p0 + (p1 - p0) * i / n, b = p0 + (p1 - p0) * (i + 1) / n; cells.push({ p: (a + b) / 2, w: (b - a) * o.n, y: Q((a + b) / 2) }); } };
    seg(0, 0.9, 90); seg(0.9, 0.99, 36); seg(0.99, 0.999, 18); seg(0.999, 0.9999, 9); seg(0.9999, 0.99999, 5);
    cells.push({ p: 0.999995, w: 0.00001 * o.n, y: Q(0.99999) * o.a2 / (o.a2 - 1) });
    const tot = cells.reduce((s, c) => s + c.w * c.y, 0) / 1000, k = o.total / tot; // calage sur la masse macroéconomique
    cells.forEach(c => { c.y *= k; c.pop = o.id; const q = Math.min(0.9999, o.q0 + o.q1 * c.p), d = Math.floor(q * 10); c.dw = [[d, 0.7], [Math.max(0, d - 1), 0.15], [Math.min(9, d + 1), 0.15]]; });
    return cells;
  }
  const W = build({ id: 'W', n: 30.7, med: 26400, sig: 0.55, a1: 2.5, a2: 2.0, total: 1045, q0: 0.12, q1: 0.88 });  // revenus d'activité nets
  const R = build({ id: 'R', n: 17.2, med: 20000, sig: 0.45, a1: 3.2, a2: 2.8, total: 390, q0: 0.08, q1: 0.90 });   // pensions nettes
  const ALL = W.concat(R);
  const GROSS = 1 / 0.785, PGROSS = 1 / 0.93;
  const bar = (x, B) => { let t = 0; for (let i = 0; i < B.length; i++) { const lo = B[i][0], hi = i + 1 < B.length ? B[i + 1][0] : Infinity; if (x > lo) t += (Math.min(x, hi) - lo) * B[i][1] / 100; else break; } return t; };
  const marg = (x, B) => { let r = 0; for (let i = 0; i < B.length; i++) if (x >= B[i][0]) r = B[i][1]; return r / 100; };
  const IR_NOW = [[0, 0], [11600, 11], [29579, 30], [84577, 41], [181917, 45]]; // barème 2026 (revenus 2025), par part
  const IR_LFI = [[0, 1], [10292, 5], [15438, 10], [20584, 15], [27789, 20], [30876, 25], [33964, 30], [38081, 35], [44256, 40], [61752, 45], [102921, 50], [144089, 55], [267594, 60], [411683, 90]];
  // Barème de CSG : le découpage en 14 tranches n'est pas publié. Celui-ci est construit par la maquette pour respecter les trois repères affichés :
  // baisse pour tout salarié sous 4 000 € nets par mois, hausse progressive au-delà, rendement d'ensemble avec l'impôt sur le revenu proche de 5,5 Md€.
  const CSG_LFI = [[0, 4], [12000, 7.8], [18000, 9], [24000, 9.8], [30000, 10.6], [36000, 11.2], [48000, 11.7], [61000, 12.2], [80000, 12.6], [100000, 13.1], [130000, 13.5], [180000, 13.8], [260000, 14.2], [400000, 14.5]];
  const CSG_NOW = 0.9825 * 0.097; // CSG et CRDS sur les revenus d'activité, en part du brut
  const taxable = y => y - Math.min(0.1 * y, 14426);
  const decote = t => t < 1964 ? Math.max(0, t - Math.max(0, 889 - 0.4525 * t)) : t; // conservée tant que la première tranche reste à 0 %
  const irNow = tx => decote(bar(tx, IR_NOW));
  const csgPens = g => g * (g < 14500 ? 0 : g < 18800 ? 0.043 : g < 29000 ? 0.074 : 0.091);
  const irBase = ALL.reduce((s, c) => s + c.w * irNow(taxable(c.y * (c.pop === 'W' ? 1.03 : 1))), 0) / 1000;
  const K_IR = 91 / irBase; // quotient familial et conjugal, réductions et crédits d'impôt : calage sur la recette observée
  const dist = f => { const o = new Array(10).fill(0); ALL.forEach(c => { const v = c.w * f(c) / 1000; if (v) c.dw.forEach(x => o[x[0]] += v * x[1]); }); return o; };
  const cache = {};
  /* Barème : { ir: [[seuil annuel par part, taux %]…] ou null, csg: [[seuil annuel brut, taux %]…] ou null, garde: seuil mensuel net sous lequel personne ne perd } */
  function bareme(b, eti) {
    const key = JSON.stringify([b && b.ir, b && b.csg, b && b.garde, eti]), garde = b && +b.garde || 0; if (cache[key]) return cache[key];
    const IRB = b && b.ir && b.ir.length ? b.ir.slice().sort((x, y) => x[0] - y[0]) : null, CSB = b && b.csg && b.csg.length ? b.csg.slice().sort((x, y) => x[0] - y[0]) : null;
    const one = (pop, y, react) => { // impôts annuels d'une personne seule : [IR actuel, IR nouveau, CSG actuelle, CSG nouvelle]
      const w = pop === 'W', tx = taxable(y * (w ? 1.03 : 1)), g = y * (w ? GROSS : PGROSS);
      const ir0 = K_IR_(irNow(tx)), cs0 = w ? g * CSG_NOW : csgPens(g);
      let f = 1;
      if (react && eti > 0 && y > 100000) { const t0 = marg(tx, IR_NOW) + 0.097, t1 = (IRB ? marg(tx, IRB) : marg(tx, IR_NOW)) + (CSB && w ? marg(g, CSB) : 0.097); f = Math.pow(Math.max(0.05, 1 - t1) / Math.max(0.05, 1 - t0), eti); }
      const ir1 = IRB ? K_IR_(IRB[0][1] === 0 ? decote(bar(tx * f, IRB)) : bar(tx * f, IRB)) : ir0 * f;
      const cs1 = CSB ? (w ? bar(g * f, CSB) : Math.min(csgPens(g), bar(g, CSB))) : cs0 * f;
      if (garde && y < garde * 12 && ir1 + cs1 > ir0 + cs0) return [ir0, ir0 + cs0 - cs1, cs0, cs1]; // clause de sauvegarde : aucun perdant sous le seuil
      return [ir0, ir1, cs0, cs1];
    };
    function K_IR_(v) { return v * K_IR; }
    let win = 0, lose = 0, n = 0, aIR = 0, aCSG = 0;
    const dIRd = new Array(10).fill(0), dCSGd = new Array(10).fill(0);
    ALL.forEach(c => { const r = one(c.pop, c.y, true), di = c.w * (r[1] - r[0]) / 1000, dc2 = c.w * (r[3] - r[2]) / 1000; c.dw.forEach(x => { dIRd[x[0]] += di * x[1]; dCSGd[x[0]] += dc2 * x[1]; }); n += c.w; if (r[1] + r[3] < r[0] + r[2] - 1) win += c.w; else if (r[1] + r[3] > r[0] + r[2] + 1) lose += c.w; if (c.pop === 'W') { aIR += di; aCSG += dc2; } });
    const dIR = sum(dIRd), dCSG = sum(dCSGd);
    const gain = m => { const r = one('W', m * 12, false); return (r[0] + r[2]) - (r[1] + r[3]); };
    let cross = null; if (gain(1500) > 0) { let lo = 1500, hi = 40000; if (gain(hi) < 0) { for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (gain(m) > 0) lo = m; else hi = m; } cross = lo; } }
    const cas = [1478, 2000, 2500, 3000, 4000, 5000, 8000, 15000].map(m => ({ net: m, gain: gain(m) }));
    return cache[key] = { dIR, dCSG, dIRd, dCSGd, actIR: dIR ? aIR / dIR : 0.8, actCSG: dCSG ? aCSG / dCSG : 1, win: win / n * 100, lose: lose / n * 100, cross, cas };
  }
  /* Assiettes de revenus : seuils en euros nets par mois */
  function revBase(pop, lo, hi, margOnly) {
    const cells = pop === 'W' ? W : pop === 'R' ? R : ALL, L = (lo || 0) * 12, H = hi ? hi * 12 : Infinity; let n = 0, base = 0, act = 0; const dec = new Array(10).fill(0);
    cells.forEach(c => { if (c.y < L || (!margOnly && c.y >= H)) return; const v = c.w * (margOnly ? Math.min(c.y, H) - L : c.y) / 1000; if (c.y < H) n += c.w; base += v; if (c.pop === 'W') act += v; c.dw.forEach(x => dec[x[0]] += v * x[1]); });
    return { n, base, dec: base ? dec.map(v => v / base) : dc.equal, act: base ? act / base : 1 };
  }
  // tables : [seuil, effectif au-dessus, masse au-dessus]
  const WEALTH = [[0, 31, 14500], [0.185, 15.5, 13500], [0.72, 3.1, 7400], [1.3, 1.24, 5200], [2.5, 0.31, 3700], [10, 0.031, 2300], [50, 0.0031, 1650], [100, 0.0018, 1450], [245, 0.0005, 1200], [1000, 0.000147, 800], [10000, 0.00001, 350]]; // M€, millions de ménages, Md€
  const SUCC = [[0, 1500, 350], [70, 750, 325], [150, 400, 285], [500, 150, 215], [1000, 70, 160], [2000, 28, 105], [5000, 8, 60], [12000, 2, 32], [50000, 0.25, 14], [200000, 0.03, 6]]; // k€, milliers d'héritiers par an, Md€ par an
  function above(T, x) {
    if (!(x > 0)) return [T[0][1], T[0][2]]; const last = T[T.length - 1]; if (x >= last[0]) { const f = Math.pow(last[0] / x, 1.5); return [last[1] * f, Math.max(last[2] * Math.sqrt(f), 0)]; }
    let i = 0; while (i + 1 < T.length && T[i + 1][0] <= x) i++; const a = T[i], b = T[i + 1];
    if (a[0] <= 0) { const u = x / b[0]; return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
    const u = Math.log(x / a[0]) / Math.log(b[0] / a[0]); return [a[1] * Math.pow(b[1] / a[1], u), a[2] * Math.pow(b[2] / a[2], u)];
  }
  function tableBase(T, lo, hi, margOnly, unit) { // unit : conversion seuil × effectif → Md€
    const A = above(T, lo || 0), Bv = hi ? above(T, hi) : [0, 0]; const n = A[0] - Bv[0];
    const base = margOnly ? Math.max(0, (A[1] - (lo || 0) * A[0] * unit) - (hi ? Bv[1] - hi * Bv[0] * unit : 0)) : A[1] - Bv[1];
    return { n, base };
  }
  return { W, R, ALL, bar, bareme, revBase, wealthBase: (lo, hi, m) => tableBase(WEALTH, lo, hi, m, 1000), succBase: (lo, hi, m) => tableBase(SUCC, lo, hi, m, 0.001), IR_NOW, IR_LFI, CSG_LFI, K_IR };
})();

/* ---------- Mesures définies par assiette ----------
   kind 'tax' : taux en % de l'assiette ; 'cash' : euros par mois et par personne. seuils : unité des bornes. */
const jobsBand = P => [P.jobsLow, 0.5 * (P.jobsLow + P.jobsAll), P.jobsAll, 0.4 * P.jobsAll, 1.4 * P.jobsAll];
const ASSIETTES = [
  { id: 'a_rev', g: 'Prélèvement sur des revenus', nom: 'Revenus d\'activité et pensions', kind: 'tax', seuil: '€ nets par mois', who: 'personnes', base: m => MICRO.revBase('ALL', m.lo, m.hi, m.marg),
    fx: (A, md, x, P, c) => { A.rev('ir', md); A.hhv(x.dec, -md, -md * x.act, -md * (1 - x.act)); } },
  { id: 'a_sal', g: 'Prélèvement sur des revenus', nom: 'Salaires et revenus d\'activité', kind: 'tax', seuil: '€ nets par mois', who: 'actifs', base: m => MICRO.revBase('W', m.lo, m.hi, m.marg),
    fx: (A, md, x, P, c) => { A.rev('csg', md, { secu: 1 }, { mal: .45, fam: .10, vie: .15, aut: .12, une: .11 }); A.hhv(x.dec, -md, -md, 0); } },
  { id: 'a_pens', g: 'Prélèvement sur des revenus', nom: 'Pensions de retraite', kind: 'tax', seuil: '€ nets par mois', who: 'retraités', base: m => MICRO.revBase('R', m.lo, m.hi, m.marg),
    fx: (A, md, x, P, c) => { A.rev('csg', md, { secu: 1 }, { mal: .6, vie: .4 }); A.hhv(x.dec, -md, 0, -md); } },
  { id: 'a_cap', g: 'Prélèvement sur des revenus', nom: 'Revenus du capital des ménages (dividendes, intérêts, plus-values)', kind: 'tax', who: '', base: () => ({ n: 0, base: 95, dec: dc.cap, act: .55 }),
    fx: (A, md, x, P, c) => { A.rev('cap', md); A.hhv(dc.cap, -md, -md * .55, -md * .45); A.add('ieff', -0.04 * md / c.idx); } },
  { id: 'a_pat', g: 'Prélèvement sur le patrimoine', nom: 'Patrimoine net des ménages', kind: 'tax', seuil: 'M€', who: 'ménages', base: m => { const b = MICRO.wealthBase(m.lo, m.hi, m.marg); b.dec = (m.lo || 0) >= 1 ? dc.wealth : dc.cap; b.act = .55; b.sav = (m.lo || 0) >= 100 ? 0.85 : (m.lo || 0) >= 10 ? 0.7 : (m.lo || 0) >= 1.3 ? 0.3 : 0; return b; },
    fx: (A, md, x, P, c) => { const u = md / c.idx; A.rev('cap', md); A.hhv(x.dec, -md, -md * .55, -md * .45); A.add('csave', md * x.sav * 0.35); A.add('attr', -0.15 * u * (1 - 0.5 * x.sav)); A.add('ieff', -0.03 * u); } },
  { id: 'a_succ', g: 'Prélèvement sur le patrimoine', nom: 'Héritages et donations reçus', kind: 'tax', seuil: 'k€ reçus', who: 'héritiers par an', milliers: 1, base: m => { const b = MICRO.succBase(m.lo, m.hi, m.marg); b.n = b.n / 1000; b.dec = dc.succ; b.act = .7; return b; },
    fx: (A, md, x, P, c) => { A.rev('cap', md); A.hhv(dc.succ, -0.5 * md, -0.35 * md, -0.15 * md); } },
  { id: 'a_benef', g: 'Prélèvement sur les entreprises', nom: 'Bénéfices imposables des entreprises', kind: 'tax', grp: [['all', 'Toutes les entreprises', 1], ['ge', 'Grandes entreprises', .45], ['geeti', 'Grandes entreprises et ETI', .70], ['pmetpe', 'PME et TPE', .30]], who: '', base: m => { const g = ASS.a_benef.grp.find(x => x[0] === m.grp) || ASS.a_benef.grp[0]; return { n: 0, base: 270 * g[2], dec: dc.cap, act: .55, ge: g[0] === 'ge' || g[0] === 'geeti' }; },
    fx: (A, md, x, P, c) => { const u = md / c.idx, pt = u / 2.7; A.rev('is', md); A.add('isAmt', md); if (x.ge) A.add('isGe', u); A.add('ieff', -0.4 * pt * (x.ge ? 0.6 : 1)); A.add('attr', -1.0 * pt); A.hhv(dc.cap, -0.2 * md, -0.11 * md, -0.09 * md); } },
  { id: 'a_ms', g: 'Prélèvement sur les entreprises', nom: 'Masse salariale du privé (cotisations patronales)', kind: 'tax', grp: [['b1', 'Salaires jusqu\'à 1,6 SMIC', .30], ['b2', 'De 1,6 à 2,5 SMIC', .30], ['b3', 'De 2,5 à 3,5 SMIC', .16], ['b4', 'Au-delà de 3,5 SMIC', .24], ['all', 'Tous les salaires', 1]], who: '', base: m => { const i = Math.max(0, ASS.a_ms.grp.findIndex(x => x[0] === m.grp)); return { n: 0, base: D.MSpriv * ASS.a_ms.grp[i][2], dec: dc.wages, act: 1, band: i }; },
    fx: (A, md, x, P, c) => { const u = md / c.idx; A.rev('cot', md, { secu: 1 }, { mal: .30, vie: .40, fam: .12, une: .18 }); A.add('ucost', md); if (x.band === 0) { A.add('cotLowAmt', md); A.add('nairu', 0.02 * u * c.sup); } A.add('jobs', -jobsBand(P)[x.band] * u * c.sup); if (x.band >= 2) A.add('attr', -0.2 * u); } },
  { id: 'v_adultes', g: 'Versement à des personnes', nom: 'Adultes selon leur revenu', kind: 'cash', seuil: '€ nets par mois', who: 'personnes', base: m => MICRO.revBase('ALL', m.lo, m.hi, false), split: { etat: .7, secu: .3 } },
  { id: 'v_retraites', g: 'Versement à des personnes', nom: 'Retraités', kind: 'cash', who: 'retraités', pop: 17.2, dec: 'pens', act: 0, split: { secu: .85, etat: .15 }, br: { vie: .62, comp: .23 } },
  { id: 'v_salaries', g: 'Versement à des personnes', nom: 'Salariés du privé', kind: 'cash', who: 'salariés', pop: 20.8, dec: 'wages', act: 1, split: { etat: 1 } },
  { id: 'v_public', g: 'Versement à des personnes', nom: 'Agents publics', kind: 'cash', who: 'agents', pop: 5.8, dec: 'pubw', act: 1, split: { etat: .45, ct: .3, secu: .25 } },
  { id: 'v_jeunes', g: 'Versement à des personnes', nom: 'Jeunes de 18 à 24 ans', kind: 'cash', who: 'jeunes', pop: 5.5, dec: 'ben', act: 1, split: { etat: 1 } },
  { id: 'v_enfants', g: 'Versement à des personnes', nom: 'Enfants de moins de 18 ans (versé aux familles)', kind: 'cash', who: 'enfants', pop: 14.2, dec: 'fam', act: .95, split: { secu: .7, etat: .3 }, br: { fam: .7 } },
  { id: 'v_chomeurs', g: 'Versement à des personnes', nom: 'Demandeurs d\'emploi indemnisés', kind: 'cash', who: 'allocataires', pop: 2.7, dec: 'jobs', act: 1, split: { secu: 1 }, br: { une: 1 } },
  { id: 'v_minima', g: 'Versement à des personnes', nom: 'Allocataires de minima sociaux', kind: 'cash', who: 'allocataires', pop: 4.3, dec: 'low', act: .85, split: { etat: .6, ct: .3, secu: .1 } },
  { id: 'v_tous', g: 'Versement à des personnes', nom: 'Tous les adultes', kind: 'cash', who: 'personnes', pop: 54.5, dec: 'equal', act: .74, split: { etat: 1 } }
];
const ASS = {}; ASSIETTES.forEach(a => ASS[a.id] = a);
/* Décrit une mesure par assiette : effectif touché (millions), assiette (Md€), montant annuel (Md€, positif = recette) */
function assInfo(m) {
  const a = ASS[m.ass]; if (!a) return null; const taux = +m.taux || 0;
  if (a.kind === 'cash') {
    const x = a.base ? a.base(m) : { n: a.pop, dec: dc[a.dec], act: a.act };
    return { a, x, n: x.n, base: null, md: -x.n * taux * 12 / 1000, mech: -x.n * taux * 12 / 1000 };
  }
  const x = a.base(m); return { a, x, n: x.n, base: x.base, md: x.base * taux / 100, mech: x.base * taux / 100 };
}

/* ---------- Chocs exogènes ---------- */
const decay = (I, k, t0, v, r, n) => { for (let t = t0, x = v; t < N && (n === undefined || t < t0 + n); t++, x *= r) I[k][t] += x; };
// Rendement plafonné : jusqu'à m0 Md€ l'impôt rentre en entier ; au-delà il tend vers un plafond smax (évitement, départs, assiette qui fond)
const sat = (u, m0, smax, P) => (!P.taxSat || u <= m0) ? u : m0 + (smax - m0) * (1 - Math.exp(-(u - m0) / (smax - m0)));
const SHOCKS = [
  { id: 'energie', glob: 1, nom: 'Choc énergétique', desc: 'Envolée du pétrole et du gaz', lv: ['+25 %', '+50 %', '+100 %'], fx: (I, t, i) => { decay(I, 'pen', t, [25, 50, 100][i], 0.6); decay(I, 'wd', t, -[0.3, 0.7, 1.5][i], 0.5); decay(I, 'conf', t, [0.2, 0.4, 0.8][i], 0.5); } },
  { id: 'dette', nom: 'Attaque des marchés sur la dette', desc: 'Envolée de l\'écart de taux avec l\'Allemagne. Ampleur indiquée pour 55 % de dette détenue à l\'étranger ; elle suit ce réglage', lv: ['+1 pt', '+2 pts', '+4 pts'], fx: (I, t, i, P) => { const k = P ? 0.5 + 0.5 * P.nrShare / D.nrRef : 1; decay(I, 'spread', t, [1, 2, 4][i] * k, 0.7); decay(I, 'cspread', t, [0.5, 1, 2][i], 0.6); decay(I, 'conf', t, [0.3, 0.7, 1.5][i], 0.6); decay(I, 'eq', t, -[8, 15, 25][i], 0.6); } },
  { id: 'panique', glob: 1, nom: 'Panique financière', desc: 'Krach du CAC 40 et gel du crédit', lv: ['−20 %', '−35 %', '−50 %'], fx: (I, t, i) => { decay(I, 'eq', t, -[20, 35, 50][i], 0.6); decay(I, 'cspread', t, [1, 2, 3.5][i], 0.5); decay(I, 'conf', t, [0.5, 1, 2][i], 0.5); decay(I, 'ieshock', t, -[2, 4, 7][i], 0.4); decay(I, 'spread', t, [0.2, 0.4, 0.8][i], 0.6); decay(I, 'wd', t, -[0.5, 1.5, 3][i], 0.5); } },
  { id: 'recession', glob: 1, nom: 'Récession mondiale', desc: 'Chute de la demande adressée à la France', lv: ['−3 %', '−6 %', '−10 %'], fx: (I, t, i) => { decay(I, 'wd', t, -[3, 6, 10][i], 0.55); decay(I, 'eq', t, -[10, 20, 35][i], 0.5); decay(I, 'pen', t, -[10, 20, 30][i], 0.5); decay(I, 'conf', t, [0.3, 0.6, 1.2][i], 0.5); decay(I, 'ieshock', t, -[1, 2, 4][i], 0.5); } },
  { id: 'commerce', glob: 1, nom: 'Guerre commerciale', desc: 'Barrières douanières contre les exportations', lv: ['Modérée', 'Forte', 'Totale'], fx: (I, t, i) => { decay(I, 'xshock', t, -[2, 4, 8][i], 0.92); decay(I, 'tariff', t, [2, 4, 8][i], 0.92); decay(I, 'ieshock', t, -[1, 2, 3.5][i], 0.6); decay(I, 'eq', t, -[4, 8, 15][i], 0.6); } },
  { id: 'pandemie', glob: 1, nom: 'Pandémie', desc: 'Confinements et arrêt d\'activité', lv: ['Courte', 'Sévère', 'Type 2020'], fx: (I, t, i) => { const c = [3, 6.5, 11][i]; decay(I, 'cshock', t, -c, 0.3, 2); decay(I, 'ieshock', t, -[3, 7, 12][i], 0.3, 2); decay(I, 'xshock', t, -[4, 8, 15][i], 0.3, 3); decay(I, 'tour', t, -[15, 35, 60][i], 0.4, 3); decay(I, 'tfp', t, -[0.3, 0.6, 1.2][i], 0.5); decay(I, 'emp', t, [150, 450, 900][i], 0.35, 3); const s = [10, 25, 45][i], a = [15, 40, 90][i]; for (let k = 0; k < 2 && t + k < N; k++) { const f = k ? 0.3 : 1, A = acc(I, t + k); A.spend('presta', s * f, { secu: 1 }, { mal: 1 }); A.add('G', s * f); A.spend('subv', a * f); A.add('firmMargin', a * f * 0.5); A.hh(dc.wages, a * f * 0.5, 1); } } },
  { id: 'ia', glob: 1, nom: 'Choc de productivité (IA)', desc: 'Gains de productivité rapides, emplois déplacés', lv: ['+0,3 pt/an', '+0,6 pt/an', '+1,2 pt/an'], fx: (I, t, i) => { const g = [0.3, 0.6, 1.2][i]; for (let k = t; k < N; k++) { I.tfp[k] += g * Math.min(5, k - t + 1); I.tech[k] += 3 * g * Math.min(5, k - t + 1); I.ieff[k] += [1, 2, 4][i] * Math.max(0, 1 - (k - t) / 6); I.nairu[k] += [0.2, 0.4, 0.8][i] * Math.max(0, 1 - Math.abs(k - t - 2) / 4); } } },
  { id: 'demo', nom: 'Choc démographique', desc: 'Vieillissement accéléré, pénurie d\'actifs', lv: ['Modéré', 'Marqué', 'Fort'], fx: (I, t, i) => { const g = [0.2, 0.4, 0.8][i]; for (let k = t; k < N; k++) { const n = Math.min(5, k - t + 1); I.lfs[k] -= g * n; const A = acc(I, k); A.spend('presta', [1.5, 3, 6][i] * n, { secu: 1 }, { vie: .5, mal: .3, aut: .2 }); A.hh(dc.pens, [0.8, 1.6, 3.2][i] * n, 0); } } },
  { id: 'climat', nom: 'Catastrophe climatique', desc: 'Destructions, récoltes perdues, reconstruction', lv: ['Régionale', 'Majeure', 'Extrême'], fx: (I, t, i) => { I.kdes[t] += [0.3, 0.8, 2.0][i]; decay(I, 'agri', t, -[5, 12, 25][i], 0.4); decay(I, 'tour', t, -[3, 8, 15][i], 0.5); decay(I, 'cshock', t, -[0.2, 0.6, 1.5][i], 0.3, 2); I.pInd[t] += [0.2, 0.5, 1.0][i]; decay(I, 'tfp', t, -[0.05, 0.15, 0.4][i], 0.9); const r = [5, 15, 40][i]; [0.4, 0.35, 0.25].forEach((f, k) => { if (t + k < N) { const A = acc(I, t + k); A.spend('invest', r * f, { etat: .6, ct: .4 }); A.add('Ig', r * f); I.ihshock[t + k] += [1, 3, 7][i] * f * 2; } }); } }
];
const PILOT = [
  { id: 'ecb', nom: 'Taux de dépôt de la BCE', unit: '%', min: 0, max: 7, step: 0.25, def: null, abs: 'ecbBase' },
  { id: 'spread', nom: 'Écart de taux France-Allemagne, choc', unit: 'pts', min: -1, max: 5, step: 0.1, def: 0 },
  { id: 'wd', nom: 'Demande mondiale adressée à la France', unit: '%', min: -15, max: 10, step: 0.5, def: 0 },
  { id: 'pen', nom: 'Prix de l\'énergie importée', unit: '%', min: -50, max: 150, step: 5, def: 0 },
  { id: 'eur', nom: 'Taux de change de l\'euro', unit: '%', min: -25, max: 25, step: 1, def: 0 },
  { id: 'emp', nom: 'Emploi, choc direct', unit: 'milliers', min: -1000, max: 1000, step: 25, def: 0 },
  { id: 'tfp', nom: 'Productivité, choc de niveau', unit: '%', min: -5, max: 8, step: 0.25, def: 0 },
  { id: 'conf', nom: 'Taux d\'épargne des ménages, choc', unit: 'pts', min: -4, max: 6, step: 0.25, def: 0 },
  { id: 'wshock', nom: 'Salaires du privé, choc de niveau', unit: '%', min: -5, max: 10, step: 0.5, def: 0 },
  { id: 'wDE', part: 1, pays: 'Allemagne', nom: 'Allemagne : hausse annuelle du coût du travail', unit: '% par an', min: 0, max: 8, step: 0.1, def: null, abs: 'wDE0' },
  { id: 'wIT', part: 1, pays: 'Italie', nom: 'Italie : hausse annuelle du coût du travail', unit: '% par an', min: 0, max: 8, step: 0.1, def: null, abs: 'wIT0' },
  { id: 'wES', part: 1, pays: 'Espagne', nom: 'Espagne : hausse annuelle du coût du travail', unit: '% par an', min: 0, max: 8, step: 0.1, def: null, abs: 'wES0' },
  { id: 'wUS', part: 1, pays: 'États-Unis', nom: 'États-Unis : hausse annuelle du coût du travail', unit: '% par an', min: 0, max: 8, step: 0.1, def: null, abs: 'wUS0' },
  { id: 'wCN', part: 1, pays: 'Chine', nom: 'Chine : hausse annuelle du coût du travail', unit: '% par an', min: 0, max: 12, step: 0.1, def: null, abs: 'wCN0' }
];
// poids des partenaires : part dans les échanges de biens de la France en 2024 (douanes, direction du Trésor)
const PARTW = { wDE: 0.13, wIT: 0.08, wES: 0.075, wUS: 0.08, wCN: 0.07 };

/* ---------- Construction des impulsions ---------- */
function scenFactors(P, s) {
  if (s === 'pess') return { good: P.pessYield, bad: P.pessCost, sup: P.pessSupply, supDn: 2 - P.pessSupply, mkt: P.pessMkt, k: 0, cpt: P.scenCompta };
  if (s === 'opt') return { good: P.optYield, bad: P.optCost, sup: P.optSupply, supDn: 2 - P.optSupply, mkt: P.optMkt, k: 2, cpt: P.scenCompta };
  return { good: 1, bad: 1, sup: 1, supDn: 1, mkt: 1, k: 1, cpt: 0 };
}
/* Rendement des mesures (scénarios pessimiste et optimiste).
   L'effet sur l'économie est celui de la mesure annoncée ; l'écart de rendement ne touche que les comptes publics.
   Effets d'offre : le scénario réduit ceux qui servent l'économie et grossit ceux qui la desservent (et l'inverse en optimiste). */
const SUP_BAD = { nairu: 1 }; // canaux d'offre où une hausse dessert l'économie
function rec() { const R = { ops: [] }; ['rev', 'spend', 'hh', 'transfer', 'hhv', 'add'].forEach(k => R[k] = (...a) => R.ops.push([k, a])); return R; }
function scenApply(A, F, sf, call) { // call(acc, r, sup)
  const e1 = rec(); call(e1, 1, 1);
  let e0 = null; if (F.sup !== 1) { e0 = rec(); call(e0, 1, 0); if (e0.ops.length !== e1.ops.length) e0 = null; }
  e1.ops.forEach(([k, a], i) => {
    if (k === 'add' && e0) { const d = a[1] - e0.ops[i][1][1]; if (d) { const bad = SUP_BAD[a[0]] ? d > 0 : d < 0; A.add(a[0], e0.ops[i][1][1] + d * (bad ? F.supDn : F.sup)); return; } }
    A[k](...a);
  });
  if (sf === 1) return;
  const b = rec(); call(b, sf, 1); if (b.ops.length !== e1.ops.length) return;
  b.ops.forEach(([k, a], i) => { const a1 = e1.ops[i][1];
    if (k === 'rev' || k === 'spend') { const d = a[1] - a1[1]; if (d) A[k](a[0], d, a[2], a[3]); }
    else if (k === 'transfer') { const d = a[2] - a1[2]; if (d) A.transfer(a[0], a[1], d); } });
}
function phase(m, t) { // t : indice d'année
  const s = Math.max(1, (m.start || 2027) - 2026); if (t < s) return 0;
  if (m.end && YEARS[t] > m.end) return 0;
  const ramp = Math.max(1, m.ramp || 1); let f = Math.min(1, (t - s + 1) / ramp);
  if (t === 1) f *= 0.5; // mesures applicables à partir de juillet 2027
  return f;
}
function buildImpulses(P, B, prog, shocks, pilot, scen) {
  const I = newImp(), F = scenFactors(P, scen);
  // crises mondiales : on garde à part leurs seules impulsions, pour calculer ce que deviennent les prix chez les partenaires
  const globs = (shocks || []).filter(s => s.on && (SHOCKS.find(d => d.id === s.id) || {}).glob);
  if (prog !== '__glob' && globs.length) I.shockOnly = buildImpulses(P, B, '__glob', globs, null, 'central');
  if (prog === '__glob') prog = null;
  (prog && prog.measures || []).forEach(m => {
    if (m.off) return;
    if (m.bar) {
      const info = MICRO.bareme(m.bar, P.eti), g = v => v > 0 ? v * F.good : v, ir = info.dIRd.map(g), cs = info.dCSGd.map(g), irE = F.cpt ? info.dIRd : ir, csE = F.cpt ? info.dCSGd : cs, sE = F.cpt ? (sum(info.dIRd) + sum(info.dCSGd)) : 0;
      for (let t = 1; t < N; t++) { const f = phase(m, t); if (!f) continue; const k = f * B.Yn[t] / B.Yn[1], sIR = sum(ir) * k, sCS = sum(cs) * k, A = acc(I, t);
        A.rev('ir', sIR); A.rev('csg', sCS, { secu: 1 }, { mal: .45, fam: .10, vie: .15, aut: .12, une: .11 });
        const eIR = sum(irE) * k, eCS = sum(csE) * k; A.hhv(irE, -k, -eIR * info.actIR, -eIR * (1 - info.actIR)); A.hhv(csE, -k, -eCS * info.actCSG, -eCS * (1 - info.actCSG)); }
      return;
    }
    if (m.ass) {
      const info = assInfo(m); if (!info || !info.md) return;
      const hasCh = m.chiffre !== undefined && m.chiffre !== null && m.chiffre !== '', ratio = hasCh ? Math.abs(+m.chiffre) / Math.abs(info.md) : 1;
      for (let t = 1; t < N; t++) { const f = phase(m, t); if (!f) continue; const idx = B.Yn[t] / B.Yn[1], A = acc(I, t);
        const sfA = info.md < 0 ? F.bad : F.good;
        if (info.a.kind === 'cash') { const cost = -info.md * f * idx * ratio * sfA, costE = F.cpt ? -info.md * f * idx * ratio : cost; A.spend('presta', cost, info.a.split, info.a.br); A.hhv(info.x.dec, costE, costE * info.x.act, costE * (1 - info.x.act)); }
        else if (F.cpt) scenApply(A, F, sfA, (Z2, r, sup) => info.a.fx(Z2, info.md * f * idx * ratio * r, info.x, P, { idx, sup }));
        else info.a.fx(A, info.md * f * idx * ratio * sfA, info.x, P, { idx, sup: F.sup }); }
      return;
    }
    let lev, val, r0 = null;
    const s0 = Math.max(1, (m.start || 2027) - 2026);
    if (m.custom) {
      const ch = CUSTOM_CH.find(c => c.id === m.canal); if (!ch) return;
      const eff = (m.eff || [50, 100, 100])[F.k] / 100; val = +m.montant || 0; if (!val) return;
      if (ch.struct) { for (let t = 1; t < N; t++) { const f = phase(m, t); if (f) I[ch.struct][t] += (ch.neg ? -1 : 1) * val * eff * f; } return; }
      lev = LEV[ch.lever]; if (ch.neg) val = -val; if (ch.div) val = val / ch.div; r0 = eff;
    } else { lev = LEV[m.lever]; val = +m.value || 0; }
    if (!lev || !val) return;
    const hasC = !m.custom && m.chiffre !== undefined && m.chiffre !== null && m.chiffre !== '' && lev.unit !== 'Md€' && lev.y;
    const ratio = hasC ? Math.abs(+m.chiffre) / Math.abs(val * lev.y) : 1;
    for (let t = 1; t < N; t++) {
      let f = phase(m, t); if (!f) continue;
      if (lev.slow) f = Math.min(f, (t - s0 + 1) / lev.slow * (t === 1 ? 0.5 : 1));
      let u = val * f;
      if (lev.cumul) u = val * Math.max(0, t - s0 + (t === 1 ? 0.5 : 1));
      const sf = r0 !== null ? r0 : (lev.sens ? (lev.sens * val > 0 ? F.good : F.bad) : 1);
      const A = acc(I, t);
      if (F.cpt && r0 === null) scenApply(A, F, sf, (Z2, r, sup) => lev.fx(Z2, u, P, { idx: B.Yn[t] / B.Yn[1], r: r * ratio, sup }));
      else lev.fx(A, u, P, { idx: B.Yn[t] / B.Yn[1], r: sf * ratio, sup: r0 !== null ? r0 : F.sup });
    }
  });
  (shocks || []).forEach(s => { if (!s.on) return; const def = SHOCKS.find(x => x.id === s.id); const t = Math.max(1, (s.year || 2028) - 2026); if (def && t < N) def.fx(I, t, s.level || 0, P); });
  if (pilot) PILOT.forEach(p => {
    const v = pilot[p.id]; if (v === undefined || v === null) return;
    const dv = p.abs ? v - P[p.abs] : v; if (!dv) return;
    const t0 = Math.max(1, ((pilot.from && pilot.from[p.id]) || 2027) - 2026);
    for (let t = t0; t < N; t++) I[p.id][t] += dv;
  });
  I.mkt = F.mkt; I.mktAsym = F.cpt;
  return I;
}

/* ---------- Simulation ---------- */
function simulate(P, B, I, opt) {
  opt = opt || {};
  const R = { years: YEARS };
  const V = ['y', 'gdpG', 'gdpN', 'infl', 'u', 'empK', 'solde', 'def', 'debt', 'debtMd', 'int', 'intPct', 'prim', 'pa', 'paLvl', 'bal', 's80', 'oat', 'spread', 'ecb', 'cac', 'wageG', 'margin', 'potG', 'gapV', 'po', 'depPct', 'recMd', 'depMd', 'cG', 'ieG', 'xG', 'mG', 'ystar', 'p', 'dU', 'dE', 'rdbA', 'rdbR', 'tourVa', 'tourEmp', 'sanction', 'npe', 'xRev', 'xSp', 'effort', 'pen', 'pht', 'ca', 'intExt', 'sfHh', 'sfFirm', 'sfRow', 'wsh', 'dHh', 'dFirm', 'dPriv', 'credFlow'];
  V.forEach(k => R[k] = Z());
  R.dec = D.dec.rdb.map(() => Z()); R.sub = {}; ['etat', 'ct', 'secu'].forEach(k => R.sub[k] = { dep: Z(), rec: Z(), solde: Z() });
  R.br = {}; BRANCHES.forEach(b => R.br[b.id] = { dep: Z(), solde: Z() });
  R.recI = {}; Object.keys(D.R0).forEach(k => R.recI[k] = Z()); R.depN = {}; Object.keys(D.S0).forEach(k => R.depN[k] = Z());
  R.sec = {}; SECTORS.forEach(s => R.sec[s.id] = { va: Z(), emp: Z(), lvl: Z() });
  R.size = {}; SIZES.forEach(s => R.size[s.id] = { va: Z(), emp: Z(), inv: Z(), margin: Z() });
  R.trv = {}; TRANSV.forEach(s => R.trv[s.id] = { va: Z(), emp: Z(), inv: Z() });
  R.alerts = YEARS.map(() => []);
  const S = { cD: new Array(10).fill(0), cO: 0, penSm: 0, rr: 0, rrl: 0, c: 0, ie: 0, ih: 0, x: 0, p: 0, pht: 0, pEc: 0, pIc: 0, w: 0, e: 0, jd: 0, k: 0, kpub: 0, hyst: 0, y: 0, ym: 0, dpi: 0, iavg: 0, Dd: 0, debtR: 0, defR: 0, pm: 0, comp: 0, ebe: 0, ystar: 0, sanc: 0, eduC: 0, pPrev: 0, secE: {}, sizeE: {}, lvlPa: 1, tfpE: 0, DhDev: 0, DfDev: 0, rH: 0, rF: 0, nh: 0, caDev: 0, ulc: 0, part: 0, hOut: 0, keep: 0, tarE: 0, pp: 0, debtLvl: B.D[0] / B.Yn[0] * 100, prevDef: null, prevPrev: null, npePrev: B.dep[0] - B.int[0] };
  // lecture Keen : soldes sectoriels et dette privée
  const nrS = P.nrShare / 100, hhB0 = (D.RDB / D.Y0 - D.sh.C - D.sh.Ih) * 100;
  const otherInc = D.ca0 - B.bal[0] + nrS * B.int[0] / B.Yn[0] * 100; // revenus et transferts hors intérêts publics, % du PIB, calé sur 2026
  // crises mondiales : trajectoire des prix avec la seule crise, supposée commune aux partenaires commerciaux
  const pw = (I.shockOnly && !opt._inner) ? simulate(P, B, I.shockOnly, Object.assign({}, opt, { _inner: true, sanctions: false })).pht : null;
  const fill0 = () => {
    const t = 0; R.gdpG[0] = B.g[0]; R.gdpN[0] = B.Yn[0]; R.infl[0] = B.pi[0]; R.u[0] = B.u[0]; R.empK[0] = B.E[0];
    R.def[0] = B.def[0] / B.Yn[0] * 100; R.solde[0] = -R.def[0]; R.debt[0] = B.D[0] / B.Yn[0] * 100; R.debtMd[0] = B.D[0]; R.int[0] = B.int[0]; R.intPct[0] = B.int[0] / B.Yn[0] * 100;
    R.prim[0] = -(B.def[0] - B.int[0]) / B.Yn[0] * 100; R.pa[0] = B.rdbrG[0]; R.paLvl[0] = 100; R.bal[0] = B.bal[0]; R.oat[0] = B.oat[0]; R.spread[0] = P.spreadBase; R.ecb[0] = B.ecb[0]; R.cac[0] = B.cac[0];
    R.wageG[0] = 2.4; R.margin[0] = D.margin0; R.potG[0] = B.gpot[0]; R.pen[0] = 100; R.gapV[0] = B.gap[0]; R.po[0] = 43.9; R.depPct[0] = 57.1; R.recMd[0] = B.rec[0]; R.depMd[0] = B.dep[0];
    R.cG[0] = 0.4; R.ieG[0] = -1.5; R.xG[0] = 1.0; R.mG[0] = 0.5; R.s80[0] = s80(D.dec.rdb);
    ['etat', 'ct', 'secu'].forEach(k => ['dep', 'rec', 'solde'].forEach(m => R.sub[k][m][0] = B.sub[k][m][0]));
    BRANCHES.forEach(b => { R.br[b.id].dep[0] = B.br[b.id].dep[0]; R.br[b.id].solde[0] = B.br[b.id].solde[0]; });
    Object.keys(D.R0).forEach(k => R.recI[k][0] = B.recI[k][0]); Object.keys(D.S0).forEach(k => R.depN[k][0] = B.depN[k][0]);
    SECTORS.forEach(s => R.sec[s.id].lvl[0] = s.va / 100 * B.Yr[0] * 0.9);
    SIZES.forEach(s => R.size[s.id].margin[0] = s.m0);
    R.intExt[0] = nrS * B.int[0]; R.ca[0] = D.ca0; R.sfHh[0] = hhB0; R.sfRow[0] = -D.ca0; R.sfFirm[0] = D.ca0 - R.solde[0] - hhB0;
    R.wsh[0] = 100 - D.prodTaxVA - D.margin0; R.dHh[0] = D.dHh0; R.dFirm[0] = D.dFirm0; R.dPriv[0] = D.dHh0 + D.dFirm0;
  };
  fill0();
  const Epriv0 = D.E0 - D.Epub;
  const sectorW = SECTORS.map(s => s.va / 100);
  let prev = { C: B.C[0], Ie: B.Ie[0], X: B.X[0], M: B.M[0], Yr: B.Yr[0], rdbr: D.RDB, w: 0, E: B.E[0], pc: 1, ystarLvl: 1 };
  for (let t = 1; t < N; t++) {
    const nom = B.nom[t], Yb = B.Yr[t], Cb = B.C[t];
    const ecbDev = I.ecb[t] + P.tayFr * S.dpi; // la BCE réagit à l'inflation française, à proportion du poids de la France
    const sancSpread = S.sanc ? P.sanctionSpread : 0;
    const lam = P.demLed || 0; // 0 : l'offre fixe le potentiel ; 1 : le potentiel suit la demande
    const kap = P.kappaS + lam * (P.kappa - P.kappaS), ev = P.evict * (1 - lam); // multiplicateurs : plus faibles en lecture offre
    const amp = Math.exp(P.mktConv * Math.max(0, S.debtLvl - P.mktBase)); // marchés plus nerveux quand la dette est haute
    const sBase = (P.sDebt * S.debtR + P.sDef * S.defR) * amp, spreadDev = sBase * (I.mktAsym && sBase < 0 ? 1 / (I.mkt || 1) : (I.mkt || 1)) + I.spread[t] + sancSpread + lam * P.extSpread * Math.max(0, -S.caDev);
    const rl = P.passLong * ecbDev + spreadDev + P.fisher * S.dpi, rs = ecbDev; // le taux long compense une part de l'inflation
    const lend = 0.5 * rs + 0.5 * rl + I.cspread[t];
    const wd = I.wd[t] - P.ecbWd * 0.5 * (I.ecb[t] + I.ecb[t - 1]);
    const eur = I.eur[t] + P.ecbEur * ecbDev;
    // coût du travail des partenaires : l'écart à la trajectoire de référence se cumule d'année en année et passe en partie dans leurs prix
    let partNow = S.part; Object.keys(PARTW).forEach(k => { partNow += PARTW[k] * I[k][t]; }); const pPart = P.partPass * partNow;
    const pm = 0.09 * I.pen[t] + 0.4 * I.tariff[t] - 0.6 * eur + pPart, dpm = pm - S.pm, pmNE = 0.4 * I.tariff[t] - 0.6 * eur + pPart;
    S.eduC = S.eduC * 0.97 + I.eduCum[t];
    S.penSm = 0.5 * S.penSm + 0.5 * I.pen[t];
    const tarE = S.tarE + 0.3 * (I.tariff[t] - S.tarE); // les droits de douane désorganisent peu à peu les filières
    const tfp = I.tfp[t] + P.educTfp * S.eduC * Math.min(1, t / 10) * 0.35 - P.enPot / 10 * S.penSm + lam * P.verdoorn * S.y - P.tarTfp / 0.83 * tarE;
    const dprod = tfp - S.tfpE;
    const lfs = I.lfs[t], nairu = I.nairu[t], hrs = I.hrs[t], dhrs = I.hrs[t] - I.hrs[t - 1];
    const dpInd = (I.pInd[t] - I.pInd[t - 1]) + 0; const dpE = (I.pE[t] - I.pE[t - 1]) + 0.01 * (I.pen[t] - I.pen[t - 1]);
    const ucLab = I.ucost[t] / (D.MSpriv * 1.3 * nom) * 100, ucLabPrev = I.ucost[t - 1] / (D.MSpriv * 1.3 * B.nom[t - 1]) * 100;
    const dUc = (ucLab - ucLabPrev) * 0.6;
    const dG = I.G[t], dIg = I.Ig[t];
    const gjobs = I.gjobs[t];
    const ixs = Math.max(0, Math.min(1, I.idxw[t] / 100)), ix = P.idxW + (1 - P.idxW) * ixs, ix2 = P.idxW2 * (1 - ixs);
    const cDn = new Array(10).fill(0); let cOth = 0;
    const jdTarget = I.jobs[t]; const jd = S.jd + 0.45 * (jdTarget - S.jd);
    // âge de la retraite : la plupart des personnes concernées gardent (ou quittent) un emploi. La lecture offre les absorbe déjà ; en lecture demande, l'effet direct s'efface à mesure que les entreprises ajustent leurs embauches
    const keepPct = S.keep * (1 - lam * P.ageFade) + lam * P.ageKeep * (I.lfsA[t] - I.lfsA[t - 1]), keptK = keepPct / 100 * B.LF[t];
    // heures en plus : les débouchés se gagnent en plusieurs années
    const hOut = S.hOut + P.hrsSpeed * (Math.max(0, hrs) - S.hOut);
    const eSupPct = (1 - lam) * (P.supplyDirect * 0.67 * lfs + 0) + keepPct * B.LF[t] / B.E[t], ySup = (1 - lam) * (P.supplyDirect * (0.67 * lfs * 0.8 + tfp * 0.5)) + (1 - lam) * P.hrsOut * hOut;
    // crédit : encours de référence, canal bancaire, charge de la dette privée (nuls si le crédit n'est pas activé)
    const cr = P.credOn ? 1 : 0, DhB = D.dHh0 / 100 * B.Yn[t - 1], DfB = D.dFirm0 / 100 * B.Yn[t - 1];
    const aH = -cr * P.credRate / 100 * lend * DhB, aF = -cr * P.credRate / 100 * lend * DfB;
    const rH = S.rH + 0.15 * (lend - S.rH), rF = S.rF + 0.35 * (lend - S.rF);
    const svH = cr * (rH / 100 * DhB + D.iPriv0 / 100 * S.DhDev), svF = cr * (rF / 100 * DfB + D.iPriv0 / 100 * S.DfDev);
    const crC = (0.3 * P.credDem * aH - P.credServ * svH) / B.Pgdp[t], crIh = 0.7 * P.credDem * aH / B.Pgdp[t], crIe = (P.credDem * aF - P.credServ * svF) / B.Pgdp[t];
    const ystarPre = 0.33 * S.k + 0.67 * (lfs - nairu + hrs) + tfp + P.kpubElas * S.kpub + S.hyst; let unf = 0;
    let y = S.y, ym = S.ym, c = S.c, ie = S.ie, ih = S.ih, x = S.x, e = S.e, w = S.w, p = S.p, pht = S.pht, dpi = 0, dw = 0, du = 0, dE = 0, margin = 0, eq = 0, dM = 0, dX = 0, dIe = 0, dIh = 0, hhD = [], rdbrTot = 0, dWages = 0, dPens = 0, dBen = 0, dCap = 0, dMixed = 0, dIR = 0, dCSG = 0, ePrivK = 0, lfK = 0, MSdev = 0, comp = 0, ystarNow = S.ystar, rdbA = 0, rdbR = 0, pD = [], ulcNow = 0;
    for (let it = 0; it < 80; it++) {
      // Emploi
      const eStar = ym - tfp * (1 - P.supplyDirect * 0.5) - P.rttShare * hrs - P.sigL * (1 - P.demSigL * lam) * (w - pht - tfp - hrs);
      e = S.e + P.lamE * (eStar - S.e);
      ePrivK = e / 100 * Epriv0 + jd + eSupPct / 100 * B.E[t];
      dE = ePrivK + gjobs + I.emp[t];
      lfK = lfs / 100 * B.LF[t] + P.flex * (dE - keptK);
      du = -(dE - (1 - B.u[t] / 100) * lfK) / B.LF[t] * 100;
      // chômage plancher : en dessous d'un seuil, les postes ne trouvent plus preneur
      unf = 0; if (B.u[t] + du < P.uSoft) { const uC = P.uMin + (P.uSoft - P.uMin) * Math.exp(-(P.uSoft - B.u[t] - du) / (P.uSoft - P.uMin)); unf = (uC - B.u[t] - du) / 100 * B.LF[t]; dE -= unf; ePrivK -= unf; du = uC - B.u[t]; }
      // Salaires et prix
      const gapDev = y - ystarNow;
      const tight = Math.max(0, -(du - nairu - S.nh));
      const Aw = ix2 * S.dpi - P.phil * Math.exp(P.philConv * tight) * (du - nairu - S.nh) + P.smicDiff * (I.smic[t] - I.smic[t - 1]) + 0.5 * dprod + (I.wshock[t] - I.wshock[t - 1]);
      const rest = P.aM * dpm + dpInd + dpE + 0.10 * gapDev + 0.10 * S.dpi;
      // les coûts salariaux passent dans les prix en deux ans ; en lecture demande, une part est prise sur les marges
      const aU = P.aUlc * (1 - P.demPass * lam);
      dpi = (aU * (P.passNow * (Aw - dprod - dhrs + dUc)) + aU * (1 - P.passNow) * S.ulc + rest) / (1 - aU * P.passNow * ix);
      dw = Aw + ix * dpi; ulcNow = dw - dprod - dhrs + dUc;
      p = S.p + dpi; pht = S.pht + dpi - dpInd - dpE; w = S.w + dw;
      // Revenus des ménages (Md€ courants)
      const MSp = D.MSpriv * nom, MSg = D.MSpub * nom;
      const empPct = (ePrivK + I.emp[t]) / (Epriv0 * B.E[t] / D.E0);
      const dMSrate = MSp * w / 100, dMSemp = MSp * (1 + w / 100) * empPct * 0.8;
      const dMSp = dMSrate + dMSemp;
      const dMSg = MSg * (P.idxPub * S.p / 100);
      MSdev = (dMSp + dMSg) / (MSp + MSg) * 100;
      dWages = D.netfac * (dMSp + dMSg); const dWrate = D.netfac * (dMSrate + dMSg), dWemp = D.netfac * dMSemp;
      dPens = P.idxPens * D.Pens * nom * S.p / 100;
      const dUk = du / 100 * B.LF[t] + (B.u[t] / 100) * lfK;
      const dBenIdx = P.idxBen * D.Ben * nom * S.p / 100, dBenU = dUk * P.benPerU / 1000 * nom / B.nom[1] * 0.75;
      dBen = dBenIdx + dBenU;
      dMixed = D.Mixed * nom * (ym + pht) / 100;
      dCap = D.CapInc * nom * 0.7 * (y + pht) / 100 + 0.15 * lend * 0.01 * 1500 * nom * 0.3;
      const incDev = (dWages + dPens + dMixed + 0.5 * dCap) / ((D.MSpriv + D.MSpub) * D.netfac + D.Pens + D.Mixed + 0.5 * D.CapInc) / nom * 100;
      dIR = B.recI.ir[t] * P.elasIR * incDev / 100;
      dCSG = 0.092 * (dMSp + dMSg) + 0.083 * dPens + 0.172 * 0.5 * dCap + 0.092 * dMixed;
      rdbrTot = 0; let cInc = 0; const pEc = S.pEc + dpE, cgr = Cb / B.C[t - 1];
      for (let d = 0; d < 10; d++) {
        const base = D.RDB * nom * dc.rdb[d];
        const dn = dc.wages[d] * dWrate + dc.jobs[d] * (dWemp + dBenU) + dc.pens[d] * dPens + dc.ben[d] * dBenIdx + dc.wages[d] * dMixed + dc.cap[d] * dCap - dc.ir[d] * dIR - dc.csg[d] * dCSG + I.hh[d][t];
        pD[d] = p + (dc.tiltE[d] - 1) * pEc;
        const real = ((base + dn) / (1 + pD[d] / 100) - base) / nom; // Md€ 2026 réels
        hhD[d] = real / (D.RDB * dc.rdb[d]) * 100; rdbrTot += real;
        const mp = 1 - Math.pow(1 - Math.min(0.999, P.mpcScale * dc.mpc[d]), kap), ld = Math.min(1, dc.lamD[d] * P.lamC / 0.75);
        cDn[d] = ld * mp * real + (1 - ld) * S.cD[d] * cgr; cInc += cDn[d];
      }
      const actBase = (D.MSpriv + D.MSpub) * D.netfac + D.Mixed + 0.85 * D.Ben + 0.55 * D.CapInc - 0.78 * D.R0.ir - 0.76 * D.R0.csg;
      const retBase = D.Pens + 0.15 * D.Ben + 0.45 * D.CapInc - 0.22 * D.R0.ir - 0.24 * D.R0.csg;
      const dA = dWages + dMixed + 0.85 * dBen + 0.55 * dCap - 0.78 * dIR - (dCSG - 0.083 * dPens) + I.hhA[t];
      const dRt = dPens + 0.15 * dBen + 0.45 * dCap - 0.22 * dIR - 0.083 * dPens + I.hhR[t];
      rdbA = ((actBase * nom + dA) / (1 + p / 100) / (actBase * nom) - 1) * 100; rdbR = ((retBase * nom + dRt) / (1 + (p + 0.08 * pEc) / 100) / (retBase * nom) - 1) * 100;
      // Consommation
      const core = dpi - dpE - dpInd; const rr = 0.5 * (lend - 0.3 * core) + 0.5 * S.rr;
      const cOtg = I.csave[t] / nom + Cb * (-P.sigC * rr - P.precaution * du - I.conf[t] * 1.2 + I.cshock[t]) / 100 + P.wealth * D.EqW * eq / 100;
      cOth = P.lamC * cOtg + (1 - P.lamC) * S.cO * cgr;
      const evA = ev * (dG + dIg + I.ppbI[t]); // éviction : dépense privée remplacée par la dépense publique
      c = cInc + cOth + crC - 0.5 * evA;
      // Investissement
      ie = P.rhoI * S.ie + kap * (P.acc1 * ym - (P.acc1 - (1 - P.rhoI)) * S.ym) - P.aR * rr + P.aProf * (1 - P.demProf * lam) * margin * (1 - P.rhoI) + (I.ieff[t] - P.rhoI * I.ieff[t - 1]) + I.ieshock[t];
      ih = 0.4 * S.ih + 0.5 * (rdbrTot / D.RDB * 100) - P.hR * (0.5 * (rl - 0.3 * core) + 0.5 * S.rrl) + I.ihshock[t];
      dIe = ie / 100 * B.Ie[t] + crIe - 0.5 * evA; dIh = ih / 100 * B.Ih[t] + crIh;
      // Extérieur
      comp = 0.7 * (pht - (pw ? pw[t] : 0) - pPart) + 0.45 * eur;
      x = P.xWd * wd - P.epsX * (0.5 * comp + 0.5 * S.comp) + I.xshock[t] - P.tarRet * I.tariff[t] * (I.tariff[t] > 0 ? 1 : 0) * (opt.noRetal ? 0 : 1) + 0.25 * I.tour[t] * 0.07;
      dX = x / 100 * B.X[t] + ySup / 100 * Yb;
      dM = P.mc * c + P.mi * dIe + 0.18 * (dIh + dIg) + P.mg * dG + P.mx * (x / 100 * B.X[t]) + B.M[t] * (P.epsM * (pht - pmNE - 0.6 * I.tariff[t]) - 0.02 * I.pen[t]) / 100 + I.mImp[t];
      // plafonds : production non faite faute de bras, et surchauffe au-delà du potentiel ; la demande non servie part en importations
      const dYr = c + dIe + dIh + dG + dIg + dX - dM, lost = unf * Yb / B.E[t], gT = B.gap[t] + (dYr - lost) / Yb * 100 - ystarPre;
      const over = gT > P.capGap ? (gT - P.capGap - P.capRoom * (1 - Math.exp(-(gT - P.capGap) / P.capRoom))) / 100 * Yb : 0;
      dM += lost + over; const dY = dYr - lost - over;
      const yNew = dY / Yb * 100;
      const dGw = 0.055 * gjobs + I.Gw[t];
      ym = (dY - dGw) / (0.78 * Yb) * 100;
      // Marges et actions
      const prodCyc = ym - (ePrivK / (Epriv0 * B.E[t] / D.E0) * 100);
      margin = -0.66 * (w + ucLab - pht - prodCyc) * 0.55 + I.firmMargin[t] / (D.VAsnf * nom) * 100;
      eq = I.eq[t] + 2.0 * y + 3 * (margin - I.isAmt[t] / (D.VAsnf * nom) * 100) - P.eqR * rl;
      if (Math.abs(yNew - y) < 1e-7) { y = yNew; break; }
      y = y + 0.5 * (yNew - y);
    }
    // ----- Finances publiques (écarts en Md€ courants)
    const cPct = c / Cb * 100;
    const ebe = margin / D.margin0 * 100 + ym + pht;
    const rv = {
      tva: I.rev.tva[t] + B.recI.tva[t] * (0.85 * cPct + pht + 0.1 * ih) / 100,
      ir: I.rev.ir[t] + dIR, csg: I.rev.csg[t] + dCSG,
      cot: I.rev.cot[t] + B.recI.cot[t] * MSdev / 100,
      is: I.rev.is[t] + B.recI.is[t] * P.elasIS * (0.5 * ebe + 0.5 * S.ebe) / 100,
      prod: I.rev.prod[t] + B.recI.prod[t] * (y + pht) / 100,
      acc: I.rev.acc[t] + B.recI.acc[t] * (0.6 * cPct - 0.08 * I.pen[t]) / 100,
      cap: I.rev.cap[t] + B.recI.cap[t] * (0.15 * eq + 0.4 * ih + 0.45 * (y + pht)) / 100,
      autres: I.rev.autres[t] + B.recI.autres[t] * (y + pht) / 100,
      horspo: I.rev.horspo[t] + B.recI.horspo[t] * 0.5 * (y + pht) / 100
    };
    const rmktDev = P.shortShare * rs + (1 - P.shortShare) * rl;
    const iavgDev = S.iavg + (t >= 2 ? P.roll : P.roll * 0.5) * (rmktDev - S.iavg);
    const dInt = iavgDev / 100 * B.D[t - 1] + (B.iavg[t] + iavgDev / 100) * S.Dd + 0.09 * B.D[t - 1] * dpi / 100;
    const fine = S.sanc ? P.sanctionFine / 100 * B.Yn[t] : 0;
    const sp = {
      presta: I.spend.presta[t] + dPens / 0.91 + dBen,
      salaires: I.spend.salaires[t] + D.S0.salaires * nom * P.idxPub * S.p / 100,
      fonct: I.spend.fonct[t] + B.depN.fonct[t] * 0.8 * pht / 100,
      invest: I.spend.invest[t] + B.depN.invest[t] * 0.8 * pht / 100,
      interets: dInt, subv: I.spend.subv[t], autres: I.spend.autres[t] + fine
    };
    const dRev = sum(Object.values(rv)), dSp = sum(Object.values(sp)), dDef = dSp - dRev;
    const Dd = S.Dd + dDef;
    const pgdp = p - 0.9 * P.aM * pm - (S.pEc + dpE) * 0.5;
    const Yn = B.Yn[t] * (1 + y / 100) * (1 + pgdp / 100);
    const pp = S.pp * 0.9 + I.ppbD[t]; // prêts du pôle public bancaire comptés dans la dette, si le réglage le demande
    const defMd = B.def[t] + dDef, debtMd = B.D[t] + Dd + pp;
    // ----- Potentiel
    const k = S.k * 0.93 + 0.07 * (ie + crIe / B.Ie[t] * 100) - I.kdes[t];
    const kpub = S.kpub * 0.97 + dIg / (0.9 * Yb) * 100 - I.kdes[t] * 0.5;
    const hyst = S.hyst + P.hyst * (y - S.ystar) * 0.5 + lam * P.demAbs * (y - S.ystar);
    const ystar = 0.33 * k + 0.67 * (lfs - nairu + hrs) + tfp + P.kpubElas * kpub + hyst;
    // ----- Résultats
    const Yr = Yb * (1 + y / 100);
    R.y[t] = y; R.gdpG[t] = (Yr / prev.Yr - 1) * 100; R.gdpN[t] = Yn; R.infl[t] = B.pi[t] + dpi; R.p[t] = p;
    R.u[t] = B.u[t] + du; R.dU[t] = du; R.empK[t] = B.E[t] + dE; R.dE[t] = dE;
    R.def[t] = defMd / Yn * 100; R.solde[t] = -R.def[t]; R.debtMd[t] = debtMd; R.debt[t] = debtMd / Yn * 100;
    R.int[t] = B.int[t] + dInt; R.intPct[t] = R.int[t] / Yn * 100; R.prim[t] = -(defMd - R.int[t]) / Yn * 100;
    R.recMd[t] = B.rec[t] + dRev; R.depMd[t] = B.dep[t] + dSp; R.depPct[t] = R.depMd[t] / Yn * 100;
    R.po[t] = (0.442 * B.Yn[t] * (B.rec[t] / (0.519 * B.Yn[t])) + dRev - rv.horspo) / Yn * 100;
    const rdbrLvl = D.RDB * Math.pow(1, t) + rdbrTot; // écart réel
    const paDev = rdbrTot / D.RDB * 100; R.paLvl[t] = paDev;
    R.pa[t] = ((1 + B.rdbrG[t] / 100) * (1 + paDev / 100) / (1 + (prev.paDev || 0) / 100) - 1) * 100;
    for (let d = 0; d < 10; d++) R.dec[d][t] = hhD[d];
    R.rdbA[t] = rdbA; R.rdbR[t] = rdbR;
    R.s80[t] = s80(D.dec.rdb.map((v, d) => v * (1 + hhD[d] / 100)));
    const Xn = B.X[t] * B.Pgdp[t], Mn = B.M[t] * B.Pgdp[t];
    R.bal[t] = (B.bal[t] / 100 * B.Yn[t] + Xn * ((dX / B.X[t]) * 100 + 0.6 * pht) / 100 - Mn * ((dM / B.M[t]) * 100 + pm - 0.4 * I.tariff[t]) / 100) / Yn * 100;
    R.ecb[t] = B.ecb[t] + ecbDev; R.spread[t] = P.spreadBase + spreadDev; R.oat[t] = B.oat[t] + rl;
    R.cac[t] = B.cac[t] * (1 + eq / 100) * (1 + pgdp / 100);
    R.wageG[t] = B.wg[t] + dw; R.margin[t] = D.margin0 + margin;
    // lecture Keen : part des salaires, solde courant, soldes sectoriels, dette privée
    R.wsh[t] = 100 - D.prodTaxVA - R.margin[t]; R.pht[t] = pht;
    R.intExt[t] = nrS * R.int[t]; R.ca[t] = R.bal[t] + otherInc - R.intExt[t] / Yn * 100;
    R.sfHh[t] = hhB0 + (rdbrTot - c - dIh) / Yb * 100; R.sfRow[t] = -R.ca[t]; R.sfFirm[t] = R.ca[t] - R.solde[t] - R.sfHh[t];
    const fH = P.credLh * (dIh - crIh) * B.Pgdp[t] + aH, fF = P.credLf * (dIe - crIe) * B.Pgdp[t] + aF;
    const DhDev = S.DhDev + fH, DfDev = S.DfDev + fF;
    R.dHh[t] = (D.dHh0 / 100 * B.Yn[t] + DhDev) / Yn * 100; R.dFirm[t] = (D.dFirm0 / 100 * B.Yn[t] + DfDev) / Yn * 100; R.dPriv[t] = R.dHh[t] + R.dFirm[t];
    R.credFlow[t] = (fH + fF) / Yn * 100;
    R.ystar[t] = ystar; R.pen[t] = B.pen[t] * (1 + I.pen[t] / 100); R.potG[t] = ((1 + B.gpot[t] / 100) * (1 + ystar / 100) / (1 + S.ystar / 100) - 1) * 100; R.gapV[t] = B.gap[t] + y - ystar;
    R.cG[t] = ((B.C[t] + c) / prev.C - 1) * 100; R.ieG[t] = ((B.Ie[t] + dIe) / prev.Ie - 1) * 100;
    R.xG[t] = ((B.X[t] + dX) / prev.X - 1) * 100; R.mG[t] = ((B.M[t] + dM) / prev.M - 1) * 100;
    Object.keys(rv).forEach(k2 => R.recI[k2][t] = B.recI[k2][t] + rv[k2]); Object.keys(sp).forEach(k2 => R.depN[k2][t] = B.depN[k2][t] + sp[k2]);
    // sous-secteurs : part ex ante (I.sub) + stabilisateurs ventilés
    const endo = { etat: 0, ct: 0, secu: 0 }, add = (v, s) => Object.keys(s).forEach(k2 => endo[k2] += v * s[k2]);
    const ex = k2 => rv[k2] - I.rev[k2][t], exs = k2 => sp[k2] - I.spend[k2][t];
    add(ex('tva'), { etat: .5, ct: .22, secu: .28 }); add(ex('ir'), { etat: 1 }); add(ex('csg'), { secu: 1 }); add(ex('cot'), { secu: 1 }); add(ex('is'), { etat: 1 });
    add(ex('prod'), { ct: .6, etat: .2, secu: .2 }); add(ex('acc'), { etat: .7, ct: .3 }); add(ex('cap'), { etat: .5, ct: .5 }); add(ex('autres') + ex('horspo'), { etat: .6, ct: .2, secu: .2 });
    add(-(dPens / 0.91), { secu: .85, etat: .15 }); add(-dBen, { secu: .65, etat: .25, ct: .10 }); add(-exs('salaires'), { etat: .45, ct: .3, secu: .25 });
    add(-exs('fonct') - exs('invest'), { etat: .3, ct: .55, secu: .15 }); add(-dInt, { etat: .9, secu: .07, ct: .03 }); add(-fine, { etat: 1 });
    ['etat', 'ct', 'secu'].forEach(k2 => { const ds = I.sub[k2][t] + endo[k2]; R.sub[k2].solde[t] = B.sub[k2].solde[t] + ds; });
    // dépenses/recettes par sous-secteur : ventilation simple des écarts
    const shareDep = { etat: .38, ct: .19, secu: .43 };
    ['etat', 'ct', 'secu'].forEach(k2 => { R.sub[k2].dep[t] = B.sub[k2].dep[t] + dSp * shareDep[k2]; R.sub[k2].rec[t] = R.sub[k2].dep[t] + R.sub[k2].solde[t]; });
    // branches
    const cotEndo = ex('cot'), csgEndo = ex('csg'), tvaSec = ex('tva') * .28, uCost = dUk(du, lfK, B, t) * P.benPerU / 1000 * nom / B.nom[1] * 0.75;
    const brEndo = {
      mal: cotEndo * .19 + csgEndo * .45 + tvaSec * .9 - 0.3 * P.idxBen * D.Ben * nom * S.p / 100 * .3 - exs('salaires') * .25,
      vie: cotEndo * .37 + csgEndo * .15 - (dPens / 0.91) * .62,
      fam: cotEndo * .07 + csgEndo * .10 - P.idxBen * D.Ben * nom * S.p / 100 * .25,
      atmp: cotEndo * .035, aut: cotEndo * .01 + csgEndo * .12 - P.idxBen * D.Ben * nom * S.p / 100 * .08,
      une: cotEndo * .09 + csgEndo * .11 - uCost * 0.8, comp: cotEndo * .22 - (dPens / 0.91) * .23
    };
    BRANCHES.forEach(b => { const ds = I.br[b.id][t] + brEndo[b.id]; R.br[b.id].solde[t] = B.br[b.id].solde[t] + ds; R.br[b.id].dep[t] = B.br[b.id].dep[t] - Math.min(0, 0) + (b.id === 'une' ? uCost * 0.8 : 0) + (b.id === 'vie' ? (dPens / 0.91) * .62 : 0) + (b.id === 'comp' ? (dPens / 0.91) * .23 : 0); });
    // ----- Secteurs
    const devs = [cPct, ie, ih, dG / B.G[t] * 100, dIg / B.Ig[t] * 100, x];
    let raw = SECTORS.map(s => {
      let v = s.cyc * (s.L[0] * devs[0] + s.L[1] * devs[1] + s.L[2] * devs[2] + s.L[5] * devs[5]) + s.L[3] * devs[3] + s.L[4] * devs[4] * 0.5;
      v += s.en * I.pen[t] + s.r * lend;
      if (s.id === 'def') v += I.defDem[t] * 0.55 / (s.va / 100 * Yb) * 100 - (s.L[3] * devs[3] + s.L[4] * devs[4] * 0.5) * (I.defDem[t] ? 0.5 : 0);
      if (s.id === 'agri') v += I.agri[t];
      if (s.id === 'tech') v += I.tech[t];
      if (s.id === 'hr') v += 0.5 * I.tour[t]; if (s.id === 'transp') v += 0.12 * I.tour[t];
      if (s.id === 'nonmar') v = dG / B.G[t] * 100 * 0.85;
      return v;
    });
    const mSum = sum(raw.map((v, i) => v * sectorW[i])), corr = y - mSum;
    const nmI = SECTORS.findIndex(s => s.id === 'nonmar'), wM = 1 - sectorW[nmI];
    raw = raw.map((v, i) => i === nmI ? v : v + corr / wM);
    let lvSum = 0; const lv = SECTORS.map((s, i) => { const l = s.va / 100 * Yb * 0.9 * Math.pow(1 + s.tr / 100, t) * (1 + raw[i] / 100); lvSum += l; return l; });
    const scale = (Yr * 0.9) / lvSum;
    let empRaw = SECTORS.map((s, i) => { const prevE = S.secE[s.id] || 0; const tgt = (s.id === 'nonmar' ? gjobs / (s.emp / 100 * B.E[t]) * 100 + 0.2 * raw[i] : 0.75 * raw[i] - 0.5 * tfp); return prevE + 0.5 * (tgt - prevE); });
    const empK = empRaw.map((v, i) => v / 100 * SECTORS[i].emp / 100 * B.E[t]); const eSum = sum(empK), eCorr = dE - eSum;
    SECTORS.forEach((s, i) => { R.sec[s.id].va[t] = raw[i]; R.sec[s.id].lvl[t] = lv[i] * scale; S.secE[s.id] = empRaw[i]; R.sec[s.id].emp[t] = empK[i] + (s.id === 'nonmar' ? 0 : eCorr * s.emp / (100 - 30.4)); });
    R.tourVa[t] = 1.3 * (0.55 * cPct + 0.45 * (x + 0.5 * wd)) + I.tour[t] - 0.03 * I.pen[t]; R.tourEmp[t] = 0.7 * R.tourVa[t] / 100 * TOURISM.emp / 100 * B.E[t];
    // ----- Tailles d'entreprise
    const dom = (c + dIe + dIh + dG * 0.3 + dIg) / (B.C[t] + B.Ie[t] + B.Ih[t] + B.G[t] * 0.3 + B.Ig[t]) * 100;
    let szRaw = SIZES.map(s => (1 - s.xs) * dom + s.xs * x - s.cr * lend - 0.6 * s.low * (I.smic[t]) * 0.3 - (s.id === 'ge' ? 0.05 * I.isGe[t] : 0));
    const szSum = sum(szRaw.map((v, i) => v * SIZES[i].va / 100)), szCorr = ym - szSum;
    const privK = ePrivK + I.emp[t]; let szEmp = [];
    SIZES.forEach((s, i) => {
      const va = szRaw[i] + szCorr; R.size[s.id].va[t] = va;
      R.size[s.id].inv[t] = ie + 1.2 * (va - ym) - 1.5 * s.cr * lend + 1.5 * s.cr * 0.3 * lend - (s.id === 'ge' ? 0.25 * I.isGe[t] : 0);
      const vaS = D.VAsnf * nom * s.va / 100;
      R.size[s.id].margin[t] = s.m0 + margin - I.firmMargin[t] / (D.VAsnf * nom) * 100 + (-(I.prodAmt[t]) * s.prod + (I.firmMargin[t] + I.prodAmt[t]) * s.va / 100 - I.cotLowAmt[t] * (s.cotlow - s.va / 100) - 1.4 * I.smic[t] * nom / B.nom[1] * (s.low / 0.12 - 1) * s.va / 100) / vaS * 100;
      szEmp[i] = 0.75 * va + (e - 0.75 * ym) - 100 * (I.cotLowAmt[t] * P.jobsLow * (s.cotlow - s.emp / 100)) / (Epriv0 * s.emp / 100) * 0.5;
    });
    const szK = szEmp.map((v, i) => v / 100 * Epriv0 * SIZES[i].emp / 100), szKs = sum(szK);
    SIZES.forEach((s, i) => R.size[s.id].emp[t] = szK[i] + (privK - szKs) * s.emp / 100);
    // ----- Catégories transversales
    const attr = I.attr[t] - 1.5 * spreadDev - 0.3 * I.tariff[t] * 0;
    R.trv.expo.va[t] = 0.45 * dom + 0.55 * x - 0.5 * (0.7 * pht + ucLab * 0.3) + 0.15 * tfp;
    R.trv.expo.inv[t] = ie + 1.5 * (R.trv.expo.va[t] - ym);
    R.trv.expo.emp[t] = (0.7 * R.trv.expo.va[t] + (e - 0.7 * ym)) / 100 * Epriv0 * 0.22;
    R.trv.fmn.va[t] = 0.55 * dom + 0.45 * x + 0.15 * attr;
    R.trv.fmn.inv[t] = ie + 1.2 * attr + 1.2 * (R.trv.fmn.va[t] - ym);
    R.trv.fmn.emp[t] = (0.7 * R.trv.fmn.va[t] + (e - 0.7 * ym)) / 100 * Epriv0 * 0.11;
    // ----- Règles européennes
    const npe = R.depMd[t] - R.int[t] - uCost - sum(Object.keys(I.rev).map(k2 => I.rev[k2][t])) - (t >= 1 ? 18 * nom / B.nom[1] : 0);
    R.npe[t] = (npe / S.npePrev - 1) * 100; S.npePrev = npe;
    const al = R.alerts[t];
    if (R.def[t] > 3) al.push({ lvl: R.def[t] > 5 ? 'crit' : 'warn', txt: 'Déficit au-dessus de 3 % du PIB (' + R.def[t].toFixed(1) + ' %) : procédure de déficit excessif' });
    if (R.debt[t] > 60 && R.debt[t] > R.debt[t - 1] + 0.05) al.push({ lvl: 'warn', txt: 'Dette supérieure à 60 % du PIB et en hausse (' + R.debt[t].toFixed(1) + ' %)' });
    if (R.npe[t] > P.euCap + 0.05) al.push({ lvl: 'warn', txt: 'Dépense primaire nette en hausse de ' + R.npe[t].toFixed(1) + ' %, au-dessus du plafond de ' + P.euCap.toFixed(1) + ' %' });
    if (R.spread[t] > 2) al.push({ lvl: 'crit', txt: 'Écart de taux avec l\'Allemagne supérieur à 2 points (' + R.spread[t].toFixed(2) + ')' });
    if (R.intPct[t] > 4) al.push({ lvl: 'warn', txt: 'Charge d\'intérêts supérieure à 4 % du PIB' });
    R.xRev[t] = sum(Object.keys(I.rev).map(k2 => I.rev[k2][t])); R.xSp[t] = sum(Object.keys(I.spend).map(k2 => I.spend[k2][t]));
    const xa = (R.xRev[t] - R.xSp[t]) / B.Yn[t] * 100; R.effort[t] = xa - (S.xa || 0); S.xa = xa;
    let sancNext = 0;
    if (opt.sanctions && t >= 2 && R.def[t] > 3 && R.effort[t] < 0.5) { sancNext = 1; }
    if (S.sanc) { al.push({ lvl: 'crit', txt: 'Sanctions européennes appliquées : amende et hausse de l\'écart de taux' }); R.sanction[t] = 1; }
    // ----- État suivant
    S.sanc = sancNext; S.cD = cDn.slice(); S.cO = cOth; S.c = c; S.ie = ie; S.ih = ih; S.x = x; S.p = p; S.pht = pht; S.pEc += dpE; S.w = w; S.e = e; S.jd = jd; S.k = k; S.kpub = kpub; S.hyst = hyst;
    S.DhDev = DhDev; S.DfDev = DfDev; S.rH = rH; S.rF = rF;
    S.part = partNow; S.hOut = hOut; S.keep = keepPct; S.tarE = tarE; S.pp = pp; S.ulc = ulcNow; S.debtLvl = R.debt[t]; S.nh = S.nh + lam * P.demNairu * (du - nairu - S.nh); S.caDev = R.ca[t] - (B.bal[t] + otherInc - nrS * B.int[t] / B.Yn[t] * 100);
    S.y = y; S.ym = ym; S.dpi = dpi; S.iavg = iavgDev; S.Dd = Dd; S.debtR = R.debt[t] - B.D[t] / B.Yn[t] * 100; S.defR = R.def[t] - B.def[t] / B.Yn[t] * 100;
    S.rr = lend - 0.3 * (dpi - dpE - dpInd); S.rrl = rl - 0.3 * (dpi - dpE - dpInd); S.pm = pm; S.comp = comp; S.ebe = ebe; S.ystar = ystar; S.tfpE = tfp;
    prev = { C: B.C[t] + c, Ie: B.Ie[t] + dIe, X: B.X[t] + dX, M: B.M[t] + dM, Yr, paDev };
  }
  return R;
}
function dUk(du, lfK, B, t) { return du / 100 * B.LF[t] + (B.u[t] / 100) * lfK; }
function s80(sh) { return (sh[8] + sh[9]) / (sh[0] + sh[1]); }

/* ---------- Interface de haut niveau ---------- */
function run(P, prog, shocks, pilot, opt, scen) {
  const B = baseline(P); const I = buildImpulses(P, B, prog, shocks, pilot, scen || 'central');
  return simulate(P, B, I, opt);
}
function runBand(P, prog, shocks, pilot, opt) {
  const B = baseline(P), o = {};
  ['central', 'pess', 'opt'].forEach(s => o[s] = simulate(P, B, buildImpulses(P, B, prog, shocks, pilot, s), opt));
  return o;
}
function multipliers(P) {
  const B = baseline(P), ref = simulate(P, B, newImp(), {});
  const one = 0.01 * B.Yn[1];
  const test = (lever, val) => { const prog = { measures: [{ lever, value: val, start: 2028, ramp: 1 }] }; const r = simulate(P, B, buildImpulses(P, B, prog, [], null, 'central'), {}); return [2, 3, 6].map(t => r.y[t] - ref.y[t]); };
  const pil = (id, v) => { const pilot = { from: {} }; pilot[id] = v; pilot.from[id] = 2028; const r = simulate(P, B, buildImpulses(P, B, null, [], pilot, 'central'), {}); return [2, 3, 6].map(t => r.y[t] - ref.y[t]); };
  return [
    { nom: 'Dépense publique, +1 % du PIB', v: test('gfonct', one) },
    { nom: 'Investissement public, +1 % du PIB', v: test('ipub', one) },
    { nom: 'Transferts aux ménages modestes, +1 % du PIB', v: test('benlow', one) },
    { nom: 'TVA, +1 % du PIB', v: test('tva', one / 8.4) },
    { nom: 'Impôt sur le revenu, +1 % du PIB', v: test('ir', one) },
    { nom: 'Cotisations patronales, −1 % du PIB', v: test('cotall', -one) },
    { nom: 'Taux BCE, +1 point', v: pil('ecb', P.ecbBase + 1) },
    { nom: 'Demande mondiale, −1 %', v: pil('wd', -1) }
  ];
}
const API = { YEARS, N, D, SECTORS, TOURISM, SIZES, TRANSV, BRANCHES, REC_LABELS, DEP_LABELS, PARAMS, LEVERS, LEV, CUSTOM_CH, ASSIETTES, ASS, assInfo, MICRO, SHOCKS, PILOT, defaultParams, baseline, buildImpulses, simulate, run, runBand, multipliers, newImp };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ENGINE = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);

