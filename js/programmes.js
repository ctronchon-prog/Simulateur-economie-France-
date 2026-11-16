/* Programmes par défaut de la maquette : LFI, RN, Philippe et Lisnard (extrapolations), deux exemples fictifs.
   LFI, RN et les exemples sont repris de la maquette publiée le 11 novembre 2026 ; Philippe et Lisnard ont été ajoutés le 16 novembre 2026. */
(function (root) {
'use strict';
const E = root.ENGINE || require('./moteur.js');
const copyBar = b => b ? b.map(r => [r[0], r[1]]) : null;
const LFI_DESC = "Extrapolation, pas un chiffrage officiel. Première partie : le contre-budget 2027 de La France insoumise, ligne à ligne, avec ses montants (81,7 Md€ de dépenses, 106,4 Md€ de recettes). Seconde partie : les mesures de L'Avenir en commun que ce document ne chiffre pas, avec des ordres de grandeur posés par la maquette, à corriger quand le chiffrage complet sera publié.";
const lfiProg = () => {
  const c = [75, 100, 110], M = E.MICRO;
  return { id: 'lfi', name: "LFI · L'Avenir en commun (extrapolation)", desc: LFI_DESC, measures: [
    { sec: 'Contre-budget 2027 : dépenses', lever: 'gpoint', value: 10, chiffre: 17, start: 2027, ramp: 1, nom: "Point d'indice des fonctionnaires : +10 %", src: 'c' },
    { lever: 'benfam', value: 8, start: 2027, ramp: 1, nom: 'Pensions, allocations familiales et APL indexées ; allocations et APL +10 %', src: 'c' },
    { lever: 'ipub', value: 3, start: 2027, ramp: 1, nom: "Logements d'urgence et réquisition de logements vacants", src: 'c' },
    { ass: 'v_jeunes', taux: 144, chiffre: 9.5, start: 2027, ramp: 1, nom: "Garantie d'autonomie des jeunes (aucun jeune sous 1 337 € par mois)", src: 'c' },
    { lever: 'educ', value: 4, start: 2027, ramp: 1, nom: "École et université : 10 000 postes, 250 000 places", src: 'c' },
    { lever: 'benfam', value: 3.6, start: 2027, ramp: 1, nom: 'Cantine scolaire gratuite', src: 'c' },
    { lever: 'sante', value: 3, start: 2027, ramp: 1, nom: 'Hôpital : +3 Md€, 10 000 soignants', src: 'c' },
    { lever: 'gfonct', value: 11.6, start: 2027, ramp: 1, nom: 'Lutte contre les violences (4,6 Md€) et annulation des coupes depuis 2026 (7 Md€)', src: 'c' },
    { lever: 'ipub', value: 10, start: 2027, ramp: 1, nom: 'Adaptation au dérèglement climatique', src: 'c' },
    { lever: 'age', value: -2, chiffre: 9, start: 2027, ramp: 1, nom: 'Abrogation de la retraite à 64 ans', src: 'c' },
    { lever: 'chom', value: 3, start: 2027, ramp: 1, nom: "Abrogation des réformes de l'assurance chômage", src: 'c' },
    { sec: 'Contre-budget 2027 : recettes', lever: 'capinc', value: 9, start: 2027, ramp: 1, nom: 'Suppression de la flat tax', src: 'c' },
    { lever: 'isf', value: 10, start: 2027, ramp: 1, nom: 'Impôt sur la fortune rétabli et renforcé', src: 'c' },
    { lever: 'irtop', value: 11, start: 2027, ramp: 1, nom: 'Niches fiscales et sociales : part ménages (moitié des 22 Md€, répartition de la maquette)', src: 'c' },
    { lever: 'subv', value: -11, start: 2027, ramp: 1, nom: 'Niches fiscales et sociales : part entreprises (moitié des 22 Md€, répartition de la maquette)', src: 'c' },
    { lever: 'prodtax', value: 3, start: 2027, ramp: 1, nom: 'CVAE rétablie sur les plus grandes entreprises', src: 'c' },
    { ass: 'a_pat', lo: 100, hi: null, taux: 2, marg: 0, chiffre: 15, start: 2027, ramp: 1, nom: 'Taxe Zucman : 2 % du patrimoine au-delà de 100 M€', src: 'c' },
    { lever: 'succ', value: 20, start: 2027, ramp: 1, nom: 'Réforme des droits de succession', src: 'c' },
    { lever: 'isge', value: 3, start: 2027, ramp: 1, nom: "Réforme de l'impôt sur les sociétés", src: 'c' },
    { lever: 'isge', value: 5, start: 2027, ramp: 1, nom: 'Taxe universelle sur les multinationales', src: 'c' },
    { lever: 'isge', value: 3.9, start: 2027, ramp: 1, nom: 'Taxe sur les géants du numérique renforcée', src: 'c' },
    { lever: 'isge', value: 5, start: 2027, ramp: 1, nom: 'Taxe sur les superprofits', src: 'c' },
    { custom: 1, canal: 'c_revfin', montant: 8.5, eff: c, start: 2027, ramp: 1, nom: "Transactions financières (5 Md€), rachats d'actions (2,5), crypto-actifs (1)", src: 'c' },
    { custom: 1, canal: 'c_fraude', montant: 2, eff: [50, 100, 110], start: 2027, ramp: 1, nom: 'Lutte contre la fraude fiscale, première année', src: 'c' },
    { sec: 'Mesures du programme sans montant publié', lever: 'smic', value: 15, start: 2027, ramp: 1, nom: 'SMIC à 1 700 € nets (+15 %)', src: 'm' },
    { lever: 'idxsal', value: 100, start: 2027, ramp: 1, nom: "Indexation des salaires sur l'inflation", src: 'm' },
    { bar: { ir: copyBar(M.IR_LFI), csg: copyBar(M.CSG_LFI), garde: 4000 }, start: 2028, ramp: 1, nom: 'Révolution fiscale : impôt sur le revenu et CSG à 14 tranches', src: 'm' },
    { lever: 'ppb', value: 100, start: 2028, ramp: 3, nom: 'Pôle public bancaire : 100 Md€ de financements en plus par an', src: 'm' },
    { lever: 'prixbloc', value: 15, start: 2027, ramp: 1, nom: 'Carburant bloqué à 1,70 € le litre, prix des produits de première nécessité encadrés', src: 'e' },
    { lever: 'cotall', value: 6, start: 2027, ramp: 1, nom: 'Fin des exonérations de cotisations au-dessus de 2 SMIC', src: 'e' },
    { lever: 'age', value: -2, start: 2029, ramp: 3, nom: 'Retraite à 60 ans : seconde étape', src: 'e' },
    { lever: 'pens', value: 4, start: 2028, ramp: 4, nom: '40 annuités, fin de la décote, pension minimale au SMIC, minimum vieillesse relevé', src: 'e' },
    { lever: 'hours', value: -3, start: 2028, ramp: 3, nom: '35 heures effectives, 32 heures pour les métiers pénibles, sixième semaine de congés', src: 'e' },
    { lever: 'gjobs', value: 300, start: 2028, ramp: 4, nom: "Garantie d'emploi pour les chômeurs de longue durée", src: 'e' },
    { lever: 'gjobs', value: 200, start: 2028, ramp: 5, nom: 'Recrutements dans les services publics sur le mandat', src: 'e' },
    { lever: 'benlow', value: 15, start: 2028, ramp: 3, nom: "Garantie d'autonomie étendue à tous, hausse des minima sociaux", src: 'e' },
    { lever: 'sante', value: 12, start: 2028, ramp: 4, nom: '100 % Sécu, zéro reste à charge, arrêts maladie sans carence', src: 'e' },
    { custom: 1, canal: 'c_fraude', montant: 8, eff: [25, 60, 100], start: 2028, ramp: 4, nom: 'Lutte contre la fraude fiscale, montée en charge', src: 'e' },
    { lever: 'isge', value: 5, start: 2028, ramp: 3, nom: 'Taxe universelle sur les multinationales, montée en charge', src: 'e' }
  ] };
};
const RN_DESC = "Extrapolation, pas un chiffrage officiel. Ossature : la trajectoire 2027-2032 présentée par Marine Le Pen le 6 octobre 2026, poste par poste, avec les montants du parti en 2031 tels que retranscrits par l'Institut de l'Entreprise (le document n'est pas en ligne). Les lignes « solde du poste » complètent chaque poste jusqu'au total annoncé ; leur ventilation est de la maquette. Le programme des législatives 2024 sert à nommer les mesures que le plan ne détaille pas. Là où les deux divergent (retraites), le plan de 2026 est retenu.";
const rnProg = () => {
  const c = [75, 100, 110];
  return { id: 'rn', name: 'RN · Le Pen (extrapolation)', desc: RN_DESC, measures: [
    { sec: 'Plan du 6 octobre 2026 : impôts', lever: 'accise', value: -12.2, start: 2027, ramp: 1, nom: "TVA à 5,5 % sur l'énergie et les carburants", src: 'c' },
    { lever: 'tvar', value: -0.85, chiffre: 3.5, start: 2027, ramp: 1, nom: 'TVA nulle sur cent produits essentiels', src: 'c' },
    { lever: 'accise', value: -3.9, start: 2027, end: 2027, ramp: 1, nom: 'Taxe sur les carburants ramenée à son niveau de 2017 (comptée par le RN en 2027 seulement)', src: 'c' },
    { lever: 'ir', value: -2, start: 2027, ramp: 1, nom: "Impôt sur le revenu supprimé avant 30 ans, jusqu'à 4 SMIC", src: 'c' },
    { lever: 'ir', value: -10.4, start: 2027, ramp: 1, nom: "Autres baisses pour les ménages : part fiscale dès le deuxième enfant, successions, donations, veufs (solde de l'enveloppe de 32 Md€)", src: 'c' },
    { lever: 'isf', value: 4, start: 2027, ramp: 1, nom: "Impôt sur la fortune financière à la place de l'IFI", src: 'c' },
    { lever: 'capinc', value: 2, start: 2027, ramp: 1, nom: 'Autres hausses sur les ménages (solde du poste)', src: 'c' },
    { lever: 'prodtax', value: -17.1, start: 2027, ramp: 1, nom: 'Suppression de la CFE, de la CVAE et de la C3S', src: 'c' },
    { lever: 'subv', value: 3.9, start: 2027, ramp: 1, nom: "Autres allègements aux entreprises (solde de l'enveloppe de 21 Md€)", src: 'c' },
    { lever: 'subv', value: -9.9, start: 2027, ramp: 1, nom: 'Aides et niches des entreprises supprimées (solde du poste)', src: 'c' },
    { lever: 'isge', value: 5.6, start: 2027, ramp: 1, nom: "Grands groupes : impôt assis sur le chiffre d'affaires et surtaxes, net", src: 'c' },
    { custom: 1, canal: 'c_revfin', montant: 11.35, eff: c, start: 2027, end: 2027, ramp: 1, nom: "Taxe exceptionnelle sur les rachats d'actions (2027)", src: 'c' },
    { sec: 'Plan du 6 octobre 2026 : économies', lever: 'benlow', value: -12.2, start: 2027, ramp: 3, nom: 'Priorité nationale : prestations de solidarité réservées', src: 'c' },
    { lever: 'benfam', value: -5.9, start: 2027, ramp: 3, nom: 'Priorité nationale : allocations familiales réservées aux foyers dont un parent est français', src: 'c' },
    { lever: 'cotall', value: 1, start: 2027, ramp: 1, nom: "Taxe à l'embauche de salariés extra-européens", src: 'c' },
    { lever: 'gfonct', value: -9.9, start: 2027, ramp: 3, nom: 'Immigration : autres économies (solde du poste de 29 Md€)', src: 'c' },
    { lever: 'eu', value: -19.5, start: 2027, ramp: 3, nom: 'Union européenne : baisse de la contribution (13,1 Md€) et autres économies', src: 'c' },
    { lever: 'subv', value: -14.3, start: 2027, ramp: 2, nom: "Fin des soutiens aux renouvelables, aux certificats d'économie d'énergie et au biogaz", src: 'c' },
    { lever: 'subv', value: -9.3, start: 2027, ramp: 2, nom: "Prix national de l'électricité", src: 'c' },
    { lever: 'subv', value: -9.2, start: 2027, ramp: 2, nom: 'Concessions, réseaux, autres (solde du poste énergie de 29 Md€)', src: 'c' },
    { lever: 'ipub', value: 3.8, start: 2027, ramp: 1, nom: 'Rénovation énergétique des logements', src: 'c' },
    { custom: 1, canal: 'c_fraude', montant: 23.8, eff: [50, 100, 110], start: 2027, ramp: 5, nom: 'Fraude : TVA prélevée à la source (18 Md€), ententes sur les marchés publics (5,8 Md€)', src: 'c' },
    { lever: 'sante', value: -28, start: 2027, ramp: 4, nom: 'Sécurité sociale : coûts hospitaliers (8,3 Md€), dépenses indues (9,5 Md€), organisation', src: 'c' },
    { lever: 'pens', value: -3.6, chiffre: 15, start: 2027, ramp: 4, nom: '« Réparation » des retraites : 15 Md€ d\'économies, mécanisme non précisé', src: 'c' },
    { lever: 'benfam', value: -10.1, start: 2027, ramp: 4, nom: 'Sécurité sociale : autres économies (solde du poste de 53,1 Md€)', src: 'c' },
    { lever: 'gjobs', value: -201, start: 2027, ramp: 5, nom: '201 000 postes non renouvelés dans les agences et les collectivités', src: 'c' },
    { lever: 'dotct', value: -8.2, start: 2027, ramp: 1, nom: 'Effort demandé aux collectivités', src: 'c' },
    { lever: 'gfonct', value: -18.7, start: 2027, ramp: 2, nom: 'État et opérateurs : agences supprimées, immobilier, autres (solde du poste de 29 Md€)', src: 'c' },
    { lever: 'educ', value: 9, start: 2027, ramp: 5, nom: 'Recherche publique', src: 'c' },
    { sec: 'Plan du 6 octobre 2026 : dépenses pour les ménages', lever: 'age', value: -2, chiffre: 9.5, start: 2027, ramp: 1, nom: 'Retraite à 62 ans, 60 ans pour les carrières longues, 42 annuités', src: 'c' },
    { lever: 'benlow', value: 9.6, start: 2028, ramp: 4, nom: 'Minimum vieillesse, handicap, familles (solde du poste de 19,1 Md€)', src: 'c' },
    { sec: 'Hypothèses de la maquette', lever: 'ir', value: -12.2, start: 2027, ramp: 1, nom: 'Budget 2027 : hausses de prélèvements non reprises par le RN (moitié de 24,4 Md€)', src: 'e' },
    { lever: 'benfam', value: 12.2, start: 2027, ramp: 1, nom: 'Budget 2027 : économies sur les prestations non reprises par le RN (moitié de 24,4 Md€)', src: 'e' },
    { lever: 'cotall', value: -0.8, start: 2028, ramp: 1, nom: 'Hausses de salaires de 10 % exonérées de cotisations patronales (programme 2024)', src: 'e' },
    { lever: 'migr', value: -100, start: 2028, ramp: 1, nom: "Baisse de l'immigration : solde migratoire réduit de 100 000 par an", src: 'e' }
  ] };
};
const PHILIPPE_DESC = "Extrapolation, pas un chiffrage officiel. Édouard Philippe n'a pas publié de chiffrage mesure par mesure. Il donne une cible (déficit ramené de plus de 5 % à 2 % du PIB en cinq ans) et une clé de partage de l'effort : moitié sur les dépenses sociales, un quart sur l'État et les collectivités, un quart attendu de la croissance. La maquette traduit cette clé en enveloppes : 3 points de PIB, soit 47 Md€ sur le social et 23,5 Md€ sur l'État et les collectivités. Elle y place d'abord les mesures annoncées, puis complète jusqu'au total par des lignes « solde de l'enveloppe ». Le quart attendu de la croissance n'est pas saisi : c'est au modèle de dire s'il arrive.";
const philippeProg = () => ({ id: 'philippe', name: 'Philippe · Horizons (extrapolation)', desc: PHILIPPE_DESC, measures: [
  { sec: 'Entreprises et travail', lever: 'prodtax', value: -50, start: 2027, ramp: 5, nom: 'Impôts de production : 50 Md€ de baisse sur cinq ans', src: 'c' },
  { lever: 'subv', value: -50, start: 2027, ramp: 5, nom: 'Aides publiques aux entreprises : 50 Md€ supprimés en contrepartie', src: 'c' },
  { lever: 'hours', value: 1.5, start: 2028, ramp: 3, nom: 'Temps de travail fixé par accord d\'entreprise : deux heures de plus par semaine pour un quart environ des salariés', src: 'e' },
  { lever: 'cotsal', value: -2, start: 2028, ramp: 3, nom: 'Heures au-delà de 35 heures exonérées de cotisations salariales', src: 'e' },
  { lever: 'cotall', value: -1.5, start: 2028, ramp: 3, nom: 'Heures au-delà de la 37e exonérées de cotisations patronales', src: 'e' },
  { lever: 'ir', value: -1, start: 2028, ramp: 3, nom: 'Heures au-delà de 35 heures exonérées d\'impôt sur le revenu', src: 'e' },
  { sec: 'Dépenses sociales : moitié de l\'effort (47 Md€)', lever: 'age', value: 1, start: 2028, ramp: 6, nom: 'Retraite à 65 ans', src: 'm' },
  { lever: 'age', value: 0.5, start: 2028, ramp: 8, nom: '45 annuités de cotisation en moins de dix ans (compté comme six mois d\'âge de plus)', src: 'e' },
  { lever: 'chom', value: -3.5, start: 2028, ramp: 2, nom: 'Chômage : indemnisation limitée à 12 mois avant 50 ans', src: 'e' },
  { lever: 'sante', value: -1, start: 2028, ramp: 1, nom: 'Arrêts maladie : trois jours de carence pour tous, public compris', src: 'e' },
  { lever: 'benlow', value: -2, start: 2028, ramp: 3, nom: 'RSA limité dans la durée', src: 'e' },
  { lever: 'sante', value: -17, start: 2028, ramp: 5, nom: 'Santé : solde de l\'enveloppe sociale', src: 'e' },
  { lever: 'benlow', value: -6, start: 2028, ramp: 5, nom: 'Aides sous condition de ressources : solde de l\'enveloppe sociale', src: 'e' },
  { lever: 'benfam', value: -6, start: 2028, ramp: 5, nom: 'Prestations familiales et logement : solde de l\'enveloppe sociale', src: 'e' },
  { sec: 'État et collectivités : un quart de l\'effort (23,5 Md€)', lever: 'gjobs', value: -250, start: 2027, ramp: 5, nom: 'Un départ à la retraite sur trois non remplacé : 250 000 postes en cinq ans', src: 'c' },
  { lever: 'gfonct', value: -5.5, start: 2028, ramp: 4, nom: 'Agences et opérateurs fusionnés ou supprimés : solde de l\'enveloppe', src: 'e' },
  { lever: 'dotct', value: -4, start: 2028, ramp: 4, nom: 'Collectivités : solde de l\'enveloppe', src: 'e' },
  { sec: 'Dépenses nouvelles et baisses d\'impôts', lever: 'ir', value: -4, start: 2028, ramp: 3, nom: 'Impôt sur le revenu suspendu trois ans après une naissance pour les classes moyennes, réduction de 3 000 € au-dessus', src: 'e' },
  { lever: 'educ', value: 6, start: 2028, ramp: 5, nom: 'Enseignants payés 20 % de plus en cinq ans', src: 'e' },
  { lever: 'ipub', value: 2, start: 2028, ramp: 1, nom: 'Fonds d\'adaptation au changement climatique : 2 Md€ par an', src: 'c' },
  { sec: 'Hypothèse de la maquette', lever: 'migr', value: -60, start: 2028, ramp: 1, nom: 'Immigration légale réduite : solde migratoire en baisse de 60 000 par an', src: 'e' }
] });
const LISNARD_DESC = "Extrapolation, pas un chiffrage officiel. Ossature : les annonces de David Lisnard, soit 200 Md€ d'économies par an en fin de mandat (80 Md€ dès la première année), dont 120 Md€ rendus aux actifs en baisse de cotisations, 40 Md€ en baisse d'impôts de production et 40 Md€ pour réduire le déficit. Il n'a pas détaillé les économies poste par poste : leur ventilation est celle de la maquette, d'après les postes qu'il cite (fonction publique, agences, collectivités, allocation sociale unique, aides aux entreprises, pensions au-dessus de 2 000 €). Le partage des 120 Md€ entre cotisations salariales et patronales est aussi une hypothèse.";
const lisnardProg = () => ({ id: 'lisnard', name: 'Lisnard · Nouvelle Énergie (extrapolation)', desc: LISNARD_DESC, measures: [
  { sec: 'Baisses de prélèvements : 160 Md€', lever: 'cotsal', value: -90, start: 2027, ramp: 3, nom: 'Cotisations salariales : part des 120 Md€ rendus aux actifs', src: 'c' },
  { lever: 'cotall', value: -30, start: 2027, ramp: 3, nom: 'Cotisations patronales entre 2 et 4 SMIC : part des 120 Md€ rendus aux actifs', src: 'c' },
  { lever: 'prodtax', value: -40, start: 2027, ramp: 3, nom: 'Impôts de production : 40 Md€, en commençant par la C3S et la CVAE', src: 'c' },
  { sec: 'Économies : 200 Md€, ventilation de la maquette', lever: 'gjobs', value: -400, start: 2027, ramp: 5, nom: 'Fonction publique : départs non remplacés, 400 000 postes en cinq ans', src: 'e' },
  { lever: 'gfonct', value: -40, start: 2027, ramp: 3, nom: 'État recentré : agences, opérateurs, agences régionales de santé, fonctionnement', src: 'e' },
  { lever: 'dotct', value: -15, start: 2027, ramp: 3, nom: 'Collectivités : départements et régions fusionnés en provinces', src: 'e' },
  { lever: 'subv', value: -40, start: 2027, ramp: 3, nom: 'Aides aux entreprises supprimées, remplacées par les baisses de charges', src: 'e' },
  { lever: 'benlow', value: -20, start: 2027, ramp: 3, nom: 'Allocation sociale unique plafonnée : minima et aides ciblées', src: 'e' },
  { lever: 'benfam', value: -10, start: 2027, ramp: 3, nom: 'Allocation sociale unique plafonnée : aides au logement et prestations', src: 'e' },
  { lever: 'sante', value: -30, start: 2027, ramp: 3, nom: 'Santé et hôpital', src: 'e' },
  { lever: 'chom', value: -6, start: 2027, ramp: 3, nom: 'Assurance chômage', src: 'e' },
  { lever: 'pens', value: -4, start: 2028, ramp: 5, nom: 'Pensions au-dessus de 2 000 € par mois désindexées cinq ans (environ 17 Md€), pour amorcer la capitalisation', src: 'e' },
  { sec: 'Dépenses nouvelles et autres mesures', lever: 'educ', value: 6, start: 2028, ramp: 5, nom: 'Enseignants payés 20 % de plus en cinq ans', src: 'e' },
  { lever: 'ir', value: -3, start: 2028, ramp: 1, nom: 'Quotient familial déplafonné', src: 'e' },
  { sec: 'Hypothèse de la maquette', lever: 'migr', value: -150, start: 2028, ramp: 1, nom: 'Titres de séjour divisés par huit : solde migratoire en baisse de 150 000 par an', src: 'e' }
] });
const exampleProgs = () => [
  { id: 'exA', name: 'Exemple A · relance (fictif)', measures: [
    { lever: 'smic', value: 5, start: 2027, ramp: 1 }, { lever: 'benlow', value: 10, start: 2027, ramp: 1 },
    { lever: 'ipub', value: 30, start: 2028, ramp: 5 }, { lever: 'irtop', value: 10, start: 2028, ramp: 1 }, { lever: 'isf', value: 20, start: 2028, ramp: 1 },
    { custom: 1, nom: 'Lutte contre la fraude fiscale', canal: 'c_fraude', montant: 60, eff: [20, 50, 90], start: 2028, ramp: 3 },
    { lever: 'succ', value: 20, start: 2028, ramp: 1 }, { lever: 'age', value: -3, start: 2027, ramp: 3 },
    { custom: 1, nom: 'Investissement public 2', canal: 'c_invest', montant: 70, eff: [100, 100, 100], start: 2028, ramp: 4 }] },
  { id: 'exB', name: 'Exemple B · consolidation (fictif)', measures: [
    { lever: 'gfonct', value: -20, start: 2027, ramp: 3 }, { lever: 'pens', value: -1, start: 2028, ramp: 1 },
    { lever: 'age', value: 1, start: 2028, ramp: 1 }, { lever: 'prodtax', value: -10, start: 2028, ramp: 2 }, { lever: 'cotlow', value: -8, start: 2028, ramp: 1 },
    { custom: 1, nom: "Réforme de l'État, gains d'efficacité", canal: 'c_eco', montant: 15, eff: [30, 60, 100], start: 2028, ramp: 4 }] },
  lfiProg(), rnProg(), philippeProg(), lisnardProg()
];
const API = { copyBar, lfiProg, rnProg, philippeProg, lisnardProg, exampleProgs };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.PROGRAMMES = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
