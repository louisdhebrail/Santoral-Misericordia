const params = new URLSearchParams(window.location.search);
const dateParam = params.get("date"); // format "MM-DD-YYYY"
let [, , year] = dateParam.split("-").map(x => parseInt(x, 10));
const paques = datePaques(year);
const today = new Date();

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
    indexCourant = data.findIndex(item => item.Fechas === dateParam.slice(0, 5));
    afficherTousLesJours(indexCourant);

    // Navigation
    document.getElementById("prev").onclick = () => {
      if (indexCourant > 0) {
        indexCourant--;
        afficherTousLesJours(indexCourant);
      }
      else {
        indexCourant = 365;
        year--;
        afficherTousLesJours(indexCourant);
      }
    };
    document.getElementById("next").onclick = () => {
      if (indexCourant < 365) {
        indexCourant++;
        afficherTousLesJours(indexCourant);
      }
      else {
        indexCourant = 0;
        year++;
        afficherTousLesJours(indexCourant);
      }
    };
  });

function afficherJour(index, cibleID) {
  let item = jsonData[index];
  if (!item) return;

  const [mois, jour] = item.Fechas.split("-").map(x => parseInt(x, 10));


  if (cibleID === "contenu-current") {
    const dateObj = new Date(Date.UTC(year, mois - 1, jour));
    const nomJour = joursSemaine[dateObj.getUTCDay()];
    const nomMois = moisNoms[mois - 1];
    document.getElementById("dateLongue").textContent = `${nomJour} ${jour} de ${nomMois}`;
  }

  // PÂQUES
  const fetesMobiles = getFetesMobiles(year);
  const feteDuJour = fetesMobiles.find(fete =>
    mois === fete.date.month && jour === fete.date.day
  );

  if (feteDuJour) {
    item = jsonData.find(obj => obj.Fechas === `${feteDuJour.nom}`);
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

  // Affiche/cacher le bouton "Hoy"
  const todayBtn = document.getElementById("today");
  if (mois === today.getMonth() + 1 && jour === today.getDate() + 1) {
    todayBtn.style.display = "none";
  } else {
    todayBtn.style.display = "block";
  }
}

function afficherTousLesJours(index) {
  afficherJour(index, "contenu-current");
  afficherJour(index - 1, "contenu-prev");
  afficherJour(index + 1, "contenu-next");
}

document.getElementById('contenu-slider').style.transform = 'translateX(-100vw)';

// Bouton Hoy
document.getElementById("today").onclick = () => {
  currentMonth = today.getMonth() + 1;
  currentDay = today.getDate();
  indexCourant = jsonData.findIndex(item => item.Fechas === currentMonth.toString().padStart(2, '0') + '-' + currentDay.toString().padStart(2, '0'));
  afficherTousLesJours(indexCourant);
};

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

function datePaques(year) {
  // Algorithme de Meeus/Jones/Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day }; // month: 3=March, 4=April
}

function addDaysToDate(month, day, year, offset) {
  // Ajoute offset jours à une date (mois: 1-12)
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

function getFetesMobiles(year) {
  const paques = datePaques(year);

  // Calcul des fêtes mobiles
  return [
    {
      nom: "Pascua",
      date: paques
    },
    {
      nom: "Ascensión",
      date: addDaysToDate(paques.month, paques.day, year, 39) // 39 jours après Pâques
    },
    {
      nom: "Pentecostés",
      date: addDaysToDate(paques.month, paques.day, year, 49) // 49 jours après Pâques
    },
    {
      nom: "Corpus Christi",
      date: addDaysToDate(paques.month, paques.day, year, 60) // 60 jours après Pâques
    }
    // Ajoute d'autres fêtes si besoin
  ];
}