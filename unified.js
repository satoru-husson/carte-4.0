// Script simple pour créer le JSON unifié L1-L4
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
// const capabilities = ... (capabilities.json supprimé)
const bcL4Mapping = JSON.parse(fs.readFileSync('bc-l4-mapping.json', 'utf8'));

console.log('📋 Génération JSON unifié...');

const result = {};

data.forEach(app => {
    const appResult = {
        name: app.name,
        countries: app.countries,
        category: app.category,
        capabilities: [...(app.capabilities || [])], // Capabilities écrites
        implementedL4: [...(app.implementedL4 || [])], // L4 implémentés
        l1_capabilities: new Set(),
        l2_capabilities: new Set(), 
        l3_capabilities: new Set(),
        l3_details: []
    };

    // 1. TRAITER LES CAPABILITIES ÉCRITES
    if (app.capabilities) {
        app.capabilities.forEach(capId => {
            const capDef = capabilities[capId];
            if (capDef) {
                if (capDef.l1_name) appResult.l1_capabilities.add(capDef.l1_name);
                if (capDef.l2_name) appResult.l2_capabilities.add(`${capDef.l1_name} > ${capDef.l2_name}`);
                if (capDef.l3_name) {
                    appResult.l3_capabilities.add(capId);
                    appResult.l3_details.push({
                        l3_id: capId,
                        l1_name: capDef.l1_name,
                        l2_name: capDef.l2_name,
                        l3_name: capDef.l3_name
                    });
                }
            }
        });
    }

    // 2. TRAITER LES L4 IMPLÉMENTÉS → GÉNÉRER L3
    if (app.implementedL4) {
        app.implementedL4.forEach(l4 => {
            // Trouver le L3 qui contient ce L4
            const l3Id = Object.keys(bcL4Mapping).find(l3 => bcL4Mapping[l3].includes(l4));
            
            if (l3Id && capabilities[l3Id]) {
                const capDef = capabilities[l3Id];
                
                // Ajouter aux capabilities générées (éviter doublons)
                if (!appResult.capabilities.includes(l3Id)) {
                    appResult.capabilities.push(l3Id);
                }
                
                if (capDef.l1_name) appResult.l1_capabilities.add(capDef.l1_name);
                if (capDef.l2_name) appResult.l2_capabilities.add(`${capDef.l1_name} > ${capDef.l2_name}`);
                if (capDef.l3_name) {
                    appResult.l3_capabilities.add(l3Id);
                    
                    // Éviter les doublons dans l3_details
                    const exists = appResult.l3_details.some(detail => detail.l3_id === l3Id);
                    if (!exists) {
                        appResult.l3_details.push({
                            l3_id: l3Id,
                            l1_name: capDef.l1_name,
                            l2_name: capDef.l2_name,
                            l3_name: capDef.l3_name
                        });
                    }
                }
            }
        });
    }

    // Convertir Sets en Arrays
    appResult.l1_capabilities = Array.from(appResult.l1_capabilities);
    appResult.l2_capabilities = Array.from(appResult.l2_capabilities);
    appResult.l3_capabilities = Array.from(appResult.l3_capabilities);

    result[app.name] = appResult;
});

// Après avoir construit appResult pour chaque application, recompute et overwrite l2 et l3
Object.keys(result).forEach(appName => {
  const app = result[appName];
  // Fonctions d'aide
  function getL2forL3(l3) {
    if (capabilities[l3] && capabilities[l3].l2_name) return l3;
    for (const [code, obj] of Object.entries(capabilities)) {
      if (obj.l3_name && code === l3 && obj.l2_name) return obj.l2_name;
    }
    return null;
  }
  function getL2forL4(l4) {
    for (const [l3, l4s] of Object.entries(bcL4Mapping)) {
      if (l4s.includes(l4)) {
        return getL2forL3(l3);
      }
    }
    return null;
  }
  function getL3forL4(l4) {
    for (const [l3, l4s] of Object.entries(bcL4Mapping)) {
      if (l4s.includes(l4)) return l3;
    }
    return null;
  }
  // Construire un nouvel ensemble L2
  const l2Set = new Set(app.l2_capabilities || []);
  for (const l3 of app.l3_capabilities || []) {
    const l2 = getL2forL3(l3);
    if (l2) l2Set.add(l2);
  }
  if (app.implementedL4) {
    for (const l4 of app.implementedL4) {
      const l2 = getL2forL4(l4);
      if (l2) l2Set.add(l2);
    }
  }
  app.l2_capabilities = Array.from(l2Set);

  // Construire un nouvel ensemble L3 (explicite + inféré depuis L4)
  const l3Set = new Set(app.l3_capabilities || []);
  if (app.implementedL4) {
    for (const l4 of app.implementedL4) {
      const l3 = getL3forL4(l4);
      if (l3) l3Set.add(l3);
    }
  }
  app.l3_capabilities = Array.from(l3Set);
});

// Sauvegarder
fs.writeFileSync('app-capabilities-unified.json', JSON.stringify(result, null, 2));

console.log(`✅ Fichier créé: app-capabilities-unified.json`);
console.log(`📊 ${Object.keys(result).length} applications traitées`);

// --- Vérification de la complétude des L2 pour une application (ex: INES) ---
function getL2forL3(l3) {
  // Trouver le code L2 parent d'un L3 dans la nouvelle structure
  if (capabilities[l3] && capabilities[l3].l2_name) return l3;
  // Sinon, chercher le parent L2 via les définitions
  for (const [code, obj] of Object.entries(capabilities)) {
    if (obj.l3_name && code === l3 && obj.l2_name) return obj.l2_name;
  }
  return null;
}

function getL2forL4(l4) {
  // Trouver le L3 parent d'un L4, puis son L2 parent
  for (const [l3, l4s] of Object.entries(bcL4Mapping)) {
    if (l4s.includes(l4)) {
      return getL2forL3(l3);
    }
  }
  return null;
}

function getAllL2s(appName) {
  const app = result[appName];
  const explicitL2s = new Set(app.l2_capabilities);

  // Depuis les L3
  for (const l3 of app.l3_capabilities) {
    const l2 = getL2forL3(l3);
    if (l2) explicitL2s.add(l2);
  }

  // Depuis les L4
  if (app.implementedL4) {
    for (const l4 of app.implementedL4) {
      const l2 = getL2forL4(l4);
      if (l2) explicitL2s.add(l2);
    }
  }

  return Array.from(explicitL2s);
}

// Exemple d'utilisation pour INES
const appName = 'INES';
const l2InData = new Set(result[appName].l2_capabilities);
const l2Computed = new Set(getAllL2s(appName));

const missing = [...l2Computed].filter(l2 => !l2InData.has(l2));
const extra = [...l2InData].filter(l2 => !l2Computed.has(l2));

console.log('L2 in data:', Array.from(l2InData));
console.log('L2 computed:', Array.from(l2Computed));
console.log('Missing in data:', missing);
console.log('Extra in data:', extra);