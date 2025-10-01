// ==========================================
// COMPARATEUR BC L4 - FICHIER INDEPENDANT
// ==========================================

// Variables globales pour le comparateur
let comparatorApps = [];
let isComparatorOpen = false;
let allApplications = []; // Stockage des applications pour le comparateur

// Initialisation après le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation du comparateur...');
    
    // Initialiser immédiatement
    initializeComparator();
    
    // S'assurer que le bouton + fonctionne dès qu'une app est sélectionnée
    setInterval(checkAndSetupPlusButton, 1000);
});

// Fonction simple pour vérifier et configurer le bouton + périodiquement
function checkAndSetupPlusButton() {
    const addButton = document.getElementById('add-to-comparator-button');
    const appNameElement = document.getElementById('selected-app-name');
    
    // Si les éléments existent et que le bouton n'a pas encore d'event listener
    if (addButton && appNameElement && !addButton.hasAttribute('data-comparator-ready')) {
        console.log('� Configuration du bouton + détectée');
        
        // Marquer comme configuré
        addButton.setAttribute('data-comparator-ready', 'true');
        
        // Ajouter l'event listener directement
        addButton.onclick = function(event) {
            console.log('🎯 Clic sur bouton + détecté !');
            event.stopPropagation();
            event.preventDefault();
            
            const appName = appNameElement.textContent.trim();
            if (appName) {
                console.log('✅ Ajout de:', appName);
                addSelectedAppToComparator(appName);
            }
        };
        
        // Récupérer les données si nécessaire
        if (!allApplications || allApplications.length === 0) {
            if (window.allApplications) {
                allApplications = window.allApplications;
                console.log('📚 Applications récupérées:', allApplications.length);
            }
        }
        
        console.log('✅ Bouton + configuré avec succès');
    }
}

// Fonction de debug pour vérifier l'état du comparateur
function debugComparator() {
    const button = document.getElementById('comparator-toggle-btn');
    const interface = document.getElementById('comparator-interface');
    
    console.log('🔍 Debug comparateur:');
    console.log('- Bouton:', button ? '✅ Présent' : '❌ Absent');
    console.log('- Interface:', interface ? '✅ Présente' : '❌ Absente');
    console.log('- Apps chargées:', allApplications.length);
    
    if (button) {
        console.log('- Position bouton:', button.style.position);
        console.log('- Z-index bouton:', button.style.zIndex);
        console.log('- Display bouton:', window.getComputedStyle(button).display);
    }
}

// Intégration avec le bouton d'application sélectionnée
function setupSelectedAppIntegration() {
    console.log('🔗 Configuration de l\'intégration avec le bouton +');
    
    // Observer les changements dans le conteneur de l'application sélectionnée
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                setTimeout(() => {
                    setupAddToComparatorButton();
                }, 100);
            }
        });
    });
    
    // Observer le conteneur de l'application sélectionnée
    const container = document.getElementById('selected-app-container');
    if (container) {
        observer.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        console.log('✅ Observer configuré sur selected-app-container');
    } else {
        console.log('⚠️ selected-app-container non trouvé');
    }
    
    // Configuration initiale et retry périodique
    setupAddToComparatorButton();
    
    // Retry toutes les secondes pendant 10 secondes
    let retryCount = 0;
    const retryInterval = setInterval(() => {
        retryCount++;
        setupAddToComparatorButton();
        
        if (retryCount >= 10) {
            clearInterval(retryInterval);
        }
    }, 1000);
}

// Configurer le bouton "+" d'ajout au comparateur
function setupAddToComparatorButton() {
    const addButton = document.getElementById('add-to-comparator-button');
    
    if (!addButton) {
        // console.log('⚠️ Bouton + non trouvé, retry...');
        return;
    }
    
    console.log('🔧 Configuration du bouton + trouvé');
    
    // Supprimer tous les anciens event listeners en clonant l'élément
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    
    // Vérifier que allApplications est disponible
    if (!allApplications || allApplications.length === 0) {
        console.log('⚠️ Applications non chargées, chargement...');
        loadAvailableApplications();
    }
    
    // Ajouter le nouvel event listener avec gestion d'erreur
    newAddButton.addEventListener('click', function(event) {
        console.log('🎯 Clic détecté sur le bouton +');
        
        event.stopPropagation();
        event.preventDefault();
        
        try {
            const appNameElement = document.getElementById('selected-app-name');
            if (!appNameElement) {
                console.error('❌ Élément selected-app-name non trouvé');
                return;
            }
            
            const appName = appNameElement.textContent.trim();
            if (!appName) {
                console.error('❌ Nom d\'application vide');
                return;
            }
            
            console.log('✅ Tentative d\'ajout de:', appName);
            addSelectedAppToComparator(appName);
            
        } catch (error) {
            console.error('❌ Erreur lors du clic +:', error);
        }
    });
    
    // Ajouter un effet visuel au clic pour debug
    newAddButton.addEventListener('mousedown', function() {
        console.log('👆 MouseDown sur bouton +');
        this.style.transform = 'scale(0.9)';
    });
    
    newAddButton.addEventListener('mouseup', function() {
        console.log('👆 MouseUp sur bouton +');
        this.style.transform = 'scale(1)';
    });
    
    // Mettre à jour l'apparence selon l'état
    updateAddButtonState();
    
    console.log('✅ Bouton + configuré avec succès');
}

// Ajouter l'application sélectionnée au comparateur
function addSelectedAppToComparator(appName) {
    console.log('🚀 Début addSelectedAppToComparator pour:', appName);
    console.log('📊 Applications actuelles dans comparateur:', comparatorApps.length);
    console.log('📚 Applications disponibles:', allApplications.length);
    
    // Vérifier si l'app est déjà dans le comparateur
    const isAlreadyAdded = comparatorApps.some(app => app.name === appName);
    console.log('🔍 Application déjà ajoutée?', isAlreadyAdded);
    
    if (isAlreadyAdded) {
        // Retirer l'application
        comparatorApps = comparatorApps.filter(app => app.name !== appName);
        showFeedback(`${appName} retirée du comparateur`, '#f44336');
        console.log('➖ Application retirée, nouveau total:', comparatorApps.length);
        
        // Si plus d'applications, cacher le bouton
        if (comparatorApps.length === 0) {
            hideComparatorButton();
        }
    } else {
        // Ajouter l'application (si moins de 4)
        if (comparatorApps.length >= 4) {
            showFeedback('Maximum 4 applications dans le comparateur', '#ff9800');
            console.log('⚠️ Limite de 4 applications atteinte');
            return;
        }
        
        const app = allApplications.find(a => a.name === appName);
        if (!app) {
            showFeedback('Application non trouvée', '#f44336');
            console.error('❌ Application non trouvée dans allApplications:', appName);
            console.log('📋 Applications disponibles:', allApplications.map(a => a.name));
            return;
        }
        
        comparatorApps.push(app);
        showFeedback(`${appName} ajoutée au comparateur`, '#4CAF50');
        console.log('✅ Application ajoutée, nouveau total:', comparatorApps.length);
        
        // Si c'est la première application, afficher le bouton comparateur
        if (comparatorApps.length === 1) {
            console.log('🎯 Première application - affichage du bouton comparateur');
            showComparatorButton();
        }
    }
    
    updateInterface();
    updateAddButtonState();
    
    console.log('✅ addSelectedAppToComparator terminé');
}

// Mettre à jour l'état du bouton "+"
function updateAddButtonState() {
    const addButton = document.getElementById('add-to-comparator-button');
    const appNameElement = document.getElementById('selected-app-name');
    
    if (!addButton || !appNameElement) return;
    
    const appName = appNameElement.textContent.trim();
    const isAlreadyAdded = comparatorApps.some(app => app.name === appName);
    const canAdd = comparatorApps.length < 4;
    
    if (isAlreadyAdded) {
        // Application déjà ajoutée - bouton pour retirer
        addButton.textContent = '✓';
        addButton.style.background = 'rgba(76, 175, 80, 1)';
        addButton.style.opacity = '1';
        addButton.title = 'Retirer du comparateur';
    } else if (canAdd) {
        // Peut ajouter l'application
        addButton.textContent = '+';
        addButton.style.background = 'rgba(76, 175, 80, 0.8)';
        addButton.style.opacity = '0.9';
        addButton.title = 'Ajouter au comparateur';
    } else {
        // Comparateur plein
        addButton.textContent = '🚫';
        addButton.style.background = 'rgba(244, 67, 54, 0.8)';
        addButton.style.opacity = '0.7';
        addButton.title = 'Comparateur plein (4 max)';
    }
}

// Afficher un message de feedback
function showFeedback(message, color) {
    // Créer un message temporaire
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        z-index: 1001;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
    `;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    
    // Supprimer après 2.5 secondes
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 2500);
}

// Créer et afficher le bouton comparateur (seulement quand nécessaire)
function showComparatorButton() {
    // Vérifier s'il existe déjà
    const existingButton = document.getElementById('comparator-toggle-btn');
    if (existingButton) {
        return; // Déjà visible
    }
    
    console.log('🎯 Affichage du bouton comparateur (première application ajoutée)');
    
    const button = document.createElement('div');
    button.id = 'comparator-toggle-btn';
    button.style.cssText = `
        position: fixed !important;
        bottom: 25px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 2000 !important;
        background: linear-gradient(135deg, #1976d2, #1565c0) !important;
        color: white !important;
        padding: 15px 20px !important;
        border-radius: 30px !important;
        cursor: pointer !important;
        box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4) !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-weight: bold !important;
        font-family: Arial, sans-serif !important;
        font-size: 15px !important;
        transition: all 0.3s ease !important;
        user-select: none !important;
        min-width: 200px !important;
        justify-content: center !important;
        animation: slideInUp 0.5s ease-out !important;
    `;
    
    button.innerHTML = `
        <span id="comparator-icon" style="font-size: 18px;">⬆️</span>
        <span id="comparator-text">Comparateur BC L4</span>
        <span id="comparator-badge" style="
            background: #f44336 !important;
            color: white !important;
            border-radius: 12px !important;
            padding: 3px 8px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            min-width: 20px !important;
            text-align: center !important;
            margin-left: 5px !important;
            animation: pulse 2s infinite !important;
        ">${comparatorApps.length}</span>
        <span style="
            background: rgba(255,255,255,0.2) !important;
            padding: 5px 8px !important;
            border-radius: 15px !important;
            margin-left: 8px !important;
            font-size: 12px !important;
            cursor: pointer !important;
        " onclick="openComparatorPage(event)" title="Ouvrir en page dédiée">🚀</span>
    `;
    
    // Ajouter les animations CSS
    if (!document.getElementById('comparator-animations')) {
        const style = document.createElement('style');
        style.id = 'comparator-animations';
        style.textContent = `
            @keyframes slideInUp {
                from {
                    transform: translateX(-50%) translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes pulse {
                0%, 100% { 
                    transform: scale(1); 
                    box-shadow: 0 0 5px rgba(244, 67, 54, 0.5);
                }
                50% { 
                    transform: scale(1.1); 
                    box-shadow: 0 0 15px rgba(244, 67, 54, 0.8);
                }
            }
            
            #comparator-toggle-btn:hover {
                transform: translateX(-50%) scale(1.05) !important;
                box-shadow: 0 8px 25px rgba(25, 118, 210, 0.6) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Ajouter les événements
    button.addEventListener('click', toggleComparator);
    
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(-50%) scale(1.05)';
        this.style.boxShadow = '0 8px 25px rgba(25, 118, 210, 0.6)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(-50%) scale(1)';
        this.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
    });
    
    // Ajouter au body
    document.body.appendChild(button);
    
    console.log('✅ Bouton comparateur affiché avec succès');
    
    // Animation d'attention pour attirer l'œil
    setTimeout(() => {
        if (button) {
            button.style.animation = 'pulse 1s ease-in-out 3';
        }
    }, 1000);
}

// Créer l'interface de comparaison
function createComparatorInterface() {
    const interface = document.createElement('div');
    interface.id = 'comparator-interface';
    interface.innerHTML = `
        <div style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60vh;
            background: white;
            border-top: 3px solid #1976d2;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
            z-index: 999;
            transform: translateY(100%);
            transition: transform 0.4s ease;
            display: flex;
            flex-direction: column;
        ">
            <!-- Header du comparateur -->
            <div style="
                background: linear-gradient(135deg, #1976d2, #1565c0);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #ddd;
            ">
                <div>
                    <h2 style="margin: 0; font-size: 1.3em;">⚖️ Comparateur BC L4</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9em;">
                        Sélectionnez jusqu'à 4 applications pour comparer leurs Business Capabilities L4
                    </p>
                </div>
                <button id="close-comparator" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 8px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">✕</button>
            </div>
            
            <!-- Zone de contenu principal -->
            <div style="flex: 1; display: flex; overflow: hidden;">
                <!-- Panel de sélection des applications -->
                <div style="
                    width: 300px;
                    background: #f8f9fa;
                    border-right: 2px solid #e0e0e0;
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Recherche d'applications -->
                    <div style="padding: 15px; border-bottom: 1px solid #ddd;">
                        <input type="text" id="app-search" placeholder="Rechercher une application..." style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    
                    <!-- Applications sélectionnées -->
                    <div style="padding: 15px; border-bottom: 1px solid #ddd;">
                        <h4 style="margin: 0 0 10px 0; color: #1976d2;">📋 Applications sélectionnées (<span id="selected-count">0</span>/4)</h4>
                        <div id="selected-apps-list" style="min-height: 60px;">
                            <div style="color: #999; font-style: italic; text-align: center; padding: 20px;">
                                Aucune application sélectionnée
                            </div>
                        </div>
                    </div>
                    
                    <!-- Liste des applications disponibles -->
                    <div style="flex: 1; overflow-y: auto;">
                        <div style="padding: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #666;">📱 Applications disponibles</h4>
                            <div id="available-apps-list">
                                <!-- Les applications seront listées ici -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Zone de comparaison des tableaux -->
                <div style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div id="comparison-content">
                        <div style="
                            text-align: center;
                            color: #999;
                            padding: 60px 20px;
                            font-size: 1.1em;
                        ">
                            <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                            <h3 style="margin: 0 0 10px 0;">Comparaison des Business Capabilities L4</h3>
                            <p style="margin: 0;">Sélectionnez au moins 2 applications pour voir la comparaison des BC L4</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(interface);
}

// Configuration des événements
function setupEventListeners() {
    console.log('🔧 Configuration des événements...');
    
    // Bouton toggle du comparateur
    const toggleBtn = document.getElementById('comparator-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleComparator);
        console.log('✅ Event listener ajouté au bouton toggle');
    } else {
        console.error('❌ Bouton toggle non trouvé pour les événements');
    }
    
    // Attendre que l'interface soit créée pour les autres événements
    setTimeout(() => {
        // Bouton fermer
        const closeBtn = document.getElementById('close-comparator');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeComparator);
            console.log('✅ Event listener ajouté au bouton fermer');
        }
        
        // Recherche d'applications
        const searchInput = document.getElementById('app-search');
        if (searchInput) {
            searchInput.addEventListener('input', filterApplications);
            console.log('✅ Event listener ajouté à la recherche');
        }
        
        // Charger les applications au démarrage
        loadAvailableApplications();
    }, 100);
}

// Ouvrir/fermer le comparateur
function toggleComparator() {
    if (isComparatorOpen) {
        closeComparator();
    } else {
        openComparator();
    }
}

// Ouvrir le comparateur
function openComparator() {
    const interface = document.getElementById('comparator-interface');
    const icon = document.getElementById('comparator-icon');
    
    interface.style.transform = 'translateY(0)';
    icon.textContent = '⬇️';
    isComparatorOpen = true;
    
    // Charger les applications si pas encore fait
    loadAvailableApplications();
}

// Fermer le comparateur
function closeComparator() {
    const interface = document.getElementById('comparator-interface');
    const icon = document.getElementById('comparator-icon');
    
    interface.style.transform = 'translateY(100%)';
    icon.textContent = '⬆️';
    isComparatorOpen = false;
}

// Charger les applications disponibles
function loadAvailableApplications() {
    // Récupérer les données depuis le contexte global ou fetch
    if (window.allApplications && window.allApplications.length > 0) {
        allApplications = window.allApplications;
        renderAvailableApplications();
    } else {
        // Fallback: essayer de récupérer les données
        fetch('data.json')
            .then(r => r.json())
            .then(data => {
                allApplications = data;
                // Exposer globalement pour que le bouton "+" puisse y accéder
                if (!window.allApplications) {
                    window.allApplications = data;
                }
                renderAvailableApplications();
            })
            .catch(error => {
                console.error('Erreur lors du chargement des applications:', error);
                // Retry après 2 secondes si les données ne sont pas encore chargées
                setTimeout(() => {
                    if (window.allApplications && window.allApplications.length > 0) {
                        allApplications = window.allApplications;
                        renderAvailableApplications();
                    }
                }, 2000);
            });
    }
}

// Afficher les applications disponibles
function renderAvailableApplications() {
    const container = document.getElementById('available-apps-list');
    if (!container || !allApplications.length) return;
    
    let html = '';
    allApplications.forEach(app => {
        const isSelected = comparatorApps.some(selected => selected.name === app.name);
        const canAdd = comparatorApps.length < 4;
        
        html += `
            <div class="app-item" data-app-name="${app.name}" style="
                padding: 8px 12px;
                margin: 4px 0;
                border: 1px solid ${isSelected ? '#4CAF50' : '#ddd'};
                border-radius: 6px;
                cursor: ${!isSelected && canAdd ? 'pointer' : 'default'};
                background: ${isSelected ? '#e8f5e9' : 'white'};
                opacity: ${!isSelected && canAdd ? '1' : '0.6'};
                transition: all 0.2s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="font-weight: bold; font-size: 14px;">${app.name}</div>
                    <div style="font-size: 12px; color: #666;">${app.category || 'Non catégorisé'}</div>
                    <div style="font-size: 11px; color: #999;">
                        ${app.implementedL4 ? app.implementedL4.length : 0} BC L4
                    </div>
                </div>
                <div style="font-size: 18px;">
                    ${isSelected ? '✅' : (canAdd ? '➕' : '🚫')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Ajouter les événements de clic
    container.querySelectorAll('.app-item').forEach(item => {
        item.addEventListener('click', () => {
            const appName = item.dataset.appName;
            toggleApplicationSelection(appName);
        });
    });
}

// Ajouter/retirer une application de la sélection
function toggleApplicationSelection(appName) {
    const isSelected = comparatorApps.some(app => app.name === appName);
    
    if (isSelected) {
        // Retirer l'application
        comparatorApps = comparatorApps.filter(app => app.name !== appName);
        
        // Si plus d'applications, cacher le bouton
        if (comparatorApps.length === 0) {
            hideComparatorButton();
        }
    } else {
        // Ajouter l'application (si moins de 4)
        if (comparatorApps.length < 4) {
            const app = allApplications.find(a => a.name === appName);
            if (app) {
                comparatorApps.push(app);
                
                // Si c'est la première application, afficher le bouton comparateur
                if (comparatorApps.length === 1) {
                    showComparatorButton();
                }
            }
        } else {
            alert('Vous ne pouvez sélectionner que 4 applications maximum.');
            return;
        }
    }
    
    updateInterface();
}

// Mettre à jour l'interface
function updateInterface() {
    updateSelectedCount();
    updateSelectedAppsList();
    renderAvailableApplications();
    updateComparison();
    updateAddButtonState(); // Mettre à jour le bouton "+" de l'app sélectionnée
}

// Masquer le bouton comparateur si plus d'applications
function hideComparatorButton() {
    const button = document.getElementById('comparator-toggle-btn');
    if (button) {
        console.log('🫥 Masquage du bouton comparateur (plus d\'applications)');
        button.style.animation = 'slideInUp 0.3s ease-in reverse';
        setTimeout(() => {
            if (button.parentNode) {
                button.parentNode.removeChild(button);
            }
        }, 300);
    }
}

// Mettre à jour le compteur
function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    const badge = document.getElementById('comparator-badge');
    
    if (countElement) {
        countElement.textContent = comparatorApps.length;
    }
    
    if (badge) {
        badge.textContent = comparatorApps.length;
        // Animation du badge quand le nombre change
        badge.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            badge.style.animation = '';
        }, 500);
    }
}

// Mettre à jour la liste des applications sélectionnées
function updateSelectedAppsList() {
    const container = document.getElementById('selected-apps-list');
    if (!container) return;
    
    if (comparatorApps.length === 0) {
        container.innerHTML = `
            <div style="color: #999; font-style: italic; text-align: center; padding: 20px;">
                Aucune application sélectionnée
            </div>
        `;
        return;
    }
    
    let html = '';
    comparatorApps.forEach((app, index) => {
        html += `
            <div style="
                background: white;
                border: 1px solid #4CAF50;
                border-radius: 6px;
                padding: 8px 10px;
                margin: 4px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="font-weight: bold; font-size: 13px;">${app.name}</div>
                    <div style="font-size: 11px; color: #666;">
                        ${app.implementedL4 ? app.implementedL4.length : 0} BC L4
                    </div>
                </div>
                <button onclick="removeFromComparator(${index})" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " title="Supprimer">×</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Supprimer une application du comparateur
function removeFromComparator(index) {
    comparatorApps.splice(index, 1);
    
    // Si plus d'applications, cacher le bouton
    if (comparatorApps.length === 0) {
        hideComparatorButton();
        // Fermer l'interface si elle est ouverte
        if (isComparatorOpen) {
            closeComparator();
        }
    }
    
    updateInterface();
}

// Filtrer les applications
function filterApplications() {
    const searchTerm = document.getElementById('app-search').value.toLowerCase();
    const items = document.querySelectorAll('.app-item');
    
    items.forEach(item => {
        const appName = item.dataset.appName.toLowerCase();
        const isVisible = appName.includes(searchTerm);
        item.style.display = isVisible ? 'flex' : 'none';
    });
}

// Mettre à jour la comparaison
function updateComparison() {
    const container = document.getElementById('comparison-content');
    if (!container) return;
    
    if (comparatorApps.length < 2) {
        container.innerHTML = `
            <div style="
                text-align: center;
                color: #999;
                padding: 60px 20px;
                font-size: 1.1em;
            ">
                <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                <h3 style="margin: 0 0 10px 0;">Comparaison des Business Capabilities L4</h3>
                <p style="margin: 0;">Sélectionnez au moins 2 applications pour voir la comparaison des BC L4</p>
            </div>
        `;
        return;
    }
    
    // Générer le tableau de comparaison
    const comparisonTable = generateComparisonTable();
    container.innerHTML = comparisonTable;
}

// Générer le tableau de comparaison BC L4
function generateComparisonTable() {
    // Collecter toutes les BC L4 uniques
    const allL4 = new Set();
    comparatorApps.forEach(app => {
        if (app.implementedL4) {
            app.implementedL4.forEach(l4 => allL4.add(l4));
        }
    });
    
    const sortedL4 = Array.from(allL4).sort();
    
    if (sortedL4.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>Aucune BC L4 trouvée</h3>
                <p>Les applications sélectionnées n'ont pas de Business Capabilities L4 définies.</p>
            </div>
        `;
    }
    
    // Créer le tableau HTML
    let html = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0;">
                📊 Comparaison des Business Capabilities L4
            </h3>
            <p style="color: #666; margin: 0 0 20px 0;">
                ${comparatorApps.length} applications comparées • ${sortedL4.length} BC L4 au total
            </p>
        </div>
        
        <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white;">
                        <th style="
                            padding: 12px;
                            text-align: left;
                            font-weight: bold;
                            min-width: 250px;
                            border-right: 1px solid rgba(255,255,255,0.2);
                        ">Business Capability L4</th>
    `;
    
    // En-têtes des colonnes (applications)
    comparatorApps.forEach((app, index) => {
        const isLast = index === comparatorApps.length - 1;
        html += `
            <th style="
                padding: 12px;
                text-align: center;
                font-weight: bold;
                min-width: 120px;
                ${!isLast ? 'border-right: 1px solid rgba(255,255,255,0.2);' : ''}
            ">${app.name}</th>
        `;
    });
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Lignes du tableau
    sortedL4.forEach((l4, rowIndex) => {
        const isEven = rowIndex % 2 === 0;
        const rowBg = isEven ? '#fafafa' : 'white';
        
        html += `<tr style="background: ${rowBg};">`;
        html += `
            <td style="
                padding: 10px 12px;
                font-weight: 500;
                border-right: 1px solid #e0e0e0;
                border-bottom: 1px solid #e0e0e0;
            ">${l4}</td>
        `;
        
        // Colonnes pour chaque application
        comparatorApps.forEach((app, colIndex) => {
            const isImplemented = app.implementedL4 && app.implementedL4.includes(l4);
            const isLast = colIndex === comparatorApps.length - 1;
            
            const cellContent = isImplemented ? 
                '<span style="color: #4CAF50; font-size: 18px;">✓</span>' : 
                '<span style="color: #f44336; font-size: 18px;">✗</span>';
                
            const cellBg = isImplemented ? 
                'rgba(76, 175, 80, 0.1)' : 
                'rgba(244, 67, 54, 0.1)';
            
            html += `
                <td style="
                    padding: 10px 12px;
                    text-align: center;
                    background: ${cellBg};
                    ${!isLast ? 'border-right: 1px solid #e0e0e0;' : ''}
                    border-bottom: 1px solid #e0e0e0;
                ">${cellContent}</td>
            `;
        });
        
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Ajouter le résumé statistique
    html += generateSummaryStats(sortedL4);
    
    return html;
}

// Générer les statistiques de résumé
function generateSummaryStats(allL4) {
    let html = `
        <div style="
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa, #e3f2fd);
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        ">
            <h4 style="margin: 0 0 15px 0; color: #1976d2;">
                📈 Résumé de la comparaison
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
    `;
    
    comparatorApps.forEach(app => {
        const implementedCount = app.implementedL4 ? app.implementedL4.length : 0;
        const percentage = allL4.length > 0 ? Math.round((implementedCount / allL4.length) * 100) : 0;
        
        html += `
            <div style="
                background: white;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #ddd;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                    ${app.name}
                </div>
                <div style="color: #666; font-size: 13px; margin-bottom: 10px;">
                    ${implementedCount}/${allL4.length} BC L4 implémentées (${percentage}%)
                </div>
                <div style="
                    background: #e0e0e0;
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                ">
                    <div style="
                        background: linear-gradient(90deg, #4CAF50, #45a049);
                        height: 100%;
                        width: ${percentage}%;
                        border-radius: 4px;
                        transition: width 0.5s ease;
                    "></div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Exposer les fonctions globalement si nécessaire
window.removeFromComparator = removeFromComparator;
window.comparatorApps = comparatorApps;

// Fonction de test pour forcer l'affichage du bouton (debug)
window.testComparator = function() {
    console.log('🧪 Test forcé du comparateur...');
    
    // Supprimer l'ancien bouton s'il existe
    const oldButton = document.getElementById('comparator-toggle-btn');
    if (oldButton) {
        oldButton.remove();
    }
    
    // Recréer le bouton
    showComparatorButton();
    
    console.log('✅ Bouton recréé - devrait être visible maintenant');
};

// Fonction de test pour le bouton +
window.testPlusButton = function() {
    console.log('🧪 Test du bouton +...');
    
    const addButton = document.getElementById('add-to-comparator-button');
    const appNameElement = document.getElementById('selected-app-name');
    
    console.log('Bouton + trouvé:', !!addButton);
    console.log('Nom app trouvé:', !!appNameElement);
    
    if (appNameElement) {
        console.log('Nom application:', appNameElement.textContent);
    }
    
    if (addButton && appNameElement) {
        const appName = appNameElement.textContent.trim();
        console.log('🎯 Test ajout pour:', appName);
        addSelectedAppToComparator(appName);
    } else {
        console.log('❌ Éléments manquants pour le test');
    }
};

// Force la configuration du bouton + immédiatement
window.forcePlusButton = function() {
    console.log('🔧 Force configuration bouton +');
    checkAndSetupPlusButton();
};

// Ouvrir la page dédiée du comparateur
window.openComparatorPage = function(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    console.log('🚀 Ouverture de la page dédiée comparateur');
    
    // Sauvegarder les applications sélectionnées dans le localStorage
    if (comparatorApps.length > 0) {
        localStorage.setItem('comparatorApps', JSON.stringify(comparatorApps));
        console.log('💾 Applications sauvegardées pour la page dédiée:', comparatorApps.length);
    }
    
    // Ouvrir la page dédiée
    window.open('comparateur.html', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
};

// Fonction simple pour vérifier et configurer le bouton + périodiquement
function checkAndSetupPlusButton() {
    const addButton = document.getElementById('add-to-comparator-button');
    const appNameElement = document.getElementById('selected-app-name');
    
    // Si les éléments existent et que le bouton n'a pas encore d'event listener
    if (addButton && appNameElement && !addButton.hasAttribute('data-comparator-ready')) {
        console.log('🔧 Configuration du bouton + détectée');
        
        // Marquer comme configuré
        addButton.setAttribute('data-comparator-ready', 'true');
        
        // Ajouter l'event listener directement
        addButton.onclick = function(event) {
            console.log('🎯 Clic sur bouton + détecté !');
            event.stopPropagation();
            event.preventDefault();
            
            const appName = appNameElement.textContent.trim();
            if (appName) {
                console.log('✅ Ajout de:', appName);
                addSelectedAppToComparator(appName);
            }
        };
        
        // Récupérer les données si nécessaire
        if (!allApplications || allApplications.length === 0) {
            if (window.allApplications) {
                allApplications = window.allApplications;
                console.log('📚 Applications récupérées:', allApplications.length);
            }
        }
        
        console.log('✅ Bouton + configuré avec succès');
    }
}
