// Charger les données JSON
fetch("donnees.json")
    .then(response => response.json())
    .then(data => {
        const calendario = document.getElementById("calendario");

        // Vider la div au cas où
        calendario.innerHTML = "";

        // Créer un carré pour chaque jour
        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "day";
            div.textContent = item.date_courte;  // Affiche MM-DD pour l'instant
            div.title = item.evenement;          // Info au survol
            div.onclick = () => alert(item.evenement); // Affiche l'événement au clic
            calendario.appendChild(div);
        });
    })
    .catch(err => console.error("Error al cargar JSON:", err));
