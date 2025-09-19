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
    afficherTousLesJours(indexCourant);

    // Navigation
    document.getElementById("prev").onclick = () => {
      if (indexCourant > 0) {
        indexCourant--;
        afficherTousLesJours(indexCourant);
      }
    };
    document.getElementById("next").onclick = () => {
      if (indexCourant < jsonData.length - 1) {
        indexCourant++;
        afficherTousLesJours(indexCourant);
      }
    };
  });

function afficherJour(index, cibleID) {
  const item = jsonData[index];
  if (!item) return;

  if (cibleID === "contenu-current") {
    const [mois, jour] = item.Fechas.split("-").map(x => parseInt(x, 10));
    const dateObj = new Date(Date.UTC(2025, mois - 1, jour)); // année arbitraire
    const nomJour = joursSemaine[dateObj.getUTCDay()];
    const nomMois = moisNoms[mois - 1];
    document.getElementById("dateLongue").textContent = `${nomJour} ${jour} de ${nomMois}`;
  }
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

  document.getElementById(cibleID).innerHTML = contenuHtml;
}

function afficherTousLesJours(index) {
  afficherJour(index, "contenu-current");
  afficherJour(index - 1, "contenu-prev");
  afficherJour(index + 1, "contenu-next");
}

document.getElementById('contenu-slider').style.transform = 'translateX(-100vw)';

// ==== Gestion du swipe avec effet visuel ====
const calendar = document.getElementById("contenu-slider");
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
  calendar.style.transform = `translateX(calc(-100vw + ${deltaX}px))`;
});

calendar.addEventListener("touchend", () => {
  if (!isSwiping) return;
  isSwiping = false;

  // swipe validé si > 50px
  if (Math.abs(deltaX) > 10) {
    if (deltaX < 0) {
      // gauche → mois suivant
      calendar.style.transition = "transform 0.3s ease";
      calendar.style.transform = "translateX(-200vw)";
      setTimeout(() => {
        document.getElementById("next").click(); // réutilise ton code existant
        calendar.style.transition = "none";
        calendar.style.transform = "translateX(-100vw)";

        // // force le navigateur à appliquer le style précédent
        // calendar.offsetHeight; // lecture forcée → repaint
        // requestAnimationFrame(() => {
        //   calendar.style.transition = "transform 0.3s ease";
        //   calendar.style.transform = "translateX(0)";
        // });
      }, 300);
    } else {
      // droite → mois précédent
      calendar.style.transition = "transform 0.3s ease";
      calendar.style.transform = "translateX(0vw)";
      setTimeout(() => {
        document.getElementById("prev").click();
        calendar.style.transition = "none";
        calendar.style.transform = "translateX(-100vw)";
        // calendar.offsetHeight; // lecture forcée → repaint
        // requestAnimationFrame(() => {
        //   calendar.style.transition = "transform 0.3s ease";
        //   calendar.style.transform = "translateX(0)";
        // });
      }, 300);
    }
  } else {
    // retour au centre si swipe trop court
    calendar.style.transition = "transform 0.3s ease";
    calendar.style.transform = "translateX(0)";
  }

  deltaX = 0;
});

