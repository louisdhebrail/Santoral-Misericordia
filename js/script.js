const moisNoms = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const today = new Date();
let currentMonth = today.getMonth() + 1; // 1-12
let currentYear = today.getFullYear();

let jsonData = [];

// Charger le JSON une seule fois
fetch("./data/donnees.json")
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
    let startDay = premierJour.getDay() + 1; // 0=dimanche, 1=lundi...

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

        // Clic = aller à la page détail
        div.onclick = () => {
            window.location.href = `detail.html?date=${item.Fechas}`;
        };

        calendario.appendChild(div);
    });
    const todayBtn = document.getElementById("today");
    if (month === today.getMonth() + 1 && year === today.getFullYear()) {
        todayBtn.style.display = "none";   // on est déjà au mois actuel → cacher
    } else {
        todayBtn.style.display = "block";  // autre mois → afficher
    }
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

// ==== Gestion du swipe avec effet visuel ====
const calendar = document.getElementById("calendario");
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
    if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
            // gauche → mois suivant
            calendar.style.transition = "transform 0.3s ease";
            calendar.style.transform = "translateX(-100vw)";
            setTimeout(() => {
                document.getElementById("next").click(); // réutilise ton code existant
                calendar.style.transition = "none";
                calendar.style.transform = "translateX(100vw)";
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
