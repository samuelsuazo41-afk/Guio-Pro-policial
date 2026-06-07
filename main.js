// js/main.js - Guio-Pro-Policial V9.6
// Repo: Guio-Pro-policial
// Cache busting amb?v=Date.now() per evitar servei antic

let BANCS = {};
let generarEscenaMotor = null;

// CARREGAR MOTOR AMB RETRY + CACHE BUSTING
async function cargarMotor() {
  try {
    await import(`./generadorLlibre.js?v=${Date.now()}`);
  } catch (e1) {
    console.error('❌ ERROR CRÍTIC:', e1);
    alert('ERROR: No es pot carregar /js/generadorLlibre.js');
    return false;
  }
  generarEscenaMotor = window.generarEscena;
  if (typeof generarEscenaMotor!== 'function') {
    alert('ERROR: window.generarEscena no és funció');
    return false;
  }
  console.log('✅ Motor V9.6 carregat');
  return true;
}
await cargarMotor();

// FUNCIÓ UNIFICADA: Config editorial segons ritme
function getConfigEditorial(ritme) {
  if (ritme === 'Relat Curt') {
    return {
      numCapitols: 4,
      paraulesTotals: 5000,
      escenesPerCap: 5,
      paraulesPerEscena: 250,
      estructura: ['Obertura', 'Tema plantejat', 'Setup', 'Catalitzador']
    };
  } else if (ritme === 'Èpic') {
    return {
      numCapitols: 30,
      paraulesTotals: 72000,
      escenesPerCap: 8,
      paraulesPerEscena: 300,
      estructura: ['Obertura', 'Tema plantejat', 'Setup', 'Catalitzador', 'Midpoint', 'Desesperança', 'Clímax', 'Resolució']
    };
  } else { // Novel·la estàndard
    return {
      numCapitols: 20,
      paraulesTotals: 60000,
      escenesPerCap: 6,
      paraulesPerEscena: 500,
      estructura: ['Obertura', 'Tema plantejat', 'Setup', 'Catalitzador', 'Midpoint', 'Desesperança']
    };
  }
}

// PICK ALEATORI SUBTUBS EVITANT REPETIR
function pickSubtub(subtubs, hist) {
  if (!subtubs || subtubs.length === 0) return null;
  const disponibles = subtubs.filter(s =>!hist.ubicacions.includes(s.nom));
  const pool = disponibles.length > 0? disponibles : subtubs;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// GENERADOR DE LLIBRE COMPLET V9.6
export async function generarLlibre(seleccio, bancs) {
  if (!generarEscenaMotor) throw new Error('Motor no carregat');

  BANCS = bancs;
  const config = getConfigEditorial(seleccio.ritme);

  const personatges = BANCS.banco_personatge || [];
  const ubicacions = BANCS.banco_ubicacion || [{ciutat:'Girona', subtubs:[]}];

  const persBanc = seleccio.personatgeId
? personatges.find(p => p.id === seleccio.personatgeId)
    : personatges.find(p => p.genero === seleccio.genere) || personatges[0];

  const ciutatPrincipal = seleccio.ciutatPrincipal || 'Girona';
  const ciutatPrincipal2 = seleccio.ciutatPrincipal2 || null;
  const ubi = ubicacions.find(u => u.ciutat === ciutatPrincipal) || ubicacions[0];

  const configBase = {
    genere: seleccio.genere,
    subgenere: seleccio.subgenere || 'thriller',
    nom: persBanc?.banco_variables?.nom?.[0] || 'Protagonista',
    tic: persBanc?.banco_variables?.tic?.[0] || 'es passa la mà per la barba',
    ciutat: ubi.ciutat,
    ciutat2: ciutatPrincipal2,
    subtubsActius: seleccio.subtubsPrincipal || [],
    subtubsActius2: seleccio.subtubsPrincipal2 || [],
    subtubsExtra: seleccio.subtubsExtra || {},
    sinopsis: seleccio.sinopsis || ''
  };

  let hist = {
    ubicacions: [],
    olors: [],
    sons: [],
    emocions: [],
    frasesUsades: [],
    tensions: 0,
    capActe: 1
  };

  const beats = config.estructura;
  const capitols = [];

  for (let numCap = 1; numCap <= config.numCapitols; numCap++) {
    const beatNom = beats[(numCap - 1) % beats.length];
    const escenes = [];

    let ciutatActual = configBase.ciutat;
    let subtubsActuals = configBase.subtubsActius;

    if (configBase.ciutat2 && numCap > 6 && numCap <= 12) {
      ciutatActual = configBase.ciutat2;
      subtubsActuals = configBase.subtubsActius2;
    } else if (seleccio.ciutatsExtra.length > 0 && numCap > 12) {
      const idxExtra = (numCap - 13) % seleccio.ciutatsExtra.length;
      ciutatActual = seleccio.ciutatsExtra[idxExtra];
      subtubsActuals = configBase.subtubsExtra[ciutatActual] || [];
    }

    for (let numEsc = 1; numEsc <= config.escenesPerCap; numEsc++) {
      const subtub = pickSubtub(subtubsActuals, hist);
      const configEscena = {
  ...configBase,
        ciutat: ciutatActual,
        subtubActual: subtub? subtub.nom : null
      };

      const resultat = generarEscenaMotor(
        beatNom,
        configEscena,
        bancs,
        hist,
        numCap,
        numEsc,
        config.numCapitols,
        config.paraulesPerEscena
      );
      hist = resultat.hist;
      escenes.push({ titol: `Escena ${numEsc}`, text: resultat.text });
    }

    escenes.push({
      titol: '',
      text: `<em>${beatNom} s'acabava amb ${configBase.nom} mirant cap a ${ciutatActual}</em>`
    });

    capitols.push({ num: numCap, beat: beatNom, escenes });
  }

  return {
    capitols,
    metadata: {
      paraulesAprox: config.paraulesTotals,
      nCapitols: config.numCapitols,
      ritme: seleccio.ritme,
      genere: seleccio.genere,
      subgenere: seleccio.subgenere,
      sinopsis: seleccio.sinopsis,
      personatge: configBase.nom,
      ciutat: configBase.ciutat,
      ciutat2: configBase.ciutat2,
      subtubs: configBase.subtubsActius,
      subtubs2: configBase.subtubsActius2,
      paraulesPerEscena: config.paraulesPerEscena
    }
  };
}

// GENERADOR DE LECTURA - USA EL MATEIX MOTOR I ESTÀNDAR
export async function generarLectura(seleccio, bancs, numEscenes = 1) {
  if (!generarEscenaMotor) throw new Error('Motor no carregat');

  BANCS = bancs;
  const config = getConfigEditorial(seleccio.ritme);

  const personatges = BANCS.banco_personatge || [];
  const ubicacions = BANCS.banco_ubicacion || [{ciutat:'Girona', subtubs:[]}];

  const persBanc = seleccio.personatgeId
? personatges.find(p => p.id === seleccio.personatgeId)
    : personatges.find(p => p.genero === seleccio.genere) || personatges[0];

  const ciutatPrincipal = seleccio.ciutatPrincipal || 'Girona';
  const ubi = ubicacions.find(u => u.ciutat === ciutatPrincipal) || ubicacions[0];

  const configBase = {
    genere: seleccio.genere,
    subgenere: seleccio.subgenere || 'thriller',
    nom: persBanc?.banco_variables?.nom?.[0] || 'Protagonista',
    tic: persBanc?.banco_variables?.tic?.[0] || 'es passa la mà per la barba',
    ciutat: ubi.ciutat,
    subtubsActius: seleccio.subtubsPrincipal || [],
    sinopsis: seleccio.sinopsis || ''
  };

  let hist = {
    ubicacions: [],
    olors: [],
    sons: [],
    emocions: [],
    frasesUsades: [],
    tensions: 0,
    capActe: 1
  };

  const beats = config.estructura;
  const escenes = [];

  for (let i = 0; i < numEscenes; i++) {
    const beatNom = beats[i % beats.length];
    const numCap = Math.floor(i / config.escenesPerCap) + 1;
    const numEsc = (i % config.escenesPerCap) + 1;

    const subtub = pickSubtub(configBase.subtubsActius, hist);
    const configEscena = {
...configBase,
      subtubActual: subtub? subtub.nom : null
    };

    const resultat = generarEscenaMotor(
      beatNom,
      configEscena,
      bancs,
      hist,
      numCap,
      numEsc,
      config.numCapitols,
      config.paraulesPerEscena
    );
    hist = resultat.hist;

    escenes.push({
      beat: beatNom,
      text: resultat.text,
      paraules: resultat.text.trim().split(/\s+/).length
    });
  }

  return {
    escenes,
    metadata: {
      ritme: seleccio.ritme,
      paraulesPerEscena: config.paraulesPerEscena,
      totalParaules: escenes.reduce((sum, e) => sum + e.paraules, 0)
    }
  };
}