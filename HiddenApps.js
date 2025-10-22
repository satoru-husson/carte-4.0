/**
 * Construit dynamiquement une "Matrix combinée" pour une région donnée à partir des variantes hidden
 * @param {string} region - Nom de la région (ex: 'europe')
 * @param {Array} allApps - window.allApplications
 * @returns {Object|null} - Objet Matrix combiné ou null si aucune variante
 *   { name, regions, countries, l1, l2, l3, l4, category, hidden, originalVariants }
 */
function getCombinedMatrixForRegion(region, allApps) {
    // Récupérer toutes les variantes Matrix hidden présentes dans cette région
    const variants = allApps.filter(app => app.hidden === true && app.name.startsWith('Matrix ') && Array.isArray(app.regions) && app.regions.includes(region));
    if (!variants || variants.length === 0) return null;
    // Fusionner les capabilities (l1, l2, l3, l4)
    const l1 = [];
    const l2 = [];
    const l3 = [];
    const l4 = [];
    const categories = new Set();
    const countries = new Set();
    variants.forEach(variant => {
        if (Array.isArray(variant.l1)) l1.push(...variant.l1);
        if (Array.isArray(variant.l2)) l2.push(...variant.l2);
        if (Array.isArray(variant.l3)) l3.push(...variant.l3);
        if (Array.isArray(variant.l4)) l4.push(...variant.l4);
        if (variant.category) categories.add(variant.category);
        if (Array.isArray(variant.countries)) variant.countries.forEach(c => countries.add(c));
    });
    // Nom affiché : "Matrix (combiné)"
    return {
        name: 'Matrix',
        regions: [region],
        countries: Array.from(countries),
        l1: [...new Set(l1)],
        l2: [...new Set(l2)],
        l3: [...new Set(l3)],
        l4: [...new Set(l4)],
        category: Array.from(categories).join(' / '),
        hidden: false,
        originalVariants: variants
    };
}
/**
 * Construit dynamiquement une "Matrix combinée" pour un pays donné à partir des variantes hidden
 * @param {string} country - Nom du pays
 * @param {Array} allApps - window.allApplications
 * @returns {Object|null} - Objet Matrix combiné ou null si aucune variante
 *   { name, countries, l1, l2, l3, l4, category, hidden, originalVariants }
 */
function getCombinedMatrixForCountry(country, allApps) {
    // Récupérer toutes les variantes Matrix hidden présentes dans ce pays
    const variants = getHiddenVariantsForCountry('Matrix', country, allApps);
    if (!variants || variants.length === 0) return null;
    // Fusionner les capabilities (l1, l2, l3, l4)
    const l1 = [];
    const l2 = [];
    const l3 = [];
    const l4 = [];
    const categories = new Set();
    variants.forEach(variant => {
        if (Array.isArray(variant.l1)) l1.push(...variant.l1);
        if (Array.isArray(variant.l2)) l2.push(...variant.l2);
        if (Array.isArray(variant.l3)) l3.push(...variant.l3);
        if (Array.isArray(variant.l4)) l4.push(...variant.l4);
        if (variant.category) categories.add(variant.category);
    });
    // Fusionner les pays couverts par ces variantes
    const countries = mergeCountries(variants);
    // Nom affiché : "Matrix (combiné)"
    return {
        name: 'Matrix',
        countries,
        l1: [...new Set(l1)],
        l2: [...new Set(l2)],
        l3: [...new Set(l3)],
        l4: [...new Set(l4)],
        category: Array.from(categories).join(' / '),
        hidden: false,
        originalVariants: variants
    };
}
/**
 * Retourne les applications uniques à une région (présentes uniquement dans cette région)
 * @param {string} regionName - Nom de la région (ex: 'europe')
 * @param {Array} allApps - Liste de toutes les applications (window.allApplications)
 * @returns {Object} - { count: number, apps: Array<string> }
 */
function getUniqueAppsForRegion(regionName, allApps) {
    if (!Array.isArray(allApps)) {
        console.warn('[getUniqueAppsForRegion] allApps n\'est pas un tableau');
        return { count: 0, apps: [] };
    }
    // Filtrer les apps qui ont regions comme tableau et qui ne sont présentes que dans cette région
    const uniqueApps = allApps.filter(app => {
        if (!Array.isArray(app.regions)) return false;
        // Nettoyer les noms de région (trim, lower)
        const regionsNorm = app.regions.map(r => (typeof r === 'string' ? r.trim().toLowerCase() : r));
        return regionsNorm.length === 1 && regionsNorm[0] === regionName.trim().toLowerCase();
    }).map(app => app.name);
    return { count: uniqueApps.length, apps: uniqueApps };
}
/**
 * Affiche les boutons flottants des variantes Matrix sur la carte (8 boutons)
 * Cette fonction remplace l'ancienne showMatrixVariantsButtons de index.html
 */
function showMatrixVariantsButtons() {
    // Masquer le container du bouton normal
    const normalContainer = document.getElementById('selected-app-container');
    if (normalContainer) normalContainer.style.display = 'none';

    // Chercher les variantes Matrix dans la liste globale (hidden: true, nom commence par 'Matrix ')
    let matrixVariants = [];
    if (window.allApplications) {
        matrixVariants = window.allApplications.filter(app => app.hidden === true && app.name.startsWith('Matrix '));
    }
    if (!matrixVariants || matrixVariants.length === 0) {
        return;
    }
    // Créer ou récupérer le container des boutons Matrix
    let matrixContainer = document.getElementById('matrix-variants-container');
    if (!matrixContainer) {
        matrixContainer = document.createElement('div');
        matrixContainer.id = 'matrix-variants-container';
        matrixContainer.style.cssText = `
            position: fixed;
            top: max(20px, 5vh);
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            justify-content: center;
            max-width: 90vw;
        `;
        document.body.appendChild(matrixContainer);
    }
    // Déterminer le pays sélectionné (si présent)
    let selectedCountry = window.selectedCountryName;
    let selectedRegion = window.selectedRegionName;
    // Afficher tous les boutons, mais colorier ceux qui couvrent le pays ou la région sélectionné(e)
    let buttonsHTML = '';
    matrixVariants.forEach(variant => {
        const shortName = variant.name.replace('Matrix ', '');
        let isHighlighted = false;
        if (selectedCountry && Array.isArray(variant.countries) && variant.countries.includes(selectedCountry)) {
            isHighlighted = true;
        } else if (selectedRegion && Array.isArray(variant.regions) && variant.regions.includes(selectedRegion)) {
            isHighlighted = true;
        }
        const buttonColor = isHighlighted ? '#d32f2f' : '#1976d2';
        buttonsHTML += `
            <button class="matrix-variant-button" data-variant='${JSON.stringify(variant)}' 
                    style="background: ${buttonColor}; color: white; border: none; border-radius: 25px; padding: 12px 18px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s ease; text-align: center; white-space: nowrap; min-width: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style=\"font-size: 14px; font-weight: bold;\">${shortName}</div>
                <div style=\"font-size: 12px; margin-top: 2px; opacity: 0.9;\">${variant.category}</div>
            </button>
        `;
    });
    // Ajouter un bouton de fermeture discret à la fin
    const closeButton = document.createElement('button');
    closeButton.id = 'close-matrix-variants';
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        background: rgba(0,0,0,0.1);
        color: #666;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 18px;
        font-weight: normal;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        margin-left: 10px;
    `;

    matrixContainer.innerHTML = buttonsHTML;
    matrixContainer.appendChild(closeButton);
    matrixContainer.style.display = 'flex';

    // Ajouter les événements aux boutons Matrix
    matrixContainer.querySelectorAll('.matrix-variant-button').forEach(btn => {
        btn.onmouseover = function() {
            this.style.background = '#1565c0';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        };
        btn.onmouseout = function() {
            this.style.background = '#1976d2';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };
        btn.onclick = function() {
            const variant = JSON.parse(this.getAttribute('data-variant'));
            // Réinitialiser le style de tous les boutons Matrix
            matrixContainer.querySelectorAll('.matrix-variant-button').forEach(b => {
                b.style.background = '#1976d2';
                b.style.transform = 'translateY(0)';
                b.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            });
            // Marquer ce bouton comme sélectionné
            this.style.background = '#1565c0';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
            // Afficher les capabilities de cette variante dans la sidebar
            if (typeof window.displayApplicationCapabilities === 'function') {
                window.displayApplicationCapabilities(variant.name, variant);
            }
            // Colorier les pays sur la carte pour cette variante spécifique
            if (typeof window.resetCountryColors === 'function') window.resetCountryColors();
            variant.countries.forEach(countryName => {
                if (window.countryLayers && window.countryLayers[countryName]) {
                    window.countryLayers[countryName].setStyle({
                        fillColor: "#1976d2",
                        fillOpacity: 0.5,
                        color: "#1976d2",
                        weight: 2
                    });
                }
            });
        };
    });

    // Événement de fermeture pour le bouton discret
    closeButton.onmouseover = function() {
        this.style.background = 'rgba(0,0,0,0.2)';
        this.style.color = '#333';
    };
    closeButton.onmouseout = function() {
        this.style.background = 'rgba(0,0,0,0.1)';
        this.style.color = '#666';
    };
    closeButton.onclick = function() {
        if (typeof window.hideMatrixVariantsButtons === 'function') window.hideMatrixVariantsButtons();
        if (typeof window.resetCountryColors === 'function') window.resetCountryColors();
        // Réinitialiser la sélection dans la sidebar
        document.querySelectorAll('.sidebar-item').forEach(e => {
            e.style.fontWeight = 'normal';
        });
    };
}
// HiddenApps.js
// Utilitaires pour gérer les applications principales et leurs variantes cachées (hidden:true)

/**
 * Récupère toutes les variantes cachées d'une application principale (par nom de base)
 * @param {string} mainAppName - Nom de l'application principale (ex: 'Matrix')
 * @param {Array} allApps - Liste de toutes les applications (window.allApplications)
 * @returns {Array} - Variantes cachées (hidden:true, nom commence par mainAppName + ' ')
 */
function getHiddenVariants(mainAppName, allApps) {
    return allApps.filter(app => app.hidden === true && app.name.startsWith(mainAppName + ' '));
}

/**
 * Récupère les variantes cachées d'une appli principale présentes dans un pays donné
 * @param {string} mainAppName
 * @param {string} country
 * @param {Array} allApps
 * @returns {Array} - Variantes cachées présentes dans le pays
 */
function getHiddenVariantsForCountry(mainAppName, country, allApps) {
    return getHiddenVariants(mainAppName, allApps).filter(variant => Array.isArray(variant.countries) && variant.countries.includes(country));
}

/**
 * Fusionne les capabilities de toutes les variantes cachées présentes dans un pays
 * @param {Array} variantsInCountry - Résultat de getHiddenVariantsForCountry
 * @returns {Object} - { l2:[], l3:[], l4:[] } (uniques)
 */
function mergeCapabilities(variantsInCountry) {
    const merged = { l2: [], l3: [], l4: [] };
    variantsInCountry.forEach(variant => {
        if (Array.isArray(variant.l2)) merged.l2.push(...variant.l2);
        if (Array.isArray(variant.l3)) merged.l3.push(...variant.l3);
        if (Array.isArray(variant.l4)) merged.l4.push(...variant.l4);
    });
    // Uniques
    merged.l2 = [...new Set(merged.l2)];
    merged.l3 = [...new Set(merged.l3)];
    merged.l4 = [...new Set(merged.l4)];
    return merged;
}

/**
 * Fusionne la liste des pays couverts par toutes les variantes cachées présentes dans un pays
 * @param {Array} variantsInCountry
 * @returns {Array} - Liste unique de pays
 */
function mergeCountries(variantsInCountry) {
    let allCountries = [];
    variantsInCountry.forEach(variant => {
        if (Array.isArray(variant.countries)) allCountries.push(...variant.countries);
    });
    return [...new Set(allCountries)];
}

/**
 * Génère et affiche les boutons flottants pour les variantes cachées d'une appli principale
 * @param {string} mainAppName - Nom de l'appli principale (ex: 'Matrix')
 * @param {string|null} selectedCountry - Pays sélectionné (ou null)
 * @param {Array} allApps - window.allApplications
 * @param {string} containerId - id du container où injecter les boutons (ex: 'matrix-variants-container')
 * @param {function} [onClick] - callback à appeler au clic sur un bouton (reçoit la variante)
 */
function renderFloatingButtons(mainAppName, selectedCountry, allApps, containerId, onClick) {
    const matrixVariants = getHiddenVariants(mainAppName, allApps);
    if (!matrixVariants || matrixVariants.length === 0) return;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = `
            position: fixed;
            top: max(20px, 5vh);
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            justify-content: center;
            max-width: 90vw;`;
        document.body.appendChild(container);
    }
    let buttonsHTML = '';
    matrixVariants.forEach(variant => {
        const shortName = variant.name.replace(mainAppName + ' ', '');
        let isInCountry = false;
        if (selectedCountry && Array.isArray(variant.countries)) {
            isInCountry = variant.countries.includes(selectedCountry);
        }
        const buttonColor = isInCountry ? '#d32f2f' : '#1976d2';
        buttonsHTML += `
            <button class="matrix-variant-button" data-variant='${JSON.stringify(variant)}'
                style="background: ${buttonColor}; color: white; border: none; border-radius: 25px; padding: 12px 18px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s ease; text-align: center; white-space: nowrap; min-width: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style=\"font-size: 14px; font-weight: bold;\">${shortName}</div>
                <div style=\"font-size: 12px; margin-top: 2px; opacity: 0.9;\">${variant.category}</div>
            </button>
        `;
    });
    // Bouton de fermeture
    buttonsHTML += `<button id="close-${containerId}" style="background: rgba(0,0,0,0.1); color: #666; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; font-weight: normal; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-left: 10px;">×</button>`;
    container.innerHTML = buttonsHTML;
    container.style.display = 'flex';
    // Ajout des callbacks
    container.querySelectorAll('.matrix-variant-button').forEach(btn => {
        btn.onclick = function() {
            const variant = JSON.parse(this.getAttribute('data-variant'));
            if (typeof onClick === 'function') onClick(variant);
        };
        btn.onmouseover = function() {
            this.style.background = '#1565c0';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        };
        btn.onmouseout = function() {
            const variant = JSON.parse(this.getAttribute('data-variant'));
            let isInCountry = false;
            if (selectedCountry && Array.isArray(variant.countries)) {
                isInCountry = variant.countries.includes(selectedCountry);
            }
            this.style.background = isInCountry ? '#d32f2f' : '#1976d2';
            this.style.transform = '';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };
    });
    // Fermeture
    const closeBtn = document.getElementById(`close-${containerId}`);
    if (closeBtn) {
        closeBtn.onclick = function() {
            container.style.display = 'none';
        };
    }
}

/**
 * Définit le pays (ou la région) sélectionné pour la coloration des boutons hidden/Matrix
 * @param {string} countryName - Nom du pays sélectionné (ou région)
 */
function setSelectedCountry(countryName) {
    window.selectedCountryName = countryName;
}


/**
 * Gère l'affichage/masquage des boutons Matrix lors de la sélection d'une application
 * @param {string} appName - Nom de l'application sélectionnée
 */
function handleMatrixButtonsOnSelection(appName) {
    if (appName !== 'Matrix') {
        if (typeof window.hideMatrixVariantsButtons === 'function') {
            window.hideMatrixVariantsButtons();
        }
    } else {
        if (typeof window.showMatrixVariantsButtons === 'function') {
            window.showMatrixVariantsButtons();
        }
    }
}

// Export (pour usage ES6 ou global)
/**
 * Retourne la liste des applications à afficher pour un pays, avec Matrix combiné injecté si besoin
 * @param {string} country - Nom du pays
 * @param {Array} apps - Liste d'applications filtrées pour ce pays
 * @param {Array} allApps - window.allApplications
 * @returns {Array} - Liste d'applications (Matrix combiné inclus si variantes hidden)
 */
function getAppsWithMatrix(country, apps, allApps) {
    const matrixCombined = getCombinedMatrixForCountry(country, allApps);
    let result = [...apps];
    if (matrixCombined) {
        // Retirer toutes les variantes Matrix (hidden ou non)
        result = result.filter(app => !(app.name && app.name.startsWith('Matrix')));
        result.push(matrixCombined);
    }
    return result;
}

/**
 * Retourne la liste des applications à afficher pour une région, avec Matrix combiné injecté si besoin
 * @param {string} region - Nom de la région
 * @param {Array} regionCountries - Tableau d'objets { country, apps }
 * @param {Array} allApps - window.allApplications
 * @returns {Array} - Liste d'applications (Matrix combiné inclus si variantes hidden)
 */
function getAppsWithMatrixForRegion(region, regionCountries, allApps) {
    // Collecter toutes les apps de la région (sans doublons)
    const uniqueAppNames = new Set();
    const allRegionApps = [];
    regionCountries.forEach(countryData => {
        if (countryData.apps.length > 0) {
            countryData.apps.forEach(app => {
                if (!uniqueAppNames.has(app.name)) {
                    uniqueAppNames.add(app.name);
                    allRegionApps.push(app);
                }
            });
        }
    });
    // Injecter Matrix combiné si besoin
    const matrixCombined = getCombinedMatrixForRegion(region.toLowerCase(), allApps);
    let result = [...allRegionApps];
    if (matrixCombined) {
        result = result.filter(app => !(app.name && app.name.startsWith('Matrix')));
        result.push(matrixCombined);
    }
    return result;
}

/**
 * Retourne la liste des applications uniques pour un pays, Matrix inclus si combiné
 * @param {string} country - Nom du pays
 * @param {Array} appsWithMatrix - Liste d'applications (Matrix combiné inclus)
 * @returns {Array} - Noms des applications uniques (Matrix inclus si combiné)
 */
function getUniqueAppsForCountryWithMatrix(country, appsWithMatrix) {
    // On considère Matrix comme unique si présent dans appsWithMatrix
    const baseUniques = (typeof window.getUniqueAppsForCountry === 'function')
        ? window.getUniqueAppsForCountry(country).apps
        : [];
    const hasMatrix = appsWithMatrix.some(app => app.name === 'Matrix');
    return hasMatrix ? [...baseUniques, 'Matrix'] : baseUniques;
}

window.HiddenApps = {
    getHiddenVariants,
    getHiddenVariantsForCountry,
    mergeCapabilities,
    mergeCountries,
    renderFloatingButtons,
    setSelectedCountry,
    handleMatrixButtonsOnSelection,
    showMatrixVariantsButtons,
    getUniqueAppsForRegion,
    getCombinedMatrixForCountry,
    getCombinedMatrixForRegion,
    getAppsWithMatrix,
    getAppsWithMatrixForRegion,
    getUniqueAppsForCountryWithMatrix
};
