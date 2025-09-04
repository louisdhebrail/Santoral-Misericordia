// Noms des mois en espagnol
const moisNoms = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Récupérer le mois courant
const today = new Date();
const currentMonth = today.getMonth() + 1; // 1 à 12

fetch("donnees.json")
    .then(response => response.json())
    .then(data => {
        const calendario = document.getElementById("calendario");
        const moisTitre = document.getElementById("mois");

        // Afficher le nom du mois
        moisTitre.textContent = moisNoms[currentMonth - 1];

        // Filtrer seulement les jours du mois courant
        const joursDuMois = data.filter(item => {
            const mois = parseInt(item.Fechas.slice(0, 2)); // MM-DD
            return mois === currentMonth;
        });

        // Vider la div avant d'ajouter
        calendario.innerHTML = "";

        // Créer les carrés
        joursDuMois.forEach(item => {
            const div = document.createElement("div");
            div.className = "day";
            div.textContent = item.Fechas.slice(3); // juste le jour (DD)
            div.title = item["Misericordia Chile"];

            // Quand on clique → ouvrir la page détail
            div.onclick = () => {
                window.location.href = `detail.html?date=${item.Fechas}`;
            };

            calendario.appendChild(div);
        });
    })
    .catch(err => console.error("Error al cargar JSON:", err));
