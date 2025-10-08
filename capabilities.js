// Gestionnaire des capabilities pour la carte interactive

// Variables globales pour les données
let capabilities = {};
let allApplications = [];
let globalFilterFunction = null;
let currentFilteredApps = [];

// Fonction pour afficher les capabilities d'une application
function displayApplicationCapabilities(appName, appData) {
    const infoPanel = document.getElementById('info-panel');
    
    // Trouver les capabilities de cette application
    const appCapabilities = [];
    if (appData && appData.capabilities) {
        appData.capabilities.forEach(capId => {
            if (capabilities[capId]) {
                appCapabilities.push({
                    id: capId,
                    ...capabilities[capId]
                });
            }
        });
    }
    
    // Générer le HTML pour afficher les capabilities
    let capabilitiesHTML = `
        <div style="margin-bottom: 15px;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">
                📋 Capabilities de ${appName}
            </h3>
            <button onclick="showAllApplications()" style="
                background: #6c757d; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                padding: 4px 8px; 
                font-size: 11px; 
                cursor: pointer;
                margin-bottom: 10px;
            ">← Retour à la liste</button>
        </div>
    `;
    
    if (appCapabilities.length > 0) {
        // Grouper par L1
        const l1Groups = {};
        appCapabilities.forEach(cap => {
            if (!l1Groups[cap.l1_name]) {
                l1Groups[cap.l1_name] = {};
            }
            if (!l1Groups[cap.l1_name][cap.l2_name]) {
                l1Groups[cap.l1_name][cap.l2_name] = [];
            }
            l1Groups[cap.l1_name][cap.l2_name].push(cap);
        });
        
        // Générer le HTML hiérarchique
        Object.keys(l1Groups).forEach(l1Name => {
            capabilitiesHTML += `
                <div style="margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; padding: 10px;">
                    <h4 style="color: #1a237e; margin: 0 0 8px 0; font-size: 14px;">🎯 ${l1Name}</h4>
            `;
            
            Object.keys(l1Groups[l1Name]).forEach(l2Name => {
                capabilitiesHTML += `
                    <div style="margin-bottom: 8px; padding-left: 15px;">
                        <h5 style="color: #1976d2; margin: 0 0 5px 0; font-size: 13px;">📌 ${l2Name}</h5>
                        <ul style="margin: 0; padding-left: 20px;">
                `;
                
                l1Groups[l1Name][l2Name].forEach(cap => {
                    if (cap.l3_name) {
                        capabilitiesHTML += `<li style="color: #666; font-size: 12px; margin-bottom: 2px;">✓ ${cap.l3_name}</li>`;
                    }
                });
                
                capabilitiesHTML += `</ul></div>`;
            });
            
            capabilitiesHTML += `</div>`;
        });
    } else {
        capabilitiesHTML += `<p style="color: #666; font-style: italic;">Aucune capability trouvée pour cette application.</p>`;
    }
    
    infoPanel.innerHTML = capabilitiesHTML;
}

// Fonction globale pour retourner à la liste complète des applications
window.showAllApplications = function() {
    // Réafficher la liste complète
    if (typeof globalFilterFunction === 'function') {
        globalFilterFunction();
    }
};

// Filtre et affiche les markers selon les capabilities sélectionnées (tags actifs)
function filterAndShowMarkersByCapabilities() {
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
    if (allActiveCapabilities.length === 0) {
        filteredApps = allApplications;
    } else {
        filteredApps = allApplications.filter(app =>
            app.capabilities.some(cap => allActiveCapabilities.includes(cap))
        );
    }
    
    // Mettre à jour la liste des applications filtrées pour la recherche
    currentFilteredApps = filteredApps;
    
    // Appeler la fonction showCountryMarkers (définie dans index.html)
    if (typeof window.showCountryMarkers === 'function') {
        window.showCountryMarkers(filteredApps, allApplications);
    }

    // Affiche la liste des applications monde par catégorie dans la sidebar
    const groupedSidebar = {};
    filteredApps.forEach(item => {
        const cat = item.category || "Autre";
        if (!groupedSidebar[cat]) groupedSidebar[cat] = [];
        groupedSidebar[cat].push(item.name);
    });

    let html = '';
    Object.keys(groupedSidebar).forEach(cat => {
        html += `<div style="margin-bottom:10px;">
            <span style="font-weight:bold;">${cat}</span><br>
            ${groupedSidebar[cat].map(name =>
                `<span class="sidebar-item" data-name="${name}" style="margin-left:10px; cursor:pointer; text-decoration:underline;">${name}</span>`
            ).join('<br>')}
        </div>`;
    });
    html += `<div style="height: 10px;"></div>`;

    let infoPanel = document.getElementById('info-panel');
    infoPanel.innerHTML = html;

    infoPanel.querySelectorAll('.sidebar-item').forEach(elem => {
        elem.onclick = function() {
            const itemName = this.getAttribute('data-name');
            const isCurrentlySelected = this.style.fontWeight === 'bold';
            
            // Réinitialiser tous les styles
            infoPanel.querySelectorAll('.sidebar-item').forEach(e => {
                e.style.fontWeight = 'normal';
            });
            
            // Si l'élément n'était pas sélectionné, le sélectionner
            if (!isCurrentlySelected) {
                this.style.fontWeight = 'bold';
                
                // Afficher le bouton de sélection
                if (typeof window.showSelectedAppButton === 'function') {
                    window.showSelectedAppButton(itemName);
                }
                
                const item = filteredApps.find(i => i.name === itemName);
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

// Génération de l'interface hybride slider + tags
function generateCapabilitiesInterface(capData, capabilitiesForm) {
    // Groupe les capabilities par catégorie
    const categorizedCaps = {};
    Object.keys(capData).forEach(capId => {
        const cap = capData[capId];
        const categoryName = cap.l1_name;
        if (!categorizedCaps[categoryName]) {
            categorizedCaps[categoryName] = [];
        }
        categorizedCaps[categoryName].push({ id: capId, ...cap });
    });

    // Affiche chaque catégorie avec slider et tags
    Object.keys(categorizedCaps).forEach(categoryName => {
        // Crée la section de catégorie
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.setAttribute('data-category', categoryName);
        
        // Container pour titre L1 + slider
        const titleContainer = document.createElement('div');
        titleContainer.className = 'l1-title-with-slider';
        
        // Titre de la catégorie (cliquable pour élargir)
        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'category-title clickable';
        categoryTitle.textContent = categoryName;
        categoryTitle.setAttribute('data-category', categoryName);
        categoryTitle.style.cursor = 'pointer';
        
        // Slider pour L1
        const sliderWrapper = document.createElement('label');
        sliderWrapper.className = 'switch';
        
        const sliderInput = document.createElement('input');
        sliderInput.type = 'checkbox';
        sliderInput.className = 'slider-checkbox-l1';
        sliderInput.setAttribute('data-category', categoryName);
        
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
        
        // Créer la structure hiérarchique L2 → L3
        const l2Groups = new Map();
        categorizedCaps[categoryName].forEach(cap => {
            if (!l2Groups.has(cap.l2_name)) {
                l2Groups.set(cap.l2_name, {
                    l2Capabilities: [],
                    l3Capabilities: []
                });
            }
            
            if (cap.l3_name) {
                // Capacité L3
                l2Groups.get(cap.l2_name).l3Capabilities.push({
                    id: cap.id,
                    name: cap.l3_name
                });
            } else {
                // Capacité L2 seulement
                l2Groups.get(cap.l2_name).l2Capabilities.push(cap.id);
            }
        });
        
        // Créer les tags L2 avec leurs L3
        l2Groups.forEach((group, l2Name) => {
            const l2Container = document.createElement('div');
            l2Container.className = 'l2-tag-container';
            
            // Vérifier si c'est le tag qui a besoin d'un slider
            if (l2Name === 'Create and manage accounts and contacts') {
                // Container pour le slider
                const sliderContainer = document.createElement('div');
                sliderContainer.className = 'slider-container';
                
                // Label pour le slider
                const sliderLabel = document.createElement('label');
                sliderLabel.textContent = 'Select All: ';
                sliderLabel.className = 'slider-label';
                
                // Slider switch
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
                
                sliderContainer.appendChild(sliderLabel);
                sliderContainer.appendChild(sliderWrapper);
                
                l2Container.appendChild(sliderContainer);
                
                // Container pour tag L2 + bouton All
                const tagContainer = document.createElement('div');
                tagContainer.className = 'l2-tag-with-all';
                
                // Tag L2 principal
                const l2Tag = document.createElement('div');
                l2Tag.className = 'capability-tag l2-tag';
                l2Tag.textContent = l2Name;
                
                const allL2Ids = [...group.l2Capabilities, ...group.l3Capabilities.map(l3 => l3.id)];
                l2Tag.setAttribute('data-capabilities', allL2Ids.join(','));
                l2Tag.setAttribute('data-category', categoryName);
                l2Tag.setAttribute('data-l2-name', l2Name);
                
                // Slider à droite
                const sliderWrapper2 = document.createElement('label');
                sliderWrapper2.className = 'switch';
                
                const sliderInput2 = document.createElement('input');
                sliderInput2.type = 'checkbox';
                sliderInput2.className = 'slider-checkbox';
                sliderInput2.setAttribute('data-l2-name', l2Name);
                
                const sliderSpan2 = document.createElement('span');
                sliderSpan2.className = 'slider round';
                
                sliderWrapper2.appendChild(sliderInput2);
                sliderWrapper2.appendChild(sliderSpan2);
                
                tagContainer.appendChild(l2Tag);
                tagContainer.appendChild(sliderWrapper2);
                l2Container.appendChild(tagContainer);
            } else {
                // Container pour tag L2 + slider
                const tagContainer = document.createElement('div');
                tagContainer.className = 'l2-tag-with-all';
                
                // Tag L2 normal
                const l2Tag = document.createElement('div');
                l2Tag.className = 'capability-tag l2-tag';
                l2Tag.textContent = l2Name;
                
                const allL2Ids = [...group.l2Capabilities, ...group.l3Capabilities.map(l3 => l3.id)];
                l2Tag.setAttribute('data-capabilities', allL2Ids.join(','));
                l2Tag.setAttribute('data-category', categoryName);
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
            }
            
            // Container pour les L3 (masqué par défaut)
            if (group.l3Capabilities.length > 0) {
                const l3Container = document.createElement('div');
                l3Container.className = 'l3-container';
                l3Container.setAttribute('data-l2-name', l2Name);
                
                group.l3Capabilities.forEach(l3 => {
                    // Créer le container pour checkbox + label
                    const l3CheckboxContainer = document.createElement('div');
                    l3CheckboxContainer.className = 'l3-checkbox-container';
                    
                    // Créer la checkbox
                    const l3Checkbox = document.createElement('input');
                    l3Checkbox.type = 'checkbox';
                    l3Checkbox.className = 'l3-checkbox';
                    l3Checkbox.id = `l3-${l3.id}`;
                    l3Checkbox.setAttribute('data-capability', l3.id);
                    l3Checkbox.setAttribute('data-category', categoryName);
                    l3Checkbox.setAttribute('data-l2-name', l2Name);
                    
                    // Créer le label
                    const l3Label = document.createElement('label');
                    l3Label.className = 'l3-label';
                    l3Label.htmlFor = `l3-${l3.id}`;
                    l3Label.textContent = l3.name;
                    
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
            
            filterAndShowMarkersByCapabilities();
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
                console.log(`✅ L2 "${l2Name}" activé automatiquement (${checkedL3Checkboxes.length}/${allL3Checkboxes.length} L3 cochées)`);
            } else {
                // Aucune L3 cochée → Désactiver le L2
                l2Tag.classList.remove('active');
                console.log(`❌ L2 "${l2Name}" désactivé (aucune L3 cochée)`);
            }
            
            // Déclencher le filtrage pour afficher sur la carte
            filterAndShowMarkersByCapabilities();
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
            filterAndShowMarkersByCapabilities();
        });
    });
    
    // Gestion du bouton All spécifique
    document.querySelectorAll('.all-button-specific').forEach(button => {
        button.addEventListener('click', function(event) {
            // Empêcher la propagation
            event.stopPropagation();
            
            const l2Name = this.getAttribute('data-l2-name');
            const checkboxes = document.querySelectorAll(`.l3-checkbox[data-l2-name="${l2Name}"]`);
            
            // Basculer l'état du bouton
            this.classList.toggle('active');
            const isActive = this.classList.contains('active');
            
            // Cocher/décocher toutes les cases L3 correspondantes
            checkboxes.forEach(checkbox => {
                checkbox.checked = isActive;
            });
            
            // Déclencher le filtrage
            filterAndShowMarkersByCapabilities();
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
            
            console.log(`${isChecked ? '✅' : '❌'} Slider L1 "${categoryName}" ${isChecked ? 'activé' : 'désactivé'} → ${allL3Checkboxes.length} L3 et ${allL2Tags.length} L2 ${isChecked ? 'activés' : 'désactivés'}`);
            
            // Déclencher le filtrage
            filterAndShowMarkersByCapabilities();
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
                console.log(`✅ Slider L2 activé → L2 "${l2Name}" activé automatiquement`);
            } else {
                // Slider désactivé → Cases L3 décochées → L2 désactivé
                l2Tag.classList.remove('active');
                console.log(`❌ Slider L2 désactivé → L2 "${l2Name}" désactivé automatiquement`);
            }
            
            // Déclencher le filtrage
            filterAndShowMarkersByCapabilities();
        });
    });
}

// Initialisation des capabilities
function initializeCapabilities(capData, appData) {
    // Stocker les données globalement
    capabilities = capData;
    allApplications = appData;
    
    // Générer l'interface des capabilities
    const capabilitiesForm = document.getElementById('capabilities-form');
    generateCapabilitiesInterface(capData, capabilitiesForm);
    
    // Initialiser les applications filtrées avec toutes les applications
    currentFilteredApps = [...allApplications];
    
    // Assigner la fonction à la variable globale pour l'accès depuis d'autres scopes
    globalFilterFunction = filterAndShowMarkersByCapabilities;
    
    // Configurer les contrôles hybrides
    setupHybridControls();
    
    // Associer la fonction de filtrage au formulaire
    capabilitiesForm.onchange = filterAndShowMarkersByCapabilities;
    
    // Filtrage initial
    filterAndShowMarkersByCapabilities();
}

// Recherche d'applications
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    let searchResults = [];
    
    function searchApplications(searchTerm) {
        if (!searchTerm.trim()) {
            searchResults = [];
            filterAndShowMarkersByCapabilities();
            return;
        }
        
        const term = searchTerm.toLowerCase();
        // Rechercher seulement dans les applications actuellement filtrées
        searchResults = currentFilteredApps.filter(app => 
            app.name.toLowerCase().includes(term)
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
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Catégorie: ${app.category || 'Non définie'}</div>
                    <div style="font-size: 12px; color: #666;">Pays: ${countriesList}</div>
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
window.initializeSearch = initializeSearch;
window.filterAndShowMarkersByCapabilities = filterAndShowMarkersByCapabilities;