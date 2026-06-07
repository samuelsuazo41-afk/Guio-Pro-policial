// js/generaParagraf.js - V8 amb beats de 3 actes connectats
import { loadAllBancs } from './loadBancs.js';

let cacheBancs = null;
let beatActual = 0; // Controla quin beat de l'estructura estem

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const injectaPlaceholders = (texto, bancs, escenari) => {
  let result = texto;
  result = result.replace(/{{ciutat}}/g, escenari.ciutat || 'la ciutat');
  result = result.replace(/{{escenari}}/g, escenari.nom || 'l\'escenari');

  const sons = bancs.banco_sons || [];
  const olors = bancs.banco_olors || [];

  if (sons.length > 0) result = result.replace(/{{so}}/g, rand(sons).texto || rand(sons));
  if (olors.length > 0) result = result.replace(/{{olor}}/g, rand(olors).texto || rand(olors));

  return result;
};

// NOVA: Mapa beat → emoció forçada per seguir arc dramàtic
const mapaBeatsEmocio = {
  // ACTE 1 - Plantejament 25%
  'inciting_incident': 'emo_pol_tensio',
  'plantejament': 'emo_pol_desconfianca',
  'punt_no_retorn': 'emo_pol_furia',

  // ACTE 2 - Confrontació 50%
  'primer_giro': 'emo_pol_tensio',
  'punt_mitja': 'emo_pol_furia',
  'segon_giro': 'emo_pol_desconfianca',
  'crisi': 'emo_pol_tensio',

  // ACTE 3 - Resolució 25%
  'climax': 'emo_pol_furia',
  'resolucio': 'emo_pol_desconfianca',
  'desenllac': 'emo_pol_desconfianca'
};

export async function generaParagraf(escenariId = null, forcarEmocioId = null, resetBeat = false) {
  if (!cacheBancs) cacheBancs = await loadAllBancs();
  const bancs = cacheBancs;

  // RESET BEAT: Quan comences llibre nou, posa beat a 0
  if (resetBeat) beatActual = 0;

  // 1. LLEGIR BEAT ACTUAL de banco_estructura
  const beats = bancs.banco_estructura?.beats || [];
  const beat = beats[beatActual] || beats[0] || { id: 'plantejament', tipus: 'descripcio' };

  // 2. TRIAR EMOCIÓ SEGONS BEAT: Si no forces ID, agafa la del mapa
  let emocioId = forcarEmocioId;
  if (!emocioId) {
    emocioId = mapaBeatsEmocio[beat.id] || 'emo_pol_tensio';
  }

  const emocions = bancs.banco_emocions?.emocions || [];
  const emocio = emocions.find(e => e.id === emocioId) || rand(emocions);

  // 3. TRIAR ESCENARI
  const escenaris = bancs.banco_escenarios_policial || bancs.banco_escenarios || [];
  const escenari = escenariId
   ? escenaris.find(e => e.id === escenariId)
    : rand(escenaris);

  if (!escenari ||!emocio) {
    console.error('❌ Falta escenari o emoció');
    return 'Error: sense dades.';
  }

  // 4. MUNTAR PARÀGRAF amb variables
  const variables = emocio.banco_variables || {};
  let paràgraf = emocio.texto_base || '{{sensacio}} {{pensament}}';
  paràgraf = paràgraf.replace(/{{sensacio}}/g, rand(variables.sensacio || ['']));
  paràgraf = paràgraf.replace(/{{pensament}}/g, rand(variables.pensament || ['']));
  paràgraf = paràgraf.replace(/{{reaccio}}/g, rand(variables.reaccio || ['']));
  paràgraf = paràgraf.replace(/{{so_ambient}}/g, rand(variables.so_ambient || ['']));

  // 5. INJECTAR PLACEHOLDERS
  paràgraf = injectaPlaceholders(paràgraf, bancs, escenari);

  // 6. MÈTRICA RITME segons beat
  if (beat.tipus === 'accio' || beat.tipus === 'climax') {
    const regla = bancs.banco_lectura?.find(r => r.tipus === 'accio') || {};
    const maxParaules = regla.max_paraules_frase || 8;
    paràgraf = paràgraf.split('. ').map(f =>
      f.split(' ').length > maxParaules? f.split(', ').join('. ') : f
    ).join('. ');
  }

  // 7. AVANÇAR BEAT: Cada 3-4 paràgrafs avança al següent beat
  // Així 15 paràgrafs = 4 beats = 1 escena completa
  if (Math.random() > 0.75 && beatActual < beats.length - 1) {
    beatActual++;
  }

  console.log(`📝 Beat ${beatActual}/${beats.length}: ${beat.id} → Emoció: ${emocio.id} | ${escenari.ciutat}`);

  return {
    texto: paràgraf.trim(),
    beat: beat.id,
    emocio: emocio.id,
    escenari: escenari.id,
    intensitat: emocio.intensitat
  };
}

export async function resetEstructura() {
  beatActual = 0;
  console.log('🔄 Estructura resetejada. Llibre nou des de Beat 0');
}

export async function testParagrafAmbBeats() {
  await resetEstructura();
  console.log('--- TEST 4 PARÀGRAFS AMB BEATS ---');
  for(let i = 0; i < 4; i++) {
    const res = await generaParagraf();
    console.log(`[${i+1}] Beat: ${res.beat} | ${res.texto}`);
  }
  console.log('--- FI TEST ---');
      }
