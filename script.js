// Noms des mois en espagnol
const moisNoms = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const today = new Date();
const currentMonth = today.getMonth() + 1; // 1 à 12
const currentYear = today.getFullYear();

fetch("donnees.json")
    .then(response => response.json())
    .then(data => {
        const calendario = document.getElementById("calendario");
        const moisTitre = document.getElementById("mois");

        // Afficher le nom du mois
        moisTitre.textContent = moisNoms[currentMonth - 1];

        // Filtrer les jours du mois courant
        const joursDuMois = data.filter(item => {
            const mois = parseInt(item.Fechas.slice(0, 2)); // MM-DD
            return mois === currentMonth;
        });

        // Trouver le premier jour du mois (0=dimanche, 1=lundi, ...)
        const premierJour = new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-01`);
        let startDay = premierJour.getDay();
        if (startDay === 0) startDay = 7; // décaler dimanche à la fin

        calendario.innerHTML = "";

        // Ajouter des cases vides avant le 1er jour
        for (let i = 1; i < startDay; i++) {
            const empty = document.createElement("div");
            empty.className = "day empty";
            calendario.appendChild(empty);
        }

        // Ajouter les jours du mois courant
        joursDuMois.forEach(item => {
            const div = document.createElement("div");
            div.className = "day";
            div.textContent = item.Fechas.slice(3); // juste le jour
            div.title = item["Misericordia chile"];

            // Clic = aller à la page détail
            div.onclick = () => {
                window.location.href = `detail.html?date=${item.Fechas}`;
            };

            calendario.appendChild(div);
        });
    })
    .catch(err => console.error("Error al cargar JSON:", err));
