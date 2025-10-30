const params = new URLSearchParams(window.location.search);
const dateParam = params.get("date"); // format "MM-DD-YYYY"
let [, , year] = dateParam.split("-").map(x => parseInt(x, 10));
const paques = datePaques(year);
const today = new Date();
const romanWeek = ["I", "II", "III", "IV"];


const joursSemaine = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];
const moisNoms = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

let jsonData = {};
let tableau = []; // le tableau des jours
let indexCourant = -1;

// Charger les données
fetch("./data/donnees.json?v=${Date.now()}")
  .then(res => res.json())
  .then(data => {
    jsonData = data;
    tableau = jsonData.data; // le tableau réel


    // Trouver l'index du jour courant
    indexCourant = tableau.findIndex(item => item.Fechas === dateParam.slice(0, 5));
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

function afficherJour(index, annee, cibleID) {
  let item = tableau[index];
  if (!item) return;

  const [mois, jour] = item.Fechas.split("-").map(x => parseInt(x, 10));


  if (cibleID === "contenu-current") {
    const dateObj = new Date(annee, mois - 1, jour);
    const nomJour = joursSemaine[dateObj.getDay()];
    const nomMois = moisNoms[mois - 1];
    document.getElementById("dateLongue").textContent = `${nomJour} ${jour} de ${nomMois}`;
    history.replaceState(null, "", `?date=${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}-${year}`);
    document.getElementById("back").onclick = () => {
      window.location.href = `index.html?mois=${mois}-${year}`;
    };

  }

  // Fêtes mobiles
  const fetesMobiles = getFetesMobiles(annee);
  const feteDuJour = fetesMobiles.find(fete =>
    mois === fete.date.month && jour === fete.date.day
  );

  if (feteDuJour) {
    item = tableau.find(obj => obj.Fechas === `${feteDuJour.nom}`);
  }
  // Temps liturgique
  let temps = getTempsLiturgique(annee, mois, jour);

  if (!item) {
    const contenuHtml = `
  <div class="detail-container">
    <div class="detail-title">${feteDuJour.nom}</div>`;
    document.getElementById(cibleID).innerHTML = contenuHtml;
  }
  else {
    const contenuHtml = `
  <div class="detail-container">
    <div class="detail-box">${temps.numero}${temps.nom} <br> Semana ${temps.psalterio} del psalterio</div>

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
  </div>`;
    document.getElementById(cibleID).innerHTML = contenuHtml;
  }



  // Affiche/cacher le bouton "Hoy"
  const todayBtn = document.getElementById("today");
  if (mois === today.getMonth() + 1 && jour === today.getDate() + 1) {
    todayBtn.style.display = "none";
  } else {
    todayBtn.style.display = "block";
  }
}

function afficherTousLesJours(index) {
  afficherJour(index, year, "contenu-current");

  if (index === 0) {
    afficherJour(365, year - 1, "contenu-prev");
  }
  else {
    afficherJour(index - 1, year, "contenu-prev");
  }
  if (index === 365) {
    afficherJour(0, year + 1, "contenu-next");
  }
  else {
    afficherJour(index + 1, year, "contenu-next");
  }
}

document.getElementById('contenu-slider').style.transform = 'translateX(-100vw)';

// Bouton Hoy
document.getElementById("today").onclick = () => {
  currentMonth = today.getMonth() + 1;
  currentDay = today.getDate();
  indexCourant = tableau.findIndex(item => item.Fechas === currentMonth.toString().padStart(2, '0') + '-' + currentDay.toString().padStart(2, '0'));
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
  if (Math.abs(deltaX) > 70) {
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
  /*
  | Fête                                      | Date par rapport à Pâques                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| **Mercredi des Cendres**                  | 46 jours avant Pâques                                                             |
| **Dimanche des Rameaux et de la Passion** | 1 semaine avant Pâques                                                            |
| **Jeudi Saint (Cène du Seigneur)**        | 3 jours avant Pâques                                                              |
| **Vendredi Saint**                        | 2 jours avant Pâques                                                              |
| **Samedi Saint (Veillée pascale)**        | 1 jour avant Pâques                                                               |
| **Dimanche de Pâques (Résurrection)**     | date centrale, variable                                                           |
| **Lundi de Pâques**                       | lendemain de Pâques                                                               |
| **Ascension**                             | 40 jours après Pâques (souvent transférée au dimanche suivant dans certains pays) |
| **Pentecôte**                             | 50 jours après Pâques                                                             |
| **Lundi de Pentecôte**                    | lendemain de Pentecôte                                                            |
| **Fête de la Sainte Trinité**             | dimanche après Pentecôte                                                          |
| **Fête du Saint-Sacrement (Fête-Dieu)**   | jeudi après la Trinité (souvent transférée au dimanche suivant)                   |
| **Fête du Sacré-Cœur**                    | vendredi après la Fête-Dieu                                                       |
| **Immaculé Cœur de Marie**                | samedi après le Sacré-Cœur                                                        |
| **Christ Roi de l’Univers**               | dimanche précédant le 1er dimanche de l’Avent                                     |
*/


  // Calcul des fêtes mobiles
  return [
    {
      nom: "Miércoles de Ceniza",
      date: addDaysToDate(paques.month, paques.day, year, -46) // 46 días antes de Pascua
    },
    {
      nom: "Domingo de Ramos y de la Pasión",
      date: addDaysToDate(paques.month, paques.day, year, -7) // 1 semana antes de Pascua
    },
    {
      nom: "Jueves Santo",
      date: addDaysToDate(paques.month, paques.day, year, -3) // 3 días antes de Pascua
    },
    {
      nom: "Viernes Santo",
      date: addDaysToDate(paques.month, paques.day, year, -2) // 2 días antes de Pascua
    },
    {
      nom: "Sábado Santo",
      date: addDaysToDate(paques.month, paques.day, year, -1) // 1 día antes de Pascua
    },
    {
      nom: "Domingo de Pascua",
      date: addDaysToDate(paques.month, paques.day, year, 0) // Pascua
    },
    {
      nom: "Lunes de Pascua",
      date: addDaysToDate(paques.month, paques.day, year, 1) // día después de Pascua
    },
    {
      nom: "Ascensión",
      date: addDaysToDate(paques.month, paques.day, year, 39) // 40 días después de Pascua
    },
    {
      nom: "Pentecostés",
      date: addDaysToDate(paques.month, paques.day, year, 49) // 50 días después de Pascua
    },
    {
      nom: "Lunes de Pentecostés",
      date: addDaysToDate(paques.month, paques.day, year, 50) // día después de Pentecostés
    },
    {
      nom: "Fiesta de la Santísima Trinidad",
      date: addDaysToDate(paques.month, paques.day, year, 56) // domingo después de Pentecostés
    },
    {
      nom: "Corpus Christi",
      date: addDaysToDate(paques.month, paques.day, year, 60) // jueves después de la Trinidad
    },
    {
      nom: "Sagrado Corazón de Jesús",
      date: addDaysToDate(paques.month, paques.day, year, 61) // viernes después del Corpus Christi
    },
    {
      nom: "Inmaculado Corazón de María",
      date: addDaysToDate(paques.month, paques.day, year, 62) // sábado después del Sagrado Corazón
    },
    {
      nom: "Cristo Rey del Universo",
      date: calculateCristoRey(year) // función especial para calcular el domingo antes del Adviento
    }
  ];
}

function calculateCristoRey(year) {
  // Date de Noël
  const christmas = new Date(year, 11, 25); // 25 décembre

  // Trouver le 1er dimanche de l’Avent (4e dimanche avant Noël)
  let adventSunday = new Date(christmas);
  // reculer de 28 jours (4 semaines)
  adventSunday.setDate(christmas.getDate() - 28);
  // ajuster pour tomber sur un dimanche
  const dayOfWeek = adventSunday.getDay(); // 0 = dimanche
  adventSunday.setDate(adventSunday.getDate() + (0 - dayOfWeek + 7) % 7);

  // Cristo Rey = dimanche précédent
  const cristoRey = new Date(adventSunday);
  cristoRey.setDate(adventSunday.getDate() - 7);

  return { month: cristoRey.getMonth() + 1, day: cristoRey.getDate() };
}

function getTempsLiturgique(year, mois, jour) {
  const paques = datePaques(year);

  // Mercredi des Cendres = 46 jours avant Pâques
  const caremeDebut = addDaysToDate(paques.month, paques.day, year, -46);
  const dCaremeDebut = new Date(year, caremeDebut.month - 1, caremeDebut.day);

  // Premier dimanche de Carême
  let premierDimancheCareme = new Date(dCaremeDebut);
  premierDimancheCareme.setDate(dCaremeDebut.getDate() + ((7 - dCaremeDebut.getDay()) % 7));

  // Semaine Sainte = du dimanche avant Pâques à Pâques
  const semaineSainteDebut = addDaysToDate(paques.month, paques.day, year, -7);
  const dSemaineSainteDebut = new Date(year, semaineSainteDebut.month - 1, semaineSainteDebut.day);

  // Temps Pascal = de Pâques à Pentecôte (49 jours)
  const pentecote = addDaysToDate(paques.month, paques.day, year, 49);
  const dPaques = new Date(year, paques.month - 1, paques.day);
  const dPentecote = new Date(year, pentecote.month - 1, pentecote.day);

  // Noël : du 25 décembre au Baptême du Seigneur (dimanche après le 6 janvier)
  const dNoel = new Date(year, 11, 25);
  let dBapteme = new Date(year, 0, 6); // 6 janvier
  dBapteme.setDate(dBapteme.getDate() + ((7 - dBapteme.getDay()) % 7)); // dimanche après 6 janvier

  // Avent : commence 4 dimanches avant Noël
  let premierDimancheAvent = new Date(dNoel);
  premierDimancheAvent.setDate(dNoel.getDate() - ((dNoel.getDay() === 0 ? 0 : dNoel.getDay()) + 21));

  // Temps ordinaire 1 : du lundi après Baptême du Seigneur au mardi avant Carême
  let ordinaire1Debut = new Date(dBapteme);
  ordinaire1Debut.setDate(dBapteme.getDate() + 1); // lundi après Baptême
  let ordinaire1Fin = new Date(dCaremeDebut);
  ordinaire1Fin.setDate(dCaremeDebut.getDate() - 1);

  // Temps ordinaire 2 : du lundi après Pentecôte à l'Avent
  let ordinaire2Debut = new Date(dPentecote);
  ordinaire2Debut.setDate(dPentecote.getDate() + 1);
  let ordinaire2Fin = new Date(premierDimancheAvent);

  // Date du jour
  const d = new Date(year, mois - 1, jour);

  // Avent
  if (d >= premierDimancheAvent && d < dNoel) {
    const diffDays = Math.floor((d - premierDimancheAvent) / (1000 * 60 * 60 * 24));
    const semaineAvent = Math.floor(diffDays / 7) + 1;
    return { nom: "° semana del Adviento", numero: Math.max(1, semaineAvent), psalterio: romanWeek[semaineAvent - 1] };
  }
  // Noël (du 25 décembre au Baptême du Seigneur inclus)
  if (d >= dNoel || d <= dBapteme) {
    const diffDays = Math.floor((d - premierDimancheAvent) / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) % 4; // psautier 0-3
    return { nom: "Navidad", numero: "", psalterio: romanWeek[week] };
  }
  // Temps ordinaire 1
  if (d >= ordinaire1Debut && d <= ordinaire1Fin) {
    // Premier dimanche du Temps Ordinaire 1
    let premierDimancheOrdinaire = new Date(ordinaire1Debut);
    premierDimancheOrdinaire.setDate(ordinaire1Debut.getDate() + (7 - ordinaire1Debut.getDay()) % 7);

    if (d < premierDimancheOrdinaire) {
      // Avant le premier dimanche : semaine 1 (lundi-samedi)
      return { nom: "° semana del Tiempo Ordinario", numero: 1, psalterio: "I" };
    } else {
      // À partir du premier dimanche, semaine = 2 + nombre de semaines écoulées depuis ce dimanche
      const diffDays = Math.floor((d - premierDimancheOrdinaire) / (1000 * 60 * 60 * 24));
      const semaine = Math.floor(diffDays / 7) + 2;
      return { nom: "° semana del Tiempo Ordinario", numero: semaine, psalterio: romanWeek[(semaine - 1) % 4] };
    }
  }
  // Jours de Cendres
  if (d >= dCaremeDebut && d < premierDimancheCareme) {
    const jourCendres = d.getDay();
    return { nom: " de Cenizas", numero: joursSemaine[jourCendres], psalterio: romanWeek[3] };
  }
  // Carême (semaines commençant le dimanche)
  if (d >= premierDimancheCareme && d < dSemaineSainteDebut) {
    const diffDays = Math.floor((d - premierDimancheCareme) / (1000 * 60 * 60 * 24));
    const semaineCareme = Math.floor(diffDays / 7) + 1;
    return { nom: "° semana de Cuaresma", numero: Math.max(1, semaineCareme), psalterio: romanWeek[(semaineCareme - 1) % 4] };
  }
  // Semaine Sainte
  if (d >= dSemaineSainteDebut && d < dPaques) {
    const jourSemaineSainte = d.getDay();
    const semaineCareme = Math.floor(diffDays / 7) + 1;
    return { nom: " Santo", numero: joursSemaine[jourSemaineSainte], psalterio: romanWeek[(semaineCareme - 1) % 4] };
  }
  // Pâques
  if (d.getTime() === dPaques.getTime()) {
    return { nom: "Pascua", numero: "", psalterio: romanWeek[0] };
  }
  // Temps Pascal
  if (d > dPaques && d <= dPentecote) {
    const diffDays = Math.floor((d - dPaques) / (1000 * 60 * 60 * 24));
    const semainePascal = Math.floor(diffDays / 7) + 1;
    return { nom: "° semana del Tiempo Pascual", numero: Math.max(1, semainePascal), psalterio: romanWeek[(semainePascal - 1) % 4] };
  }
  // Temps ordinaire 2
  if (d >= ordinaire2Debut && d < ordinaire2Fin) {
    // Premier dimanche du Temps Ordinaire 1
    let premierDimancheOrd1 = new Date(ordinaire1Debut);
    premierDimancheOrd1.setDate(ordinaire1Debut.getDate() + ((7 - ordinaire1Debut.getDay()) % 7 || 7));
    // Dernier dimanche du Temps Ordinaire 1 (avant Carême)
    let dernierDimancheOrd1 = new Date(ordinaire1Fin);
    dernierDimancheOrd1.setDate(ordinaire1Fin.getDate() - ordinaire1Fin.getDay());

    // Nombre de semaines du Temps Ordinaire 1
    const semainesOrd1 = ((dernierDimancheOrd1 - premierDimancheOrd1) / (1000 * 60 * 60 * 24 * 7)) + 2;

    // Premier dimanche du Temps Ordinaire 2
    let premierDimancheOrd2 = new Date(ordinaire2Debut);
    premierDimancheOrd2.setDate(ordinaire2Debut.getDate() + 6);

    if (d < premierDimancheOrd2) {
      // Avant le premier dimanche : semaine suivante du temps ordinaire 1 (lundi-samedi)
      return { nom: "° semana del Tiempo Ordinario", numero: semainesOrd1 + 2, psalterio: romanWeek[(semainesOrd1 + 1) % 4] };
    } else {
      // À partir du premier dimanche, semaine = suite de la numérotation
      const d0 = toMinuit(d);
      const d1 = toMinuit(premierDimancheOrd2);
      const diffDays = Math.round((d0 - d1) / (1000 * 60 * 60 * 24));
      const semaine = Math.floor(diffDays / 7) + semainesOrd1 + 3;
      return { nom: "° semana del Tiempo Ordinario", numero: semaine, psalterio: romanWeek[(semaine - 1) % 4] };
    }
  }
  // Sinon, temps ordinaire (par défaut)
  return { nom: "Error al calcular el tiempo liturgico", numero: "" };
}

function toMinuit(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const editBtn = document.getElementById('editBtn');
const editFormContainer = document.getElementById('editFormContainer');
const cancelBtn = document.getElementById('cancelBtn');
const infos = document.getElementById('contenu-container')
const form = document.getElementById('inputsContainer');

// const jsonInput = document.getElementById('jsonInput');


// Quand on clique sur “Modifier”
editBtn.addEventListener('click', async () => {
  const password = prompt("🔒 Entrar clave para modificar datos :");
  if (!password) return;

  // On envoie le mot de passe à une Netlify Function pour vérification
  const res = await fetch("/.netlify/functions/check-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  if (data.valid) {
    alert("✅ Acceso autorizado");
    // Remplir le textarea avec les données du jour uniquement
    // jsonInput.value = JSON.stringify(tableau[indexCourant], null, 2);
    editFormContainer.style.display = 'block';
    editBtn.style.display = 'none';
    infos.style.display = 'none';

    // Génération dynamique
    for (const [key, value] of Object.entries(tableau[indexCourant])) {
      const label = document.createElement('label');
      label.textContent = key;
      label.className = 'detail-title'

      const input = document.createElement('input');
      input.name = key;
      input.value = value;
      input.className = 'detail-box';

      if (key === "Fechas") {
        input.readOnly = true;
        input.style.backgroundColor = "#f0f0f0";
      }
      label.appendChild(document.createElement('br'));
      label.appendChild(input);
      form.appendChild(label);
      form.appendChild(document.createElement('br'));
    }

  } else {
    alert("❌ Clave incorrecta");
  }
});

// Annuler
cancelBtn.addEventListener('click', () => {
  editFormContainer.style.display = 'none';
  editBtn.style.display = 'block';
  infos.style.display = 'block';
});

const editForm = document.getElementById('editForm');
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const newDayData = Object.fromEntries(formData.entries());

  // Mettre à jour le JSON global localement
  tableau[indexCourant] = newDayData;
  jsonData.data = tableau; // mettre à jour l’objet global
  jsonData.version = new Date().toISOString(); // mettre à jour la version
  // Envoyer à la Netlify Function
  const response = await fetch('/.netlify/functions/update-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonData })
  });

  const result = await response.json();
  if (result.success) {
    alert('Actualización exitosa !');
    editFormContainer.style.display = 'none';
  } else {
    alert('Error : ' + result.error);
  }
});
