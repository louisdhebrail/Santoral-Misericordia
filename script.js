const moisNoms = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const today = new Date();
let currentMonth = today.getMonth() + 1; // 1-12
let currentYear = today.getFullYear();

let jsonData = [];

// Charger le JSON une seule fois
fetch("donnees.json")
    .then(response => response.json())
    .then(data => {
        jsonData = data;
        afficherCalendrier(currentMonth, currentYear);
    })
    .catch(err => console.error("Error al cargar JSON:", err));

function afficherCalendrier(month, year) {
    const calendario = document.getElementById("calendario");
    const moisTitre = document.getElementById("mois");

    moisTitre.textContent = `${moisNoms[month - 1]} ${year}`;

    // Filtrer les jours du mois demandé
    const joursDuMois = jsonData.filter(item => {
        const mois = parseInt(item.Fechas.slice(0, 2)); // MM-DD
        return mois === month;
    });

    // Trouver le premier jour du mois
    const premierJour = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
    let startDay = premierJour.getDay(); // 0=dimanche, 1=lundi...
    if (startDay === 0) startDay = 7; // dimanche à la fin

    calendario.innerHTML = "";

    // Cases vides avant le 1er jour
    for (let i = 1; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        calendario.appendChild(empty);
    }

    // Ajouter les jours
    joursDuMois.forEach(item => {
        const div = document.createElement("div");
        div.className = "day";
        const jour = parseInt(item.Fechas.slice(3)); // jour (DD)
        div.textContent = jour;
        div.title = item["Misericordia chile"];

        // Surbrillance si c’est aujourd’hui
        if (
            jour === today.getDate() &&
            month === today.getMonth() + 1 &&
            year === today.getFullYear()
        ) {
            div.classList.add("today");
        }

        // Clic = aller à la page détail
        div.onclick = () => {
            window.location.href = `detail.html?date=${item.Fechas}`;
        };

        calendario.appendChild(div);
    });
}

// Flèches navigation
document.getElementById("prev").onclick = () => {
    currentMonth--;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    afficherCalendrier(currentMonth, currentYear);
};

document.getElementById("next").onclick = () => {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    afficherCalendrier(currentMonth, currentYear);
};
// Bouton Hoy
document.getElementById("today").onclick = () => {
    currentMonth = today.getMonth() + 1;
    currentYear = today.getFullYear();
    afficherCalendrier(currentMonth, currentYear);
};
