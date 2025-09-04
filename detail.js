const params = new URLSearchParams(window.location.search);
const dateParam = params.get("date"); // format "MM-DD"

const joursSemaine = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];
const moisNoms = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

let jsonData = [];
let indexCourant = -1;

// Charger les données
fetch("donnees.json")
    .then(res => res.json())
    .then(data => {
        jsonData = data;

        // Trouver l'index du jour courant
        indexCourant = data.findIndex(item => item.Fechas === dateParam);
        afficherJour(indexCourant);

        // Navigation
        document.getElementById("prevDay").onclick = () => {
            if (indexCourant > 0) {
                indexCourant--;
                afficherJour(indexCourant);
            }
        };
        document.getElementById("nextDay").onclick = () => {
            if (indexCourant < jsonData.length - 1) {
                indexCourant++;
                afficherJour(indexCourant);
            }
        };
    });

function afficherJour(index) {
    const item = jsonData[index];
    if (!item) return;

    const [mois, jour] = item.Fechas.split("-").map(x => parseInt(x));
    const dateObj = new Date(new Date().getFullYear(), mois - 1, jour);

    const nomJour = joursSemaine[dateObj.getDay()];
    const nomMois = moisNoms[mois - 1];
    document.getElementById("dateLongue").textContent = `${nomJour} ${jour} de ${nomMois}`;

    document.getElementById("contenu").textContent = item["Misericordia chile"];
}
