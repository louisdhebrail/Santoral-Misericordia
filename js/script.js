// ===== CONFIG PAYS / LANGUE =====
const PAYS_CONFIG = {
  es: { code: "CL", label: "Chile",
    moisNoms: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    joursSemaine: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"], hoy: "Hoy" },
  fr: { code: "FR", label: "France",
    moisNoms: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
    joursSemaine: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"], hoy: "Auj." },
};
function getPays() { return localStorage.getItem("santoral_pays") || "es"; }
function setPays(code) { localStorage.setItem("santoral_pays", code); }
const pays = getPays();
const lang = PAYS_CONFIG[pays];
const moisNoms = lang.moisNoms;

function getFlagSvg(code) {
  if (code === "es") {
    return `
      <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="60" height="40" fill="#d52b1e"/>
        <rect width="60" height="20" fill="#ffffff"/>
        <rect width="30" height="20" fill="#0039a6"/>
        <polygon points="15,6 16.5,10 21,10 17.75,12.75 18.75,17 15,14 11.25,17 12.25,12.75 9,10 13.5,10" fill="#ffffff"/>
      </svg>`;
  }
  if (code === "fr") {
    return `
      <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="20" height="40" fill="#0055a4"/>
        <rect x="20" width="20" height="40" fill="#ffffff"/>
        <rect x="40" width="20" height="40" fill="#ef4135"/>
      </svg>`;
  }
  return "";
}

function initCountrySelector() {
  const container = document.getElementById("country-select");
  if (!container) return;

  const selected = PAYS_CONFIG[pays];
  container.innerHTML = `
    <div class="country-display" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
      <span class="country-flag">${getFlagSvg(pays)}</span>
      <span class="country-label">${selected.label}</span>
      <span class="country-arrow">▾</span>
    </div>
    <div class="country-options hidden" role="listbox">
      ${Object.entries(PAYS_CONFIG).map(([code, p]) => `
        <div class="country-option ${code === pays ? 'selected' : ''}" data-country="${code}" role="option">
          <span class="country-flag">${getFlagSvg(code)}</span>
          <span class="country-label">${p.label}</span>
        </div>
      `).join('')}
    </div>
  `;

  const display = container.querySelector('.country-display');
  const options = container.querySelector('.country-options');

  const closeOptions = () => {
    options.classList.add('hidden');
    display.setAttribute('aria-expanded', 'false');
  };

  const openOptions = () => {
    options.classList.remove('hidden');
    display.setAttribute('aria-expanded', 'true');
  };

  display.addEventListener('click', event => {
    event.stopPropagation();
    if (options.classList.contains('hidden')) openOptions(); else closeOptions();
  });

  container.querySelectorAll('.country-option').forEach(option => {
    option.addEventListener('click', () => {
      const code = option.getAttribute('data-country');
      if (code && code !== pays) {
        setPays(code);
        location.reload();
      }
    });
  });

  document.addEventListener('click', event => {
    if (!container.contains(event.target)) closeOptions();
  });
}

function initBottomBar() {
  initCountrySelector();
  const btn = document.getElementById("today");
  if (btn) btn.textContent = lang.hoy;
  const jsSem = document.getElementById("jours-semaine");
  if (jsSem) jsSem.innerHTML = lang.joursSemaine.map(j => `<div>${j}</div>`).join("");
}
document.addEventListener("DOMContentLoaded", initBottomBar);

const params = new URLSearchParams(window.location.search);
const dateParam = params.get("mois"); // format "MM-YYYY"
const today = new Date();

let currentMonth, currentYear;
let jsonData = {};
let tableau = []; // le tableau des jours

// Charger le JSON une seule fois
fetch("/.netlify/functions/get-json")
    .then(response => response.json())
    .then(data => {
        jsonData = data;
        tableau = jsonData.data; // le tableau réel

        if (dateParam !== null) {
            [currentMonth, currentYear] = dateParam.split("-").map(x => parseInt(x, 10));
        } else {
            // Valeurs par défaut si pas de paramètre
            currentMonth = today.getMonth() + 1; // mois 1–12
            currentYear = today.getFullYear();
        }
        afficherTousLesCalendriers(currentMonth, currentYear);
    })
    .catch(err => console.error("Error al cargar JSON:", err));

function afficherCalendrier(month, year, cibleId) {
    const calendario = document.getElementById(cibleId);
    if (!calendario) return;

    if (cibleId === "calendario-current") {
        const moisTitre = document.getElementById("mois");
        moisTitre.textContent = `${moisNoms[month - 1]} ${year}`;
        const moisStr = String(currentMonth).padStart(2, "0");
        history.replaceState(null, "", `?mois=${moisStr}-${currentYear}`);
    }


    // Filtrer les jours du mois demandé
    const joursDuMois = tableau.filter(item => {
        const mois = parseInt(item.Fechas.slice(0, 2)); // MM-DD
        return mois === month;
    });

    // Trouver le premier jour du mois
    const premierJour = new Date(year, month - 1, 1);
    let startDay = premierJour.getDay(); // 0=dimanche, 1=lundi...

    calendario.innerHTML = "";

    // Cases vides avant le 1er jour
    for (let i = 0; i < startDay; i++) {
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
        if (
            month === 0o2 && jour === 29 &&
            !((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0))
        ) {
            div.style.display = "none";
        }


        // Clic = aller à la page détail
        div.onclick = () => {
            window.location.href = `detail.html?date=${item.Fechas}-${year}`;
        };

        calendario.appendChild(div);
    });
}
function afficherTousLesCalendriers(month, year) {
    // Mois précédent
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
    }

    // Mois suivant
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
    }

    afficherCalendrier(prevMonth, prevYear, "calendario-prev");
    afficherCalendrier(month, year, "calendario-current");
    afficherCalendrier(nextMonth, nextYear, "calendario-next");

    // Affiche/cacher le bouton "Hoy"
    const todayBtn = document.getElementById("today");
    if (todayBtn) todayBtn.style.visibility = (month === today.getMonth() + 1 && year === today.getFullYear()) ? "hidden" : "visible";
}
document.getElementById('calendario-slider').style.transform = 'translateX(-100vw)';

// Flèches navigation
document.getElementById("prev").onclick = () => {
    currentMonth--;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    afficherTousLesCalendriers(currentMonth, currentYear);
};

document.getElementById("next").onclick = () => {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    afficherTousLesCalendriers(currentMonth, currentYear);
};
// Bouton Hoy
document.getElementById("today").onclick = () => {
    currentMonth = today.getMonth() + 1;
    currentYear = today.getFullYear();
    afficherTousLesCalendriers(currentMonth, currentYear);
};

// ==== Gestion du swipe avec effet visuel ====
const calendar = document.getElementById("calendario-slider");
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
    if (Math.abs(deltaX) > 70) {
        if (deltaX < 0) {
            // gauche → mois suivant
            calendar.style.transition = "transform 0.3s ease";
            calendar.style.transform = "translateX(-200vw)";
            setTimeout(() => {
                document.getElementById("next").click(); // réutilise ton code existant
                calendar.style.transition = "none";
                calendar.style.transform = "translateX(-100vw)";
            }, 300);
        } else {
            // droite → mois précédent
            calendar.style.transition = "transform 0.3s ease";
            calendar.style.transform = "translateX(0vw)";
            setTimeout(() => {
                document.getElementById("prev").click();
                calendar.style.transition = "none";
                calendar.style.transform = "translateX(-100vw)";
            }, 300);
        }
    } else {
        // retour au centre si swipe trop court
        calendar.style.transition = "transform 0.3s ease";
        calendar.style.transform = "translateX(-100vw)";
    }

    deltaX = 0;
});
