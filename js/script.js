const moisNoms = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const params = new URLSearchParams(window.location.search);
const dateParam = params.get("mois"); // format "MM-YYYY"
const today = new Date();

let currentMonth, currentYear;
let jsonData = {};
let tableau = []; // le tableau des jours

// Charger le JSON une seule fois
fetch("./data/donnees.json?v=${Date.now()}")
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
    if (month === today.getMonth() + 1 && year === today.getFullYear()) {
        todayBtn.style.display = "none";
    } else {
        todayBtn.style.display = "block";
    }
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
    if (Math.abs(deltaX) > 10) {
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
