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
fetch("./data/donnees.json")
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
    ${item["Misericordia chile"] ? `
      <div class="detail-title">Santo del día</div>
      <div class="detail-box">${item["Misericordia chile"]}</div>
    ` : ''}

    ${item["Ayuno"] ? `
      <div class="detail-title">Ayuno</div>
      <div class="detail-box">${item["Ayuno"]}</div>
    ` : ''}

    ${item["En el Breviario Castellano"] ? `
      <div class="detail-title">En el Breviario Castellano</div>
      <div class="detail-box">${item["En el Breviario Castellano"]}</div>
    ` : ''}

    ${item["Celebracion Celebration"] ? `
      <div class="detail-title">Celebración</div>
      <div class="detail-box">${item["Celebracion Celebration"]}</div>
    ` : ''}

    ${item["Couleur / Color"] ? `
      <div class="detail-title">Color</div>
      <div class="detail-box">${item["Couleur / Color"]}</div>
    ` : ''}
  </div>
`;

  document.getElementById("contenu").innerHTML = contenuHtml;
}


// ==== Gestion du swipe avec effet visuel ====
const calendar = document.getElementById("contenu");
let startX = 0, deltaX = 0, isSwiping = false;

calendar.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  isSwiping = true;
  calendar.style.transition = "none"; // pas d’anim pendant le drag
});

calendar.addEventListener("touchmove", e => {
  if (!isSwiping) return;
  const currentX = e.touches[0].clientX;
  deltaX = currentX - startX;
  calendar.style.transform = `translateX(${deltaX}px)`;
});

calendar.addEventListener("touchend", () => {
  if (!isSwiping) return;
  isSwiping = false;

  // swipe validé si > 50px
  if (Math.abs(deltaX) > 10) {
    if (deltaX < 0) {
      // gauche → mois suivant
      calendar.style.transition = "transform 0.3s ease";
      calendar.style.transform = "translateX(-100vw)";
      setTimeout(() => {
        document.getElementById("next").click(); // réutilise ton code existant
        calendar.style.transition = "none";
        calendar.style.transform = "translateX(100vw)";

        // force le navigateur à appliquer le style précédent
        calendar.offsetHeight; // lecture forcée → repaint
        requestAnimationFrame(() => {
          calendar.style.transition = "transform 0.3s ease";
          calendar.style.transform = "translateX(0)";
        });
      }, 300);
    } else {
      // droite → mois précédent
      calendar.style.transition = "transform 0.3s ease";
      calendar.style.transform = "translateX(100vw)";
      setTimeout(() => {
        document.getElementById("prev").click();
        calendar.style.transition = "none";
        calendar.style.transform = "translateX(-100vw)";
        calendar.offsetHeight; // lecture forcée → repaint
        requestAnimationFrame(() => {
          calendar.style.transition = "transform 0.3s ease";
          calendar.style.transform = "translateX(0)";
        });
      }, 300);
    }
  } else {
    // retour au centre si swipe trop court
    calendar.style.transition = "transform 0.3s ease";
    calendar.style.transform = "translateX(0)";
  }

  deltaX = 0;
});

