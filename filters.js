// Affiche les détails d'une application (popup capabilities)
function displayApplicationCapabilities(appName, appData) {
    const infoPanel = document.getElementById('info-panel');
    if (!infoPanel) {
        console.error('❌ Élément info-panel introuvable !');
        return;
    }
    document.getElementById('sidebar').className = 'l2-expanded';
    const appCapabilities = [];
    let allL3 = appData?.l3 || [];
    let allL2 = appData?.l2 || [];
    let appL4List = appData?.l4 || [];
    if ((allL3.length === 0 && allL2.length === 0) && window.appCapabilitiesUnified) {
        let unifiedData = null;
        if (window.appCapabilitiesUnified[appName]) {
            unifiedData = window.appCapabilitiesUnified[appName];
        } else if (appName.startsWith('Matrix ') && window.appCapabilitiesUnified["Matrix"]?.variants?.[appName]) {
            unifiedData = window.appCapabilitiesUnified["Matrix"].variants[appName];
        }
        if (unifiedData) {
            allL3 = unifiedData.l3 || [];
            allL2 = unifiedData.l2 || [];
            appL4List = unifiedData.l4 || [];
        }
    }
    currentDisplayedApp = { 
        name: appName, 
        data: {
            ...appData,
            l3: allL3,
            l2: allL2,
            l4: appL4List
        }
    };
    allL3.forEach(l3Id => {
        if (capabilities?.L3?.[l3Id]) {
            appCapabilities.push({ 
                id: l3Id, 
                l3_name: capabilities.L3[l3Id],
                l2_name: findL2ForL3(l3Id),
                l1_name: findL1ForL2(findL2ForL3(l3Id))
            });
        } else {
            console.warn(`⚠️ Capability L3 "${l3Id}" non trouvée dans les définitions`);
        }
    });
    if (allL3.length === 0 && allL2.length > 0) {
        allL2.forEach(l2Id => {
            if (capabilities?.L2?.[l2Id]) {
                appCapabilities.push({
                    id: l2Id,
                    l3_name: capabilities.L2[l2Id],
                    l2_name: capabilities.L2[l2Id],
                    l1_name: findL1ForL2(l2Id)
                });
            } else {
                console.warn(`⚠️ Capability L2 "${l2Id}" non trouvée dans les définitions`);
            }
        });
    }
    let appTitle = `📋 Capabilities of ${appName}`;
    if (appName === 'Matrix') {
        let selectedCountry = window.selectedCountryName;
        let selectedRegion = window.selectedRegionName;
        if (selectedCountry) {
            appTitle = `📋 Capabilities of Matrix ${selectedCountry}`;
        } else if (selectedRegion) {
            appTitle = `📋 Capabilities of Matrix ${selectedRegion}`;
        }
    }
    let capabilitiesHTML = `
        <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3 class="app-title">${appTitle}</h3>
                <button onclick="showAllApplications()" class="back-button">← Back</button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button id="open-comparator-btn" onclick="addCurrentAppAndOpenComparator()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                    display: inline-block;
                    transition: all 0.2s ease;
                " title="Assessment">⚖️ Assessment</button>
            </div>
        </div>
    `;
    if (appCapabilities.length > 0) {
        const l1Groups = {};
        appCapabilities.forEach(cap => {
            if (!l1Groups[cap.l1_name]) l1Groups[cap.l1_name] = {};
            if (!l1Groups[cap.l1_name][cap.l2_name]) l1Groups[cap.l1_name][cap.l2_name] = [];
            l1Groups[cap.l1_name][cap.l2_name].push(cap);
        });
        Object.keys(l1Groups).forEach(l1Id => {
            let l1Display = (typeof bcL4Definitions !== 'undefined' && bcL4Definitions.L1 && bcL4Definitions.L1[l1Id])
                ? bcL4Definitions.L1[l1Id]
                : (capabilities?.L1?.[l1Id] || l1Id);
            capabilitiesHTML += `<div><h3 class="l1-capability">${l1Display}</h3>`;
            Object.keys(l1Groups[l1Id]).forEach(l2Id => {
                let l2Display = (typeof bcL4Definitions !== 'undefined' && bcL4Definitions.L2 && bcL4Definitions.L2[l2Id])
                    ? bcL4Definitions.L2[l2Id]
                    : (capabilities?.L2?.[l2Id] || l2Id);
                capabilitiesHTML += `<h4 class="l2-title">${l2Display}</h4><ul class="l3-list">`;
                l1Groups[l1Id][l2Id].forEach(cap => {
                    if (cap.l3_name) {
                        const l4Blocks = createL4BlocksFromUnified(cap.id, appL4List, appName);
                        capabilitiesHTML += `
                            <li class="l3-item">
                                <span class="l3-name">${cap.l3_name}</span>
                                <span class="l4-blocks">${l4Blocks}</span>
                            </li>
                        `;
                    }
                });
                capabilitiesHTML += `</ul>`;
            });
            capabilitiesHTML += `</div>`;
        });
    } else {
        capabilitiesHTML += `<p>Aucune capability trouvée pour cette application.</p>`;
    }
    infoPanel.innerHTML = capabilitiesHTML;
    attachL4BlockEventListeners();
}

window.displayApplicationCapabilities = displayApplicationCapabilities;
// Fonction pour filtrer les applications selon les catégories sélectionnées
function filterBySelectedCategories() {
    const checkedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(checkbox => checkbox.value);
    // Collecter toutes les capabilities actives
    let allActiveCapabilities = [];
    // Collecter les capacités des tags L2/L1 actifs
    const activeL2Tags = Array.from(document.querySelectorAll('.capability-tag.active'));
    activeL2Tags.forEach(tag => {
        const capabilities = tag.getAttribute('data-capabilities');
        if (capabilities) {
            allActiveCapabilities.push(...capabilities.split(','));
        }
    });
    // Collecter les capacités des checkboxes L3 cochées
    const checkedL3Checkboxes = Array.from(document.querySelectorAll('.l3-checkbox:checked'));
    checkedL3Checkboxes.forEach(checkbox => {
        const capability = checkbox.getAttribute('data-capability');
        if (capability) {
            allActiveCapabilities.push(capability);
        }
    });
    // Supprimer les doublons
    allActiveCapabilities = [...new Set(allActiveCapabilities)];
    let filteredApps = [];
    if (checkedCategories.length === 0 && allActiveCapabilities.length === 0) {
        // Aucun filtre actif, afficher toutes les applications
        filteredApps = allApplications;
    } else {
        // Appliquer un filtre "OU" : applications qui correspondent aux catégories OU aux capabilities
        filteredApps = allApplications.filter(app => {
            if (app.hidden === true) return false;
            // Vérifier si l'app correspond aux catégories sélectionnées
            const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(app.category);
            // Vérifier si l'app correspond aux capabilities sélectionnées
            const matchesCapabilities = allActiveCapabilities.length === 0 || 
                (app.l2 && app.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                (app.l3 && app.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                (app.l4 && app.l4.some(l4 => allActiveCapabilities.includes(l4)));
            // Retourner true si SOIT catégorie SOIT capabilities correspondent (filtre OU)
            return (checkedCategories.length === 0 || matchesCategory) && 
                   (allActiveCapabilities.length === 0 || matchesCapabilities);
        });
    }
    console.log(`🔍 Filtre combiné: ${checkedCategories.length} catégories, ${allActiveCapabilities.length} capabilities → ${filteredApps.length} applications`);
    // Mettre à jour la liste des applications filtrées
    currentFilteredApps = filteredApps;
    // Afficher les résultats sur la carte
    if (typeof window.showCountryMarkers === 'function') {
        window.showCountryMarkers(filteredApps, allApplications);
    }
    // Afficher la liste dans la sidebar
    window.displayCategoryFilteredApplications(filteredApps, checkedCategories);
}

window.filterBySelectedCategories = filterBySelectedCategories;
// Fonction pour afficher les applications filtrées par catégories dans la sidebar
function displayCategoryFilteredApplications(apps, selectedCategories) {
    const infoPanel = document.getElementById('info-panel');
    if (apps.length === 0) {
        infoPanel.innerHTML = `
            <div style="padding: 10px; text-align: center; color: #666;">
                Aucune application trouvée pour les catégories sélectionnées
            </div>
        `;
        return;
    }
    // Grouper par catégorie
    const groupedSidebar = {};
    apps.forEach(item => {
        const cat = item.category || "Autre";
        if (!groupedSidebar[cat]) groupedSidebar[cat] = [];
        groupedSidebar[cat].push(item.name);
    });
    let html = '';
    Object.keys(groupedSidebar).forEach(cat => {
        const appNames = groupedSidebar[cat].filter(Boolean);
        if (appNames.length === 0) return; // Ne pas afficher de bloc vide
        html += `<div style="margin-bottom:10px;">
            <span style="font-weight:bold; font-size: 1.3em;">${cat}</span><br>
            ${appNames.map(name =>
                `<span class="sidebar-item" data-name="${name}" style="margin-left:10px; cursor:pointer; text-decoration:underline; font-size: 1.2em;">${name}</span>`
            ).join('<br>')}
        </div>`;
    });
    infoPanel.innerHTML = html;
    // Ajouter les événements de clic
    if (typeof window.addAppClickEvents === 'function') {
        window.addAppClickEvents(infoPanel, allApplications);
    }
}

window.displayCategoryFilteredApplications = displayCategoryFilteredApplications;
// filters.js
// Extraction progressive : export de la fonction principale de filtrage

function filterAndShowMarkersByCapabilities() {
    // Vérifier s'il y a des catégories sélectionnées
    const checkedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    if (checkedCategories.length > 0) {
        // Si des catégories sont sélectionnées, utiliser le filtre combiné
        if (typeof window.filterBySelectedCategories === 'function') {
            window.filterBySelectedCategories();
        }
        return;
    }
    
    // Sinon, filtrage normal par capabilities uniquement
    let activeL2 = new Set();
    let activeL3 = new Set();
    let activeL4 = new Set();

    document.querySelectorAll('.l2-tag.active').forEach(elem => {
        const capabilities = elem.getAttribute('data-capabilities');
        if (capabilities) {
            capabilities.split(',').forEach(id => {
                if (id.trim()) activeL2.add(id.trim());
            });
        }
    });
    document.querySelectorAll('.l3-checkbox:checked').forEach(elem => {
        const l3Id = elem.getAttribute('data-capability');
        if (l3Id) activeL3.add(l3Id);
    });
    document.querySelectorAll('.l4-checkbox:checked').forEach(elem => {
        const l4Id = elem.getAttribute('data-capability');
        if (l4Id) activeL4.add(l4Id);
    });

    let filteredApps = [];
    if (activeL2.size === 0 && activeL3.size === 0 && activeL4.size === 0) {
        // Toujours exclure les hidden même sans filtre actif
        filteredApps = window.allApplications.filter(app => app.hidden !== true);
    } else {
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            const matchL2 = app.l2 && app.l2.some(l2 => activeL2.has(l2));
            const matchL3 = app.l3 && app.l3.some(l3 => activeL3.has(l3));
            const matchL4 = app.l4 && app.l4.some(l4 => activeL4.has(l4));
            return matchL2 || matchL3 || matchL4;
        });
    }
    window.currentFilteredApps = filteredApps;
    if (typeof window.showCountryMarkers === 'function') {
        window.showCountryMarkers(filteredApps, window.allApplications);
    }
    const groupedSidebar = {};
    filteredApps.forEach(item => {
        const cat = item.category || "Autre";
        if (!groupedSidebar[cat]) groupedSidebar[cat] = [];
        groupedSidebar[cat].push(item.name);
    });
    let html = '';
    Object.keys(groupedSidebar).forEach(cat => {
        html += `<div style="margin-bottom:10px;">
            <span style="font-weight:bold; font-size: 1.3em;">${cat}</span><br>
            ${groupedSidebar[cat].map(name =>
                `<span class="sidebar-item" data-name="${name}" style="margin-left:10px; cursor:pointer; text-decoration:underline; font-size: 1.2em;">${name}</span>`
            ).join('<br>')}
        </div>`;
    });
    let infoPanel = document.getElementById('info-panel');
    infoPanel.innerHTML = html;
    infoPanel.querySelectorAll('.sidebar-item').forEach(elem => {
        elem.onclick = function() {
            const itemName = this.getAttribute('data-name');
            const isCurrentlySelected = this.style.fontWeight === 'bold';
            infoPanel.querySelectorAll('.sidebar-item').forEach(e => {
                e.style.fontWeight = 'normal';
            });
            if (!isCurrentlySelected) {
                this.style.fontWeight = 'bold';
                if (typeof window.showSelectedAppButton === 'function') {
                    window.showSelectedAppButton(itemName);
                }
                const item = filteredApps.find(i => i.name === itemName);
                if (!item) return;
                if (typeof window.displayApplicationCapabilities === 'function') {
                    window.displayApplicationCapabilities(itemName, item);
                }
                if (item.countries) {
                    if (typeof window.resetCountryColors === 'function') {
                        window.resetCountryColors();
                    }
                    item.countries.forEach(countryName => {
                        if (window.countryLayers && window.countryLayers[countryName]) {
                            window.countryLayers[countryName].setStyle({
                                fillColor: "#1976d2",
                                fillOpacity: 0.5,
                                color: "#1976d2",
                                weight: 2
                            });
                        }
                    });
                }
            } else {
                if (typeof window.hideSelectedAppButton === 'function') {
                    window.hideSelectedAppButton();
                }
                if (typeof window.resetCountryColors === 'function') {
                    window.resetCountryColors();
                }
            }
        };
    });
}
window.filterAndShowMarkersByCapabilities = filterAndShowMarkersByCapabilities;
