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
        document.getElementById("prev").onclick = () => {
            if (indexCourant > 0) {
                indexCourant--;
                afficherJour(indexCourant);
            }
        };
        document.getElementById("next").onclick = () => {
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

    const contenuHtml = `
    <div class="detail-container">
      <div class="detail-title">Santo del día</div>
      <div class="detail-box">${item["Misericordia chile"] || ""}</div>

      <div class="detail-title">Ayuno</div>
      <div class="detail-box">${item["Ayuno"] || ""}</div>

      <div class="detail-title">En el Breviario Castellano</div>
      <div class="detail-box">${item["En el Breviario Castellano"] || ""}</div>

      <div class="detail-title">Celebración</div>
      <div class="detail-box">${item["Celebracion Celebration"] || ""}</div>

      <div class="detail-title">Color</div>
      <div class="detail-box">${item["Couleur / Color"] || ""}</div>
    </div>
  `;
    document.getElementById("contenu").innerHTML = contenuHtml;
}

