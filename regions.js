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
    "Europe+": [
        "Greece", "Morocco", "Belgium", "Netherlands", "Luxembourg", "Germany", 
        "France", "Spain", "Portugal", "Italy", "United Kingdom", "Ireland", 
        "Turkey", "Slovakia", "Switzerland", "Bulgaria", "Croatia", "Hungary", 
        "Latvia", "Portugal", "Romania", "Serbia", "Slovenia", "Czech Republic", 
        "Tunisia", "Austria", "Poland", "Sweden","Finland","Denmark"
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
    "Genio": [
        "Greece", "South Africa", "Cambodia", "Morocco", "Russia", 
        "United Arab Emirates", "United States of America", "Mexico", "Brazil", 
        "Argentina", "Uruguay", "Chile", "Belgium", "Netherlands", "Luxembourg", 
        "Estonia", "Latvia", "Lithuania", "Czech Republic", "Slovakia", "Hungary", 
        "Poland", "Slovenia", "Croatia", "Austria", "Germany", "France", 
        "Spain", "Portugal", "Italy", "United Kingdom", "Ireland", "Turkey", 
        "China", "India", "Australia", "New Zealand", "Poland"
    ],
    "Anz": [
        "Australia", "New Zealand"
    ],
    "Asia": [
        "China (Mainland)", "India", "Indonesia", "Philippines", "Vietnam", 
        "Thailand", "Singapore", "Malaysia"
    ],
    "Benelux": [
        "Belgium", "Netherlands", "Luxembourg"
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
