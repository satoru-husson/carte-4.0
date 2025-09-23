// Définition des régions et leurs pays constitutifs
export const regionMapping = {
    "Europe": [
        "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
        "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", 
        "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", 
        "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", 
        "Slovenia", "Spain", "Sweden", "United Kingdom", "Switzerland", 
        "Norway", "Iceland", "Albania", "Bosnia and Herzegovina", "Montenegro", 
        "North Macedonia", "Serbia"
    ],
    "Nortam": [
        "United States of America", "Canada", "Mexico"
    ],
    "Asia Pacific": [
        "Australia", "New Zealand", "Japan", "South Korea", "China", "India", 
        "Singapore", "Malaysia", "Thailand", "Indonesia", "Philippines", 
        "Vietnam", "Cambodia", "Laos", "Myanmar", "Brunei"
    ],
    "Americas": [
        "United States of America", "Canada", "Mexico", "Brazil", "Argentina", 
        "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Bolivia", 
        "Paraguay", "Uruguay", "Guyana", "Suriname"
    ],
    "Africa": [
        "South Africa", "Nigeria", "Egypt", "Kenya", "Ghana", "Morocco", 
        "Algeria", "Tunisia", "Libya", "Ethiopia", "Tanzania", "Uganda", 
        "Zimbabwe", "Zambia", "Botswana", "Namibia"
    ]
};

// Fonction pour expander les régions vers les pays
export function expandRegions(countries) {
    const expandedCountries = [];
    countries.forEach(country => {
        if (regionMapping[country]) {
            // Si c'est une région, ajouter tous ses pays
            expandedCountries.push(...regionMapping[country]);
        } else {
            // Si c'est un pays, l'ajouter directement
            expandedCountries.push(country);
        }
    });
    // Supprimer les doublons
    return [...new Set(expandedCountries)];
}