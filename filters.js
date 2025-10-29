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
        } else {
            // Recherche générique d'un parent à variantes
            for (const parent in window.appCapabilitiesUnified) {
                if (window.appCapabilitiesUnified[parent]?.variants?.[appName]) {
                    unifiedData = window.appCapabilitiesUnified[parent].variants[appName];
                    break;
                }
            }
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
    // Code spécifique à Matrix pour afficher le pays ou la région sélectionnée
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
                <button onclick="showAllApplicationsAndRecolor()" class="back-button">← Back</button>
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
// Ajoute une fonction globale pour revenir à la liste et recolorer
function showAllApplicationsAndRecolor() {
    if (typeof showAllApplications === 'function') showAllApplications();
    if (typeof filterAndShowApplications === 'function') filterAndShowApplications();
    // Masquer le container Matrix (robuste)
    var matrixContainer = document.getElementById('matrix-variants-container');
    if (matrixContainer) matrixContainer.style.display = 'none';
    if (window.hideMatrixFloatingButtons) window.hideMatrixFloatingButtons();
    // Masquer aussi le bouton flottant de sélection d'application
    if (typeof hideSelectedAppButton === 'function') hideSelectedAppButton();
}
window.showAllApplicationsAndRecolor = showAllApplicationsAndRecolor;
// Fonction pour filtrer les applications selon les catégories sélectionnées
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
    const categoryOrder = [
        "TMS", "Asset & Fleet Management", "Track & Trace", "Matrix", "Integration & Middleware", "Financial & Settlement Systems",
        "Reporting & BI", "Route & Planning Optimization", "Customs",
        "Freight Marketplace", "Customer Portal", "Documents & Collaboration",
        "Digital Forwarding", "YMS", "Warehouse Management Systems (WMS)", "Customer Relationship Management (CRM)", "Order Management System (OMS)", "Last Mile Distribution",
        "Claims & Damages", "Carriers Portal", "Control & Quality",
        "Mobile App", "Legal Compliance"
    ];
    categoryOrder.forEach(cat => {
        if (!groupedSidebar[cat]) return;
        const appNames = groupedSidebar[cat].filter(Boolean);
        if (appNames.length === 0) return;
        html += `<div style="margin-bottom:10px;">
            <span style="font-weight:bold; font-size: 1.3em;">${cat}</span><br>
            ${appNames.map(name =>
                `<span class="sidebar-item" data-name="${name}" style="margin-left:10px; cursor:pointer; text-decoration:underline; font-size: 1.2em;">${name}</span>`
            ).join('<br>')}
        </div>`;
    });
    // Afficher les catégories non listées dans categoryOrder à la fin
    Object.keys(groupedSidebar).forEach(cat => {
        if (categoryOrder.includes(cat)) return;
        const appNames = groupedSidebar[cat].filter(Boolean);
        if (appNames.length === 0) return;
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

// Nouvelle fonction commune pour filtrer et afficher les applications selon catégories et capabilities
function filterAndShowApplications() {
    // 1. Récupérer les catégories sélectionnées
    const checkedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(checkbox => checkbox.value);
    // 2. Récupérer les capabilities sélectionnées (L2/L3/L4)
    let allActiveCapabilities = [];
    // L2/L1 tags actifs
    const activeL2Tags = Array.from(document.querySelectorAll('.capability-tag.active, .l2-tag.active'));
    activeL2Tags.forEach(tag => {
        const capabilities = tag.getAttribute('data-capabilities');
        if (capabilities) {
            allActiveCapabilities.push(...capabilities.split(','));
        }
    });
    // L3 checkboxes
    const checkedL3Checkboxes = Array.from(document.querySelectorAll('.l3-checkbox:checked'));
    checkedL3Checkboxes.forEach(checkbox => {
        const capability = checkbox.getAttribute('data-capability');
        if (capability) {
            allActiveCapabilities.push(capability);
        }
    });
    // L4 checkboxes
    const checkedL4Checkboxes = Array.from(document.querySelectorAll('.l4-checkbox:checked'));
    checkedL4Checkboxes.forEach(checkbox => {
        const capability = checkbox.getAttribute('data-capability');
        if (capability) {
            allActiveCapabilities.push(capability);
        }
    });
    // Supprimer les doublons
    allActiveCapabilities = [...new Set(allActiveCapabilities)];

    // 3. Appliquer la logique de filtrage (par défaut OU, à adapter si besoin)
    let filteredApps = [];
    if (checkedCategories.length === 0 && allActiveCapabilities.length === 0) {
        filteredApps = window.allApplications.filter(app => app.hidden !== true);
    } else if (checkedCategories.length > 0 && allActiveCapabilities.length > 0) {
        // Filtre ET : apps qui correspondent à la catégorie ET à la capability
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            const matchesCategory = checkedCategories.includes(app.category);
            const matchesCapabilities =
                (app.l2 && app.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                (app.l3 && app.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                (app.l4 && app.l4.some(l4 => allActiveCapabilities.includes(l4)));
            return matchesCategory && matchesCapabilities;
        });
    } else if (checkedCategories.length > 0) {
        // Catégorie seule
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            return checkedCategories.includes(app.category);
        });
    } else {
        // Capability seule
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            return (
                (app.l2 && app.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                (app.l3 && app.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                (app.l4 && app.l4.some(l4 => allActiveCapabilities.includes(l4)))
            );
        });
    }
    window.currentFilteredApps = filteredApps;

    // 4. Reset les couleurs
    if (typeof window.resetCountryColors === 'function') {
        window.resetCountryColors();
    }

    // 5. Coloriage capability si au moins une capability cochée
    if (allActiveCapabilities.length > 0) {
        // --- Coloration parent/variante généralisée (copié de filterAndShowMarkersByCapabilities) ---
        const selectedCapabilities = allActiveCapabilities;
        const parentNames = window.allApplications
            .filter(app => !app.parent)
            .map(app => app.name)
            .filter(parentName => window.allApplications.some(a => a.parent === parentName));
        parentNames.forEach(parentName => {
            const parentApp = window.allApplications.find(app => app.name === parentName);
            const parentCountries = parentApp && parentApp.countries ? parentApp.countries.map(c => c.trim()) : [];
            const variants = window.allApplications.filter(app => app.parent === parentName && app.countries);
            // Pays où une variante couvre la capability (bleu)
            const countriesWithVariant = new Set();
            variants.forEach(variant => {
                const covers =
                    (variant.l2 && variant.l2.some(l2 => selectedCapabilities.includes(l2))) ||
                    (variant.l3 && variant.l3.some(l3 => selectedCapabilities.includes(l3))) ||
                    (variant.l4 && variant.l4.some(l4 => selectedCapabilities.includes(l4)));
                if (covers) {
                    variant.countries.forEach(c => countriesWithVariant.add(c.trim()));
                }
            });
            // Pays où le parent global couvre la capability (mais aucune variante ne la couvre) => orange
            const parentGlobalCovers =
                (parentApp && (
                    (parentApp.l2 && parentApp.l2.some(l2 => selectedCapabilities.includes(l2))) ||
                    (parentApp.l3 && parentApp.l3.some(l3 => selectedCapabilities.includes(l3))) ||
                    (parentApp.l4 && parentApp.l4.some(l4 => selectedCapabilities.includes(l4)))
                ));
            let countriesOrange = [];
            if (parentGlobalCovers) {
                countriesOrange = parentCountries.filter(c => !countriesWithVariant.has(c));
            }
            // Exclure les pays où une autre app (hors ce parent/variante) couvre la capability
            const selectedApps = window.allApplications.filter(app => {
                if (app.name === parentName || app.parent === parentName) return false;
                return (
                    (app.l2 && app.l2.some(l2 => selectedCapabilities.includes(l2))) ||
                    (app.l3 && app.l3.some(l3 => selectedCapabilities.includes(l3))) ||
                    (app.l4 && app.l4.some(l4 => selectedCapabilities.includes(l4)))
                );
            });
            countriesOrange = countriesOrange.filter(countryName => {
                return !selectedApps.some(app => app.countries && app.countries.map(c => c.trim()).includes(countryName));
            });
            // Pays couverts par d'autres apps (bleu)
            const paysAvecCapability = new Set();
            countriesWithVariant.forEach(countryName => paysAvecCapability.add(countryName));
            selectedApps.forEach(app => {
                if (app.countries) app.countries.map(c => c.trim()).forEach(c => paysAvecCapability.add(c));
            });
            // Bleu : pays où une variante couvre la capability
            countriesWithVariant.forEach(countryName => {
                if (window.countryLayers && window.countryLayers[countryName]) {
                    window.countryLayers[countryName].setStyle({
                        fillColor: "#1976d2",
                        fillOpacity: 0.5,
                        color: "#1976d2",
                        weight: 2
                    });
                }
            });
            // Bleu : pays où une autre application couvre la capability
            selectedApps.forEach(app => {
                if (app.countries) {
                    app.countries.map(c => c.trim()).forEach(countryName => {
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
            });
            // Orange : pays où le parent global couvre mais aucune variante ne couvre
            countriesOrange.forEach(countryName => {
                if (window.countryLayers && window.countryLayers[countryName]) {
                    window.countryLayers[countryName].setStyle({
                        fillColor: "orange",
                        fillOpacity: 0.5,
                        color: "orange",
                        weight: 2
                    });
                }
            });
        });
    }

    // 6. Afficher les markers sur la carte
    if (typeof window.showCountryMarkers === 'function') {
        window.showCountryMarkers(filteredApps, window.allApplications);
    }
    // 7. Afficher la liste dans la sidebar
    if (typeof window.displayCategoryFilteredApplications === 'function') {
        window.displayCategoryFilteredApplications(filteredApps, checkedCategories);
    }
}
window.filterAndShowApplications = filterAndShowApplications;
