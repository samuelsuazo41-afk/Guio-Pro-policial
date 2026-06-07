// js/generaParagraf.js - Genera 1 paràgraf V8 amb bancs policials
import { loadAllBancs } from './loadBancs.js';

let cacheBancs = null;

// Funció per agafar item random d'un array
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Funció per substituir placeholders {{variable}}
const injectaPlaceholders = (texto, bancs, escenari) => {
  let result = texto;
  
  // {{ciutat}} i {{escenari}} venen de l'escenari triat
  result = result.replace(/{{ciutat}}/g, escenari.ciutat || 'la ciutat');
  result = result.replace(/{{escenari}}/g, escenari.nom || 'l\'escenari');
  
  // {{so}} i {{olor}} venen de bancs_sons i bancs_olors filtrats per l'escenari
  const sons = bancs.banco_sons || [];
  const olors = bancs.banco_olors || [];
  
  if (sons.length > 0) {
    const so = rand(sons).texto || rand(sons);
    result = result.replace(/{{so}}/g, so);
  }
  
  if (olors.length > 0) {
    const olor = rand(olors).texto || rand(olors);
    result = result.replace(/{{olor}}/g, olor);
  }
  
  return result;
};

export async function generaParagraf(escenariId = null, emocioId = null) {
  // Cache dels bancs per no fer fetch cada paràgraf
  if (!cacheBancs) {
    cacheBancs = await loadAllBancs();
  }
  const bancs = cacheBancs;

  // 1. TRIAR ESCENARI: Si no passa ID, agafa un random de policial
  const escenaris = bancs.banco_escenarios_policial || bancs.banco_escenarios || [];
  const escenari = escenariId 
    ? escenaris.find(e => e.id === escenariId) 
    : rand(escenaris);

  if (!escenari) {
    console.error('❌ No hi ha escenaris carregats');
    return 'Error: sense escenari.';
  }

  // 2. TRIAR EMOCIÓ: Si no passa ID, agafa random de banco_emocions
  const emocions = bancs.banco_emocions?.emocions || [];
  const emocio = emocioId
    ? emocions.find(e => e.id === emocioId)
    : rand(emocions);

  if (!emocio) {
    console.error('❌ No hi ha emocions carregades');
    return 'Error: sense emoció.';
  }

  // 3. MUNTAR TEXTO_BASE: {{sensacio}} {{pensament}} {{reaccio}} {{so_ambient}}
  const variables = emocio.banco_variables || {};
  let paràgraf = emocio.texto_base || '{{sensacio}} {{pensament}}';

  // 4. SUBSTITUIR VARIABLES: 1 frase random de cada array de 20
  paràgraf = paràgraf.replace(/{{sensacio}}/g, rand(variables.sensacio || ['']));
  paràgraf = paràgraf.replace(/{{pensament}}/g, rand(variables.pensament || ['']));
  paràgraf = paràgraf.replace(/{{reaccio}}/g, rand(variables.reaccio || ['']));
  paràgraf = paràgraf.replace(/{{so_ambient}}/g, rand(variables.so_ambient || ['']));

  // 5. INJECTAR PLACEHOLDERS: {{so}} {{olor}} {{ciutat}} des d'escenari + bancs
  paràgraf = injectaPlaceholders(paràgraf, bancs, escenari);

  // 6. MÈTRICA RITME: Aplica banco_lectura si intensitat = alta
  if (emocio.intensitat === 'alta' && bancs.banco_lectura) {
    const regla = bancs.banco_lectura.find(r => r.tipus === 'accio') || {};
    const maxParaules = regla.max_paraules_frase || 12;
    
    // Talla frases massa llargues per ritme
    paràgraf = paràgraf.split('. ').map(frase => {
      if (frase.split(' ').length > maxParaules) {
        return frase.split(', ').join('. ');
      }
      return frase;
    }).join('. ');
  }

  // 7. LOG V8 per debug
  console.log(`📝 Paràgraf V8: ${emocio.id} + ${escenari.id} | Intensitat: ${emocio.intensitat}`);

  return paràgraf.trim();
}

// Funció test ràpida per mòbil
export async function testParagraf() {
  const p = await generaParagraf();
  console.log('--- TEST PARÀGRAF V8 ---');
  console.log(p);
  console.log('--- FI TEST ---');
  return p;
}
