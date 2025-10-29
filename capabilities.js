// Fonctions utilitaires pour trouver les parents L1/L2 d'un L3

// Trouver le parent L2 d'un L3
function findL2ForL3(l3Id) {
    if (window.bcMapping && window.bcMapping._hierarchy) {
        for (const l1 of Object.values(window.bcMapping._hierarchy)) {
            for (const [l2Name, l2Content] of Object.entries(l1)) {
                if (l2Content && l2Content[l3Id]) {
                    return l2Name;
                }
            }
        }
    }
    // Fallback: préfixe
    return l3Id.replace(/\d+$/, '');
}

// Trouver le parent L1 d'un L2
function findL1ForL2(l2Id) {
    return l2Id.replace(/\d+$/, '');
}

// Utilitaire pour aplatir le mapping hiérarchique L3→L4 à partir de bc-mapping.json
function flattenL3toL4Mapping(bcMapping) {
    const l3ToL4 = {};
    if (!bcMapping || !bcMapping._hierarchy) return l3ToL4;
    for (const l1 of Object.values(bcMapping._hierarchy)) {
        for (const l2 of Object.values(l1)) {
            for (const [l3, l4List] of Object.entries(l2)) {
                l3ToL4[l3] = l4List;
            }
        }
    }
    return l3ToL4;
}

// Chargement du mapping et création du mapping plat L3->L4
let bcMapping = null;
let l3ToL4Mapping = {};
let l3Descriptions = {};

async function loadBCMappingAndFlatten() {
    try {
        const response = await fetch('bc-mapping.json');
        if (response.ok) {
            bcMapping = await response.json();
            l3ToL4Mapping = flattenL3toL4Mapping(bcMapping);
        } else {
            console.warn('Impossible de charger bc-mapping.json');
        }
    } catch (e) {
        console.warn('Erreur lors du chargement de bc-mapping.json:', e);
    }
}

async function loadL3Descriptions() {
    try {
        const response = await fetch('l3-descriptions.json');
        if (response.ok) {
            const data = await response.json();
            l3Descriptions = data.L3_DESCRIPTIONS || {};
        } else {
            console.warn('Impossible de charger l3-descriptions.json');
        }
    } catch (e) {
        console.warn('Erreur lors du chargement de l3-descriptions.json:', e);
    }
}

// Appeler ce chargement au démarrage du script ou avant l'affichage des L4
loadBCMappingAndFlatten();
loadL3Descriptions();

// Fonction d'affichage des blocs L4 (verts/gris) pour un L3 donné et la liste des L4 implémentés de l'appli
function createL4BlocksFromUnified(l3Id, appL4List, appName) {
    if (!l3ToL4Mapping[l3Id]) return '';
    return l3ToL4Mapping[l3Id].map(l4Id => {
        const isImplemented = appL4List.includes(l4Id);
        const color = isImplemented ? '#4CAF50' : '#E0E0E0';
        return `<span class="l4-block clickable-l4-block" 
                      style="display:inline-block;width:16px;height:16px;margin:2px;border-radius:3px;background-color:${color};border:1px solid #bbb;cursor:pointer;" 
                      data-l3-id="${l3Id}" 
                      data-app-name="${appName}" 
                      onclick="showL4Details('${l3Id}', '${appName}')">
                </span>`;
    }).join('');
}
// Gestionnaire des capabilities pour la carte interactive

// Variables globales pour les données
let allApplications = [];
let globalFilterFunction = null;
let currentFilteredApps = [];
let bcL4Mapping = {}; // Nouvelle variable pour stocker les mappings BC L4
let bcL4Definitions = {}; // Variable pour stocker les définitions des BC L4

// Variables pour le comparateur
let comparatorApps = [];
let currentDisplayedApp = null; // Pour stocker l'app actuellement affichée

// Fonctions de gestion du comparateur
function addCurrentAppToComparator() {
    if (currentDisplayedApp) {
        toggleAppInComparator(currentDisplayedApp.name, currentDisplayedApp.data);
    }
}


// Nouvelle fonction : ajoute l'app courante au comparateur et ouvre la page comparateur
function addCurrentAppAndOpenComparator() {
    if (currentDisplayedApp) {
        // Réinitialiser le comparateur pour ne garder que l'app courante
        comparatorApps = [{
            name: currentDisplayedApp.name,
            data: currentDisplayedApp.data
        }];
        openComparatorPage();
    }
}

function addToComparator(appName, appData) {
    // Cette fonction est maintenant un alias pour toggleAppInComparator
    toggleAppInComparator(appName, appData);
}

function openComparatorPage() {
    
    // Ouvrir le comparateur dans un nouvel onglet
    window.open('comparateur.html', '_blank');
}



// Fonction pour charger les données BC L4
async function loadBCL4Data() {
    try {
        // Charger le mapping L3 -> L4
    const mappingResponse = await fetch('bc-mapping.json');
        if (mappingResponse.ok) {
            bcL4Mapping = await mappingResponse.json();
        } else {
            console.warn('Impossible de charger bc-mapping.json');
        }
        
        // Charger les définitions des L4
    const definitionsResponse = await fetch('bc-definitions.json');
        if (definitionsResponse.ok) {
            bcL4Definitions = await definitionsResponse.json();
        } else {
            console.warn('Impossible de charger bc-definitions.json');
        }
    } catch (error) {
        console.warn('Erreur lors du chargement des données BC L4:', error);
    }
}

// Fonction helper pour dériver automatiquement les L3 à partir des BC L4

// Fonction pour obtenir la définition d'un L4 ou son nom par défaut
function getL4DisplayName(l4Id) {
    return bcL4Definitions[l4Id] || l4Id;
}

// Fonction helper pour créer les blocs L4

// Fonction pour afficher les détails des L4 implémentés

// Fonction pour afficher une fenêtre centrale simplifiée
function showCentralPopup(content) {
    // Supprimer toute popup existante
    const existingPopup = document.getElementById('l4-popup');
    const existingOverlay = document.getElementById('l4-popup-overlay');
    if (existingPopup) existingPopup.remove();
    if (existingOverlay) existingOverlay.remove();
    
    // Créer la popup avec classes CSS
    const popup = document.createElement('div');
    popup.id = 'l4-popup';
    popup.className = 'l4-details-popup';
    
    const popupInner = document.createElement('div');
    popupInner.className = 'l4-popup-inner';
    
    // Ajouter le contenu avec bouton de fermeture stylé
    popupInner.innerHTML = content + `
        <div class="l4-popup-close-container">
            <button onclick="document.getElementById('l4-popup').remove(); document.getElementById('l4-popup-overlay').remove();" 
                    class="l4-popup-close-btn">
                Fermer
            </button>
        </div>
    `;
    
    popup.appendChild(popupInner);
    
    // Ajouter un overlay semi-transparent avec classe CSS
    const overlay = document.createElement('div');
    overlay.id = 'l4-popup-overlay';
    overlay.className = 'l4-details-popup';
    overlay.onclick = () => {
        popup.remove();
        overlay.remove();
    };
    
    // Ajouter à la page
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // Permettre la fermeture avec Escape
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            overlay.remove();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
}

// Fonction pour attacher les event listeners aux blocs L4
function attachL4BlockEventListeners() {
    // (suppression de la gestion implementedL4 et showL4Details)
}

// Fonction pour afficher les capabilities d'une application

// Fonction globale pour retourner à la liste complète des applications
window.showAllApplications = function() {
    // Remettre la sidebar à son état normal
    document.getElementById('sidebar').className = '';
    
    // Réafficher la liste complète
    if (typeof globalFilterFunction === 'function') {
        globalFilterFunction();
    }
};

// Filtre et affiche les markers selon les capabilities sélectionnées (tags actifs)



// génère l'interface à partir de la hiérarchie de bc-mapping.json
function generateCapabilitiesInterface(bcMapping, capabilitiesForm) {
    // ...
    // ...
    
    if (!bcMapping || !bcMapping._hierarchy) {
        console.error('❌ bcMapping ou bcMapping._hierarchy manquant !');
    // ...
        return;
    }
    
    const hierarchy = bcMapping._hierarchy;
    // Pour chaque L1
    Object.entries(hierarchy).forEach(([l1Id, l2s]) => {
        // Utiliser bcL4Definitions.L1 pour le nom L1
        const l1Name = (bcL4Definitions && bcL4Definitions.L1 && bcL4Definitions.L1[l1Id]) ? bcL4Definitions.L1[l1Id] : (bcMapping[l1Id]?.l1_name || l1Id);
        // Crée la section de catégorie
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.setAttribute('data-category', l1Name);

        // Container pour titre L1 + slider
        const titleContainer = document.createElement('div');
        titleContainer.className = 'l1-title-with-slider';

        // Titre de la catégorie (cliquable pour élargir)
        const categoryTitle = document.createElement('span');
        categoryTitle.className = 'category-title clickable';
        categoryTitle.textContent = l1Name;
        categoryTitle.setAttribute('data-category', l1Name);
        categoryTitle.style.cursor = 'pointer';
        categoryTitle.style.fontSize = '1.5em';
        categoryTitle.style.fontWeight = 'bold';
        categoryTitle.style.color = 'white';
        categoryTitle.style.background = '#1a237e';
        categoryTitle.style.padding = '8px 12px';
        categoryTitle.style.borderRadius = '4px';
        categoryTitle.style.display = 'block';
        categoryTitle.style.textAlign = 'center';
        categoryTitle.style.marginBottom = '5px';

        // Slider pour L1
        const sliderWrapper = document.createElement('label');
        sliderWrapper.className = 'switch';

        const sliderInput = document.createElement('input');
        sliderInput.type = 'checkbox';
        sliderInput.className = 'slider-checkbox-l1';
        sliderInput.setAttribute('data-category', l1Name);

        const sliderSpan = document.createElement('span');
        sliderSpan.className = 'slider round';

        sliderWrapper.appendChild(sliderInput);
        sliderWrapper.appendChild(sliderSpan);

        titleContainer.appendChild(categoryTitle);
        titleContainer.appendChild(sliderWrapper);
        categorySection.appendChild(titleContainer);

        // Container pour les capabilities (masqué par défaut)
        const capabilitiesContainer = document.createElement('div');
        capabilitiesContainer.className = 'capabilities-container';

        // Container pour les tags de capabilities
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'capability-tags-container';

        // Pour chaque L2 de ce L1
        Object.entries(l2s).forEach(([l2Id, l3s]) => {
            // Utiliser bcL4Definitions.L2 pour le nom L2
            const l2Name = (bcL4Definitions && bcL4Definitions.L2 && bcL4Definitions.L2[l2Id]) ? bcL4Definitions.L2[l2Id] : (bcMapping[l2Id]?.l2_name || l2Id);
            if (!l2Name || l2Name.trim() === '') return;

            const l2Container = document.createElement('div');
            l2Container.className = 'l2-tag-container';

            // Container pour tag L2 + slider
            const tagContainer = document.createElement('div');
            tagContainer.className = 'l2-tag-with-all';

            // Tag L2 normal
            const l2Tag = document.createElement('div');
            l2Tag.className = 'capability-tag l2-tag';
            l2Tag.textContent = l2Name;

            // Récupérer tous les L3 ids de ce L2
            const allL3Ids = Object.keys(l3s);
            // IMPORTANT: Ajouter aussi l'ID du L2 lui-même pour les applications qui n'ont que des L2
            const allCapabilities = [l2Id, ...allL3Ids];
            l2Tag.setAttribute('data-capabilities', allCapabilities.join(','));
            l2Tag.setAttribute('data-l2-name', l2Name);

            // Slider à droite
            const sliderWrapper = document.createElement('label');
            sliderWrapper.className = 'switch';

            const sliderInput = document.createElement('input');
            sliderInput.type = 'checkbox';
            sliderInput.className = 'slider-checkbox';
            sliderInput.setAttribute('data-l2-name', l2Name);

            const sliderSpan = document.createElement('span');
            sliderSpan.className = 'slider round';

            sliderWrapper.appendChild(sliderInput);
            sliderWrapper.appendChild(sliderSpan);

            tagContainer.appendChild(l2Tag);
            tagContainer.appendChild(sliderWrapper);
            l2Container.appendChild(tagContainer);

            // Container pour les L3 (masqué par défaut)
            if (allL3Ids.length > 0) {
                const l3Container = document.createElement('div');
                l3Container.className = 'l3-container';
                l3Container.setAttribute('data-l2-name', l2Name);

                allL3Ids.forEach(l3Id => {
                    // Créer le container pour checkbox + label
                    const l3CheckboxContainer = document.createElement('div');
                    l3CheckboxContainer.className = 'l3-checkbox-container';

                    // Créer la checkbox
                    const l3Checkbox = document.createElement('input');
                    l3Checkbox.type = 'checkbox';
                    l3Checkbox.className = 'l3-checkbox';
                    l3Checkbox.id = `l3-${l3Id}`;
                    l3Checkbox.setAttribute('data-capability', l3Id);
                    l3Checkbox.setAttribute('data-category', l1Name);
                    l3Checkbox.setAttribute('data-l2-name', l2Name);

                    // Créer le label
                    const l3Label = document.createElement('label');
                    l3Label.className = 'l3-label';
                    l3Label.htmlFor = `l3-${l3Id}`;
                    // Utiliser bcL4Definitions.L3 pour le nom L3
                    l3Label.textContent = (bcL4Definitions && bcL4Definitions.L3 && bcL4Definitions.L3[l3Id]) ? bcL4Definitions.L3[l3Id] : (bcMapping[l3Id]?.l3_name || l3Id);

                    // Assembler
                    l3CheckboxContainer.appendChild(l3Checkbox);
                    l3CheckboxContainer.appendChild(l3Label);
                    l3Container.appendChild(l3CheckboxContainer);
                });

                l2Container.appendChild(l3Container);
            }

            tagsContainer.appendChild(l2Container);
        });

        capabilitiesContainer.appendChild(tagsContainer);
        categorySection.appendChild(capabilitiesContainer);
        capabilitiesForm.appendChild(categorySection);
    });
}

// Gestion du nouveau système : container cliquable + slider 2 positions
function setupHybridControls() {
    // Gestion du clic direct sur les titres de catégorie (L1)
    document.querySelectorAll('.category-title.clickable').forEach(title => {
        title.addEventListener('click', function() {
            const categoryName = this.getAttribute('data-category');
            const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
            const capabilitiesContainer = categorySection.querySelector('.capabilities-container');
            
            // Basculer la visibilité des sous-capabilities
            const isExpanded = capabilitiesContainer.classList.contains('expanded');
            
            if (isExpanded) {
                // Masquer les sous-capabilities et réduire la barre latérale
                categorySection.classList.remove('active');
                capabilitiesContainer.classList.remove('expanded');
                
                // Désactiver tous les tags de cette catégorie
                const categoryTags = document.querySelectorAll(`.capability-tag[data-category="${categoryName}"], .l3-tag[data-category="${categoryName}"]`);
                categoryTags.forEach(tag => tag.classList.remove('active'));
                
                // Masquer tous les L3 de cette catégorie
                const l3Containers = categorySection.querySelectorAll('.l3-container');
                l3Containers.forEach(container => {
                    container.classList.remove('expanded');
                });
                
                // Vérifier s'il reste des catégories ouvertes
                const hasExpandedCategories = document.querySelector('.capabilities-container.expanded');
                if (!hasExpandedCategories) {
                    // Revenir à la largeur normale (18vw)
                    document.getElementById('sidebar').classList.remove('l1-expanded', 'l2-expanded');
                }
            } else {
                // Afficher les sous-capabilities et élargir au niveau L1
                categorySection.classList.add('active');
                capabilitiesContainer.classList.add('expanded');
                document.getElementById('sidebar').classList.add('l1-expanded');
                document.getElementById('sidebar').classList.remove('l2-expanded');
            }
            
            // ...removed duplicate call...
                window.filterAndShowApplications();
        });
    });
    
    // Gestion des tags L2 - uniquement pour ouvrir/fermer les L3 (sans activation)
    document.querySelectorAll('.l2-tag').forEach(l2Tag => {
        l2Tag.addEventListener('click', function() {
            const l2Name = this.getAttribute('data-l2-name');
            const l3Container = document.querySelector(`.l3-container[data-l2-name="${l2Name}"]`);
            const hasL3 = l3Container && l3Container.children.length > 0;
            
            if (l3Container && hasL3) {
                const isExpanded = l3Container.classList.contains('expanded');
                
                if (isExpanded) {
                    // Masquer les L3 et revenir au niveau L1
                    l3Container.classList.remove('expanded');
                    this.classList.remove('expanded');
                    document.getElementById('sidebar').classList.remove('l2-expanded');
                } else {
                    // Afficher les L3 et élargir la sidebar
                    l3Container.classList.add('expanded');
                    this.classList.add('expanded');
                    document.getElementById('sidebar').classList.add('l1-expanded', 'l2-expanded');
                }
            }
        });
    });
    
    // Gestion des checkboxes L3 - activation automatique des L2 correspondants
    document.querySelectorAll('.l3-checkbox').forEach(l3Checkbox => {
        l3Checkbox.addEventListener('change', function() {
            const l2Name = this.getAttribute('data-l2-name');
            const l2Tag = document.querySelector(`.l2-tag[data-l2-name="${l2Name}"]`);
            const allL3Checkboxes = document.querySelectorAll(`.l3-checkbox[data-l2-name="${l2Name}"]`);
            const checkedL3Checkboxes = document.querySelectorAll(`.l3-checkbox[data-l2-name="${l2Name}"]:checked`);
            
            // AUTOMATIQUEMENT activer le L2 parent dès qu'une L3 est cochée
            if (checkedL3Checkboxes.length > 0) {
                // Au moins une L3 cochée → Activer le L2
                l2Tag.classList.add('active');
            } else {
                // Aucune L3 cochée → Désactiver le L2
                l2Tag.classList.remove('active');
            }
            
            // Déclencher le filtrage pour afficher sur la carte
            // ...removed duplicate call...
                filterAndShowApplications();
        });
    });
    
    // Gestion des tags individuels (compatibilité)
    document.querySelectorAll('.capability-tag:not(.l2-tag)').forEach(tag => {
        tag.addEventListener('click', function() {
            const categoryName = this.getAttribute('data-category');
            const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
            const capabilitiesContainer = categorySection.querySelector('.capabilities-container');
            
            // S'assurer que la catégorie est visible et élargir la barre
            if (!capabilitiesContainer.classList.contains('expanded')) {
                categorySection.classList.add('active');
                capabilitiesContainer.classList.add('expanded');
                document.getElementById('sidebar').classList.add('l1-expanded');
            }
            
            // Basculer l'état du tag
            this.classList.toggle('active');
            
            // Déclencher le filtrage
            // ...removed duplicate call...
                filterAndShowApplications();
        });
    });
    
    // Gestion des sliders L1 (activent toutes les L3 de la catégorie)
    document.querySelectorAll('.slider-checkbox-l1').forEach(slider => {
        slider.addEventListener('change', function() {
            const categoryName = this.getAttribute('data-category');
            const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
            const allL3Checkboxes = categorySection.querySelectorAll('.l3-checkbox');
            const allL2Tags = categorySection.querySelectorAll('.l2-tag');
            const isChecked = this.checked;
            
            // Cocher/décocher toutes les cases L3 de la catégorie
            allL3Checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            // ACTIVER/DÉSACTIVER tous les tags L2 de la catégorie
            allL2Tags.forEach(l2Tag => {
                if (isChecked) {
                    l2Tag.classList.add('active');
                } else {
                    l2Tag.classList.remove('active');
                }
            });
            
            // Synchroniser les sliders L2 avec l'état du slider L1
            const allL2Sliders = categorySection.querySelectorAll('.slider-checkbox');
            allL2Sliders.forEach(l2Slider => {
                l2Slider.checked = isChecked;
            });
            
            // Déclencher le filtrage
            // ...removed duplicate call...
                filterAndShowApplications();
        });
    });
    
    // Gestion unifiée de tous les sliders L2 (au-dessus et à droite des tags L2)
    document.querySelectorAll('.slider-checkbox').forEach(slider => {
        slider.addEventListener('change', function() {
            const l2Name = this.getAttribute('data-l2-name');
            const checkboxes = document.querySelectorAll(`.l3-checkbox[data-l2-name="${l2Name}"]`);
            const l2Tag = document.querySelector(`.l2-tag[data-l2-name="${l2Name}"]`);
            const isChecked = this.checked;
            
            // Cocher/décocher toutes les cases L3 correspondantes
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            // ACTIVER/DÉSACTIVER le tag L2 selon l'état du slider
            if (isChecked) {
                // Slider activé → Cases L3 cochées → L2 activé
                l2Tag.classList.add('active');
            } else {
                // Slider désactivé → Cases L3 décochées → L2 désactivé
                l2Tag.classList.remove('active');
            }
            
            // Déclencher le filtrage
            // ...removed duplicate call...
                filterAndShowApplications();
        });
    });
}

// Initialisation des capabilities
async function initializeCapabilities(capData, appData) {
    // Charger les données BC L4 en premier
    await loadBCL4Data();
    
    // Stocker les données globalement
    capabilities = capData;
    // Enrichir chaque application avec le champ parent (et autres champs du mapping si besoin)
    if (window.appCapabilitiesUnified) {
        appData.forEach(app => {
            const mapping = window.appCapabilitiesUnified[app.name];
            if (mapping && mapping.parent) {
                app.parent = mapping.parent;
            }
        });
    }
    window.allApplications = appData; // toutes les applications, y compris hidden:true
    allApplications = appData.filter(app => app.hidden !== true); // uniquement les visibles
    
    // Générer l'interface des capabilities
    const capabilitiesForm = document.getElementById('capabilities-form');
    generateCapabilitiesInterface(window.bcMapping, capabilitiesForm);
    
    // Initialiser la section des catégories
    initializeCategoriesFilter();
    
    // Initialiser les applications filtrées avec toutes les applications
    currentFilteredApps = [...allApplications];
    
    // Assigner la fonction à la variable globale pour l'accès depuis d'autres scopes
    // ...removed duplicate assignment...
        globalFilterFunction = filterAndShowApplications;
    
    // Configurer les contrôles hybrides
    setupHybridControls();
    
    // Associer la fonction de filtrage au formulaire
    // ...removed duplicate assignment...
        capabilitiesForm.onchange = filterAndShowApplications;
    
    // Filtrage initial
    // ...removed duplicate call...
        filterAndShowApplications();
}

// Recherche d'applications
function initializeSearch() {
    
    // Debug complet de la structure DOM
    const sidebar = document.getElementById('sidebar');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('search-input');
        
    if (!searchInput) {
    console.error('❌ Élément search-input introuvable !');
    return;
    }
    let searchResults = [];
    
    function searchApplications(searchTerm) {
        if (!searchTerm.trim()) {
            searchResults = [];
            // ...removed duplicate call...
                filterAndShowApplications();
            return;
        }
        
        const term = searchTerm.toLowerCase();
        // Rechercher seulement dans les applications actuellement filtrées
       searchResults = currentFilteredApps.filter(app => 
       app.hidden !== true && app.name.toLowerCase().includes(term)
       );
        
        if (typeof window.showCountryMarkers === 'function') {
            window.showCountryMarkers(searchResults, allApplications);
        }
        displaySearchResults(searchResults, searchTerm);
    }
    
    function displaySearchResults(results, searchTerm) {
        const infoPanel = document.getElementById('info-panel');
        
        if (results.length === 0) {
            infoPanel.innerHTML = `<div style="padding: 10px; text-align: center; color: #666;">Aucune application trouvée pour "${searchTerm}"</div>`;
            return;
        }
        
        let html = `<h4 style="margin-bottom:10px;">Résultats de recherche (${results.length})</h4>`;
        
        results.forEach(app => {
            const countriesList = app.countries ? app.countries.join(', ') : 'Aucun pays';
            html += `
                <div class="search-result" data-name="${app.name}">
                    <div style="font-weight: bold; margin-bottom: 4px;">${app.name}</div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Catégorie: ${app.category || 'Non définie'}</div>
                    <div style="font-size: 14px; color: #666;">Pays: ${countriesList}</div>
                </div>
            `;
        });
        
        infoPanel.innerHTML = html;
        
        // Ajouter les événements de clic sur les résultats de recherche
        infoPanel.querySelectorAll('.search-result').forEach(elem => {
            elem.onclick = function() {
                const itemName = this.getAttribute('data-name');
                const isCurrentlySelected = this.classList.contains('selected');
                
                // Réinitialiser les styles des autres résultats
                infoPanel.querySelectorAll('.search-result').forEach(e => {
                    e.classList.remove('selected');
                });
                
                // Si l'élément n'était pas sélectionné, le sélectionner
                if (!isCurrentlySelected) {
                    this.classList.add('selected');
                    
                    // Afficher le bouton de sélection
                    if (typeof window.showSelectedAppButton === 'function') {
                        window.showSelectedAppButton(itemName);
                    }
                    
                    const item = searchResults.find(i => i.name === itemName);
                    if (!item) return;
                    
                    // Afficher les capabilities de l'application
                    displayApplicationCapabilities(itemName, item);
                    
                    // Réinitialiser et colorier les pays
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
                    // Si l'élément était déjà sélectionné, le désélectionner
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
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value;
        searchApplications(searchTerm);
    });
    
    // Effacer la recherche quand on change les capabilities
    function clearSearchOnCapabilityChange() {
        if (searchInput.value) {
            searchInput.value = '';
            searchResults = [];
        }
    }
    
    // Associer la fonction aux événements des tags
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('capability-tag')) {
            setTimeout(clearSearchOnCapabilityChange, 50);
        }
    });
}

// Exposer les fonctions nécessaires à la portée globale
window.displayApplicationCapabilities = displayApplicationCapabilities;
window.initializeCapabilities = initializeCapabilities;
window.addToComparator = addToComparator;
window.toggleAppInComparator = toggleAppInComparator;
window.addCurrentAppToComparator = addCurrentAppToComparator;
window.openComparatorPage = openComparatorPage;
window.updateComparatorButtons = updateComparatorButtons;
window.comparatorApps = comparatorApps;


// Initialisation de la liste des catégories avec cases à cocher
function initializeCategoriesFilter() {
    const categories = [
        "TMS", "Asset & Fleet Management", "Track & Trace", "Matrix", "Integration & Middleware", "Financial & Settlement Systems",
        "Reporting & BI", "Route & Planning Optimization", "Customs",
        "Freight Marketplace", "Customer Portal", "Documents & Collaboration",
        "Digital Forwarding", "YMS", "Warehouse Management Systems (WMS)", "Customer Relationship Management (CRM)", "Order Management System (OMS)", "Last Mile Distribution",
        "Claims & Damages", "Carriers Portal", "Control & Quality",
        "Mobile App", "Legal Compliance"
    ];
    
    const categoriesList = document.getElementById('categories-list');
    
    // Générer les cases à cocher pour chaque catégorie
    categories.forEach(category => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 4px;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background 0.2s ease;
        `;
        
        // Hover effect
        checkboxContainer.addEventListener('mouseenter', function() {
            this.style.background = '#f0f4ff';
        });
        checkboxContainer.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `category-${category.replace(/[^a-zA-Z0-9]/g, '-')}`;
        checkbox.value = category;
        checkbox.className = 'category-checkbox';
        checkbox.style.cssText = `
            margin-right: 8px;
            cursor: pointer;
        `;
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = category;
        label.style.cssText = `
            cursor: pointer;
            font-size: 1.3em;
            color: #333;
            flex: 1;
            user-select: none;
        `;
        
        // Événement de changement pour filtrer
    checkbox.addEventListener('change', filterAndShowApplications);
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        categoriesList.appendChild(checkboxContainer);
    });
}

// Fonction pour afficher les détails des L4 dans une popup
function showL4Details(l3Id, appName) {
    
    // Vérifier que window.appCapabilitiesUnified existe
    if (!window.appCapabilitiesUnified) {
        alert('Données des applications non chargées. Veuillez recharger la page.');
        return;
    }
    
    // Récupérer les données de l'application
    const appData = window.appCapabilitiesUnified[appName];
    if (!appData) {
        alert(`Données de l'application "${appName}" non trouvées`);
        return;
    }

    // Récupérer toutes les L4 pour cette L3
    const l4List = l3ToL4Mapping[l3Id] || [];
    if (l4List.length === 0) {
        alert('Aucune L4 trouvée pour cette L3');
        return;
    }

    // Récupérer le nom de la L3 avec les définitions
    let l3Name = l3Id; // Fallback si pas de définition
    if (bcL4Definitions && bcL4Definitions.L3 && bcL4Definitions.L3[l3Id]) {
        l3Name = bcL4Definitions.L3[l3Id];
    } else if (capabilities[l3Id]?.l3_name) {
        l3Name = capabilities[l3Id].l3_name;
    }
    
    // Récupérer la description de la L3
    const l3Description = l3Descriptions[l3Id] || '';
    
    // Récupérer les L4 implémentées par l'application
    const appL4List = appData.l4 || [];
    // Créer le contenu de la popup
    let popupContent = `
        <div class="l4-popup-content">
            <h3 class="l4-popup-title">
                📋 Détails L4 - ${l3Name}
            </h3>
            <p class="l4-popup-app-name">
                Application: ${appName}
            </p>
            ${l3Description ? `<div class="l4-popup-l3-description">
                ${l3Description}
            </div>` : ''}
            <div class="l4-popup-table-container">
                <table class="l4-popup-table">
                    <thead>
                        <tr>
                            <th>L4 Capability</th>
                            <th class="status-column">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Ajouter chaque L4 avec son statut
    l4List.forEach(l4Id => {
        const isImplemented = appL4List.includes(l4Id);
        
        // Utiliser les définitions de bc-definitions.json au lieu des codes
        let l4Name = l4Id; // Fallback si pas de définition
        if (bcL4Definitions && bcL4Definitions.L4 && bcL4Definitions.L4[l4Id]) {
            l4Name = bcL4Definitions.L4[l4Id];
        } else if (capabilities[l4Id]?.l4_name) {
            l4Name = capabilities[l4Id].l4_name;
        }
        
        const statusIcon = isImplemented ? '✓' : '✗';
        const statusClass = isImplemented ? 'status-implemented' : 'status-not-implemented';
        const rowClass = isImplemented ? 'l4-row-implemented' : 'l4-row-not-implemented';

        popupContent += `
            <tr class="${rowClass}">
                <td>
                    <div class="l4-name">${l4Name}</div>
                </td>
                <td class="status-cell ${statusClass}">
                    ${statusIcon}
                </td>
            </tr>
        `;
    });

    popupContent += `
                    </tbody>
                </table>
            </div>
            <div class="l4-popup-close-container">
                <button onclick="closeL4Popup()" class="l4-popup-close-btn">Fermer</button>
            </div>
        </div>
    `;

    // Créer et afficher la popup
    const popup = document.createElement('div');
    popup.id = 'l4-details-popup';
    popup.className = 'l4-details-popup';

    const popupInner = document.createElement('div');
    popupInner.className = 'l4-popup-inner';
    
    popupInner.innerHTML = popupContent;
    popup.appendChild(popupInner);
    document.body.appendChild(popup);

    // Fermer la popup en cliquant à l'extérieur
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closeL4Popup();
        }
    });
}

// Fonction pour fermer la popup L4
function closeL4Popup() {
    const popup = document.getElementById('l4-details-popup');
    if (popup) {
        popup.remove();
    }
}

window.initializeCapabilities = initializeCapabilities;
window.initializeSearch = initializeSearch;
window.filterAndShowMarkersByCapabilities = filterAndShowApplications;
window.showL4Details = showL4Details;
window.closeL4Popup = closeL4Popup;
