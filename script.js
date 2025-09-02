// Charger les données JSON
fetch("donnees.json")
    .then(response => response.json())
    .then(data => {
        const calendario = document.getElementById("calendario");
        calendario.innerHTML = ""; // Vider avant de remplir

        // Créer un carré pour chaque jour
        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "day";

            // Afficher juste le jour "DD" ou "MM-DD" si tu préfères
            div.textContent = item.Fechas.slice(3);

            // Survol et clic avec le nom du saint/fête
            div.title = item["Misericordia chile"];
            div.onclick = () => alert(item["Misericordia chile"]);

            calendario.appendChild(div);
        });
    })
    .catch(err => console.error("Error al cargar JSON:", err));
