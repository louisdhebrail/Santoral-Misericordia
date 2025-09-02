// Cargar datos del JSON
fetch("donnees.json")
    .then(response => response.json())
    .then(data => {
        console.log("Datos cargados:", data);

        // Ejemplo simple: mostrar todos los eventos
        const calendario = document.getElementById("calendario");
        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "day";
            div.textContent = item.Fechas;  // MM-DD
            div.title = item.evenement;          // nombre del santo
            calendario.appendChild(div);
        });
    })
    .catch(err => console.error("Error al cargar JSON:", err));
