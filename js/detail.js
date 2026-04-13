const params = new URLSearchParams(window.location.search);
const dateParam = params.get("date");
let [, , year] = dateParam.split("-").map(x => parseInt(x, 10));
const today = new Date();
const romanWeek = ["I", "II", "III", "IV"];

const joursSemaine = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const moisNoms = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let jsonData = {};
let tableau = [];
let indexCourant = -1;
let indexAff = null;
let itemAff = null;

// ===== Couleurs liturgiques =====
const colorMap = {
  "blanco": "#ffffff",
  "rojo": "#c0392b",
  "violet": "#7d3c98",
  "violeta": "#7d3c98",
  "morado": "#7d3c98",
  "verde": "#1e8449",
  "negro": "#1a1a1a",
  "rosa": "#d4609a",
};

function getColorHex(colorStr) {
  if (!colorStr) return null;
  const key = colorStr.trim().toLowerCase();
  if (key.includes("del tiempo")) return null; // calculé selon le temps
  for (const [k, v] of Object.entries(colorMap)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function getTempsColor(tempsNom) {
  const n = (tempsNom || "").toLowerCase();
  if (n.includes("adviento") || n.includes("cuaresma") || n.includes("ceniza") || n.includes("semana santa")) return "#7d3c98";
  if (n.includes("navidad") || n.includes("pascua") || n.includes("pascal") || n.includes("pentecost") || n.includes("octava")) return "#ffffff";
  return "#2e7d45"; // Temps ordinaire = vert
}

// ===== Rang de célébration =====
const celebRangs = { "solemnidad": 4, "fiesta": 3, "memoria": 2, "de la feria": 1 };

function getCelebRang(celStr) {
  if (!celStr) return 0;
  const key = celStr.trim().toLowerCase();
  for (const [k, v] of Object.entries(celebRangs)) {
    if (key.includes(k)) return v;
  }
  return 1;
}

// ===== Badge célébration =====
const celebStyles = {
  "solemnidad": { bg: "#1a1a1a", color: "#FFD100" },
  "fiesta": { bg: "#0d3a6e", color: "#cce0ff" },
  "memoria": { bg: "#0d4a26", color: "#b8f0d0" },
  "de la feria": { bg: "#e4e0d4", color: "#555544" },
  "semana santa": { bg: "#4a1010", color: "#ffd4d4" },
  "triduum": { bg: "#4a1010", color: "#ffd4d4" },
  "cuaresma": { bg: "#3d1a5c", color: "#e8d4ff" },
  "l'avent": { bg: "#3d1a5c", color: "#e8d4ff" },
  "navidad": { bg: "#7a5200", color: "#fff3cc" },
  "tiempo pascual": { bg: "#0a4a2a", color: "#c0ffd8" },
};

function getCelebStyle(celStr) {
  if (!celStr) return null;
  const key = celStr.trim().toLowerCase();
  for (const [k, v] of Object.entries(celebStyles)) {
    if (key.includes(k)) return { ...v, label: celStr.trim() };
  }
  return { bg: "#e4e0d4", color: "#555544", label: celStr.trim() };
}

// ===== Données temps liturgique depuis le JSON =====
function getTempsDataKey(temps, mois, jour, annee) {
  const n = temps.nom ? temps.nom.toLowerCase() : "";
  if (n.includes("adviento")) {
    if (mois === 12 && jour === 24) return "Tiempo de Adviento dia 24";
    if (mois === 12 && jour >= 17 && jour <= 23) return "Tiempo de Adviento del dia 17 hasta el 23";
    return "Tiempo de Adviento hasta el dia 16";
  }
  if (n.includes("navidad")) {
    const dEp = new Date(annee, 0, 2);
    dEp.setDate(dEp.getDate() + ((7 - dEp.getDay()) % 7));
    return new Date(annee, mois - 1, jour) > dEp ? "Semana después de la Epifania" : "Tiempo de Navidad hasta la Epifania";
  }
  if (n.includes("cuaresma")) return "Tiempo Cuaresmal";
  if (n.includes("octava de pascua")) return "Octava de Pascua";
  if (n.includes("pascual")) return "Tiempo Pascual";
  return null;
}

// ===== Chargement =====
fetch("/.netlify/functions/get-json")
  .then(res => res.json())
  .then(data => {
    jsonData = data;
    tableau = jsonData.data;
    indexCourant = tableau.findIndex(item => item.Fechas === dateParam.slice(0, 5));
    afficherTousLesJours(indexCourant);

    document.getElementById("prev").onclick = () => {
      if (indexCourant === 60 && !isLeap(year)) indexCourant = 58;
      else if (indexCourant > 0) indexCourant--;
      else { indexCourant = 365; year--; }
      afficherTousLesJours(indexCourant);
    };
    document.getElementById("next").onclick = () => {
      if (indexCourant === 58 && !isLeap(year)) indexCourant = 60;
      else if (indexCourant < 365) indexCourant++;
      else { indexCourant = 0; year++; }
      afficherTousLesJours(indexCourant);
    };
  });

function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

// ===== Affichage principal =====
function afficherJour(index, annee, cibleID) {
  let item = tableau[index];
  if (!item) return;
  const [mois, jour] = item.Fechas.split("-").map(x => parseInt(x, 10));

  const fetesMobiles = getFetesMobiles(annee);
  const feteDuJour = fetesMobiles.find(f => mois === f.date.month && jour === f.date.day);
  if (feteDuJour) {
    const fi = tableau.find(o => o["Misericordia chile"] === feteDuJour.nom);
    if (fi) item = fi;
  }

  if (cibleID === "contenu-current") {
    const dateObj = new Date(annee, mois - 1, jour);
    document.getElementById("dateLongue").textContent = `${joursSemaine[dateObj.getDay()]} ${jour} de ${moisNoms[mois - 1]}`;
    history.replaceState(null, "", `?date=${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}-${year}`);
    document.getElementById("back").onclick = () => { window.location.href = `index.html?mois=${mois}-${year}`; };
  }

  const temps = getTempsLiturgique(annee, mois, jour);
  const rang = getCelebRang(item["Celebración"]);

  // Octava de Pascua : jours 2-7 (pas le Domingo de Resurrección)
  const enOctava = temps.nom && temps.nom.toLowerCase().includes("octava de pascua")
    && !(feteDuJour && feteDuJour.nom === "Domingo de Resurrección");

  // Résoudre l'item effectivement affiché (pour l'édition)
  let itemEffectif = item;
  if (enOctava) {
    const octData = tableau.find(o => o["Misericordia chile"] === "Octava de Pascua");
    if (octData) itemEffectif = octData;
  } else {
    const brev = item["En el Breviario Castellano"] || "";
    if (!brev || brev.trim().toLowerCase().replace(/\s/g, '') === "delordinario") {
      const key = getTempsDataKey(temps, mois, jour, annee);
      const td = key ? tableau.find(o => o["Misericordia chile"] === key) : null;
      if (td) itemEffectif = td;
    }
  }

  if (cibleID === "contenu-current") {
    itemAff = itemEffectif;
    indexAff = tableau.findIndex(i => i === itemAff);
  }

  // Couleur : celle de la fête si rang > 1 et couleur explicite, sinon couleur du temps
  let rawColor = rang > 1 ? getColorHex(item["Color"]) : null;
  const colorHex = rawColor || getTempsColor(temps.nom);
  const isWhite = colorHex === "#ffffff";

  // Breviario
  let breviario = item["En el Breviario Castellano"] || "";
  if (enOctava) {
    breviario = itemEffectif["En el Breviario Castellano"] || "";
  } else if (!breviario || breviario.trim().toLowerCase().replace(/\s/g, '') === "delordinario") {
    if (itemEffectif !== item) breviario = itemEffectif["En el Breviario Castellano"] || "";
  }

  // Ayuno : afficher uniquement si pas de jeûne
  const ayunoNo = itemEffectif["Ayuno"] && itemEffectif["Ayuno"].trim() === "No";

  // Badge célébration
  const celStyle = enOctava
    ? { bg: "#1a1a1a", color: "#FFD100", label: "Solemnidad" }
    : getCelebStyle(item["Celebración"]);

  // Nom affiché
  const dateObjNom = new Date(annee, mois - 1, jour);
  const nomAffiche = enOctava
    ? `${joursSemaine[dateObjNom.getDay()]} de la Octava de Pascua`
    : (item["Misericordia chile"] || '');

  document.getElementById(cibleID).innerHTML = `
    <div class="detail-container">

      <div class="top-row">
        <div class="temps-label">
          <span>${temps.numero}</span>${temps.nom}
          <span class="psalterio-pill">${temps.psalterio}</span>
        </div>
        <div class="color-dot" style="background:${colorHex};${isWhite ? 'border:2.5px solid #bbb;' : ''}"></div>
      </div>

      <div class="saint-card">
        <div class="saint-header">
          ${celStyle ? `<span class="cel-badge" style="background:${celStyle.bg};color:${celStyle.color}">${celStyle.label}</span>` : ''}
          ${ayunoNo ? `<span class="ayuno-badge ayuno-no">Sin ayuno</span>` : ''}
        </div>
        <div class="saint-name">${nomAffiche}</div>
      </div>

      ${breviario ? `
      <div class="info-card">
        <div class="info-card-label">Breviario</div>
        <div class="info-card-text">${breviario}</div>
      </div>` : ''}

    </div>`;

  const todayBtn = document.getElementById("today");
  todayBtn.style.display = (mois === today.getMonth() + 1 && jour === today.getDate()) ? "none" : "block";
}

function afficherTousLesJours(index) {
  afficherJour(index, year, "contenu-current");
  if (index === 0) afficherJour(365, year - 1, "contenu-prev");
  else afficherJour(index - 1, year, "contenu-prev");
  if (index === 365) afficherJour(0, year + 1, "contenu-next");
  else afficherJour(index + 1, year, "contenu-next");
}

document.getElementById('contenu-slider').style.transform = 'translateX(-100vw)';

document.getElementById("today").onclick = () => {
  const m = today.getMonth() + 1, d = today.getDate();
  indexCourant = tableau.findIndex(i => i.Fechas === m.toString().padStart(2, '0') + '-' + d.toString().padStart(2, '0'));
  afficherTousLesJours(indexCourant);
};

// ===== Swipe =====
const calSlider = document.getElementById("contenu-slider");
let startX = 0, deltaX = 0, isSwiping = false;
calSlider.addEventListener("touchstart", e => { startX = e.touches[0].clientX; isSwiping = true; calSlider.style.transition = "none"; });
calSlider.addEventListener("touchmove", e => { if (!isSwiping) return; deltaX = e.touches[0].clientX - startX; calSlider.style.transform = `translateX(calc(-100vw + ${deltaX}px))`; });
calSlider.addEventListener("touchend", () => {
  if (!isSwiping) return; isSwiping = false;
  if (Math.abs(deltaX) > 70) {
    if (deltaX < 0) { calSlider.style.transition = "transform 0.3s ease"; calSlider.style.transform = "translateX(-200vw)"; setTimeout(() => { document.getElementById("next").click(); calSlider.style.transition = "none"; calSlider.style.transform = "translateX(-100vw)"; }, 300); }
    else { calSlider.style.transition = "transform 0.3s ease"; calSlider.style.transform = "translateX(0vw)"; setTimeout(() => { document.getElementById("prev").click(); calSlider.style.transition = "none"; calSlider.style.transform = "translateX(-100vw)"; }, 300); }
  } else { calSlider.style.transition = "transform 0.3s ease"; calSlider.style.transform = "translateX(-100vw)"; }
  deltaX = 0;
});

// ===== Calculs liturgiques (identiques à l'original) =====
function datePaques(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return { month: Math.floor((h + l - 7 * m + 114) / 31), day: ((h + l - 7 * m + 114) % 31) + 1 };
}
function addDaysToDate(month, day, year, offset) {
  const dt = new Date(year, month - 1, day); dt.setDate(dt.getDate() + offset); return { month: dt.getMonth() + 1, day: dt.getDate() };
}
function getFetesMobiles(year) {
  const p = datePaques(year);
  let dSF = new Date(year, 11, 26); dSF.setDate(dSF.getDate() + ((7 - dSF.getDay()) % 7));
  if (new Date(year, 11, 25).getDay() === 0) dSF = new Date(year, 11, 30);
  let dEp = new Date(year, 0, 2); dEp.setDate(dEp.getDate() + ((7 - dEp.getDay()) % 7));
  let dBap = new Date(dEp); dBap.setDate(dBap.getDate() + 7);
  if (dEp.getDate() >= 7) dBap.setDate(dEp.getDate() + 1);
  return [
    { nom: "Miércoles de Ceniza", date: addDaysToDate(p.month, p.day, year, -46) },
    { nom: "Santa Maria junto a la Cruz", date: addDaysToDate(p.month, p.day, year, -9) },
    { nom: "Domingo de Ramos", date: addDaysToDate(p.month, p.day, year, -7) },
    { nom: "Lunes Santo", date: addDaysToDate(p.month, p.day, year, -6) },
    { nom: "Martes Santo", date: addDaysToDate(p.month, p.day, year, -5) },
    { nom: "Miércoles Santo", date: addDaysToDate(p.month, p.day, year, -4) },
    { nom: "Jueves Santo", date: addDaysToDate(p.month, p.day, year, -3) },
    { nom: "Viernes Santo", date: addDaysToDate(p.month, p.day, year, -2) },
    { nom: "Sábado Santo", date: addDaysToDate(p.month, p.day, year, -1) },
    { nom: "Domingo de Resurrección", date: addDaysToDate(p.month, p.day, year, 0) },
    { nom: "Divina Misericordia", date: addDaysToDate(p.month, p.day, year, 7) },
    { nom: "Ascensión del Señor", date: addDaysToDate(p.month, p.day, year, 39) },
    { nom: "Pentecostés", date: addDaysToDate(p.month, p.day, year, 49) },
    { nom: "Santa Maria, Madre de la Iglesia", date: addDaysToDate(p.month, p.day, year, 50) },
    { nom: "Jesucristo, sumo y eterno sacerdote", date: addDaysToDate(p.month, p.day, year, 53) },
    { nom: "La Santisima Trinidad", date: addDaysToDate(p.month, p.day, year, 56) },
    { nom: "Corpus Christi", date: addDaysToDate(p.month, p.day, year, 60) },
    { nom: "Sagrado Corazón de Jesús", date: addDaysToDate(p.month, p.day, year, 61) },
    { nom: "Corazón Inmaculado de María", date: addDaysToDate(p.month, p.day, year, 62) },
    { nom: "Cristo-Rey", date: calculateCristoRey(year) },
    { nom: "Sagrada Familia", date: { month: dSF.getMonth() + 1, day: dSF.getDate() } },
    { nom: "Epifania del Señor", date: { month: dEp.getMonth() + 1, day: dEp.getDate() } },
    { nom: "Bautismo de Jesús", date: { month: dBap.getMonth() + 1, day: dBap.getDate() } }
  ];
}
function calculateCristoRey(year) {
  const xmas = new Date(year, 11, 25); let adv = new Date(xmas); adv.setDate(xmas.getDate() - 28); adv.setDate(adv.getDate() + (0 - adv.getDay() + 7) % 7);
  const cr = new Date(adv); cr.setDate(adv.getDate() - 7); return { month: cr.getMonth() + 1, day: cr.getDate() };
}
function getTempsLiturgique(year, mois, jour) {
  const p = datePaques(year);
  const carD = addDaysToDate(p.month, p.day, year, -46); const dCar = new Date(year, carD.month - 1, carD.day);
  let pDimCar = new Date(dCar); pDimCar.setDate(dCar.getDate() + ((7 - dCar.getDay()) % 7));
  const sSD = addDaysToDate(p.month, p.day, year, -7); const dSSDebut = new Date(year, sSD.month - 1, sSD.day);
  const dPaques = new Date(year, p.month - 1, p.day);
  const pent = addDaysToDate(p.month, p.day, year, 49); const dPent = new Date(year, pent.month - 1, pent.day);
  const octP = addDaysToDate(p.month, p.day, year, 7); const dOctP = new Date(year, octP.month - 1, octP.day);
  const dNoel = new Date(year, 11, 25);
  let dEp = new Date(year, 0, 2); dEp.setDate(dEp.getDate() + ((7 - dEp.getDay()) % 7));
  let dBap = new Date(dEp); dBap.setDate(dBap.getDate() + 7); if (dEp.getDate() >= 7) dBap.setDate(dEp.getDate() + 1);
  let pDA = new Date(dNoel); pDA.setDate(dNoel.getDate() - ((dNoel.getDay() === 0 ? 0 : dNoel.getDay()) + 21));
  let o1D = new Date(dBap); o1D.setDate(dBap.getDate() + 1);
  let o1F = new Date(dCar); o1F.setDate(dCar.getDate() - 1);
  let o2D = new Date(dPent); o2D.setDate(dPent.getDate() + 1);
  let o2F = new Date(pDA);
  const d = new Date(year, mois - 1, jour);

  if (d >= pDA && d < dNoel) { const dif = Math.floor((d - pDA) / 864e5), s = Math.floor(dif / 7) + 1; return { nom: "° semana del Adviento", numero: Math.max(1, s), psalterio: romanWeek[s - 1] }; }
  if (d >= dNoel || d <= dBap) { const dif = Math.floor((d - pDA) / 864e5); return { nom: "Navidad", numero: "", psalterio: romanWeek[Math.floor(dif / 7) % 4] }; }
  if (d >= o1D && d <= o1F) { let pDO = new Date(o1D); pDO.setDate(o1D.getDate() + (7 - o1D.getDay()) % 7); if (d < pDO) return { nom: "° semana del Tiempo Ordinario", numero: 1, psalterio: "I" }; const dif = Math.floor((d - pDO) / 864e5), s = Math.floor(dif / 7) + 2; return { nom: "° semana del Tiempo Ordinario", numero: s, psalterio: romanWeek[(s - 1) % 4] }; }
  if (d >= dCar && d < pDimCar) { return { nom: " de Cenizas", numero: joursSemaine[d.getDay()], psalterio: romanWeek[3] }; }
  if (d >= pDimCar && d < dSSDebut) { const dif = Math.floor((d - pDimCar) / 864e5), s = Math.floor(dif / 7) + 1; return { nom: "° semana de Cuaresma", numero: Math.max(1, s), psalterio: romanWeek[(s - 1) % 4] }; }
  if (d >= dSSDebut && d < dPaques) { const dif = Math.floor((d - pDimCar) / 864e5), s = Math.floor(dif / 7) + 1; return { nom: "Semana Santa", numero: "", psalterio: romanWeek[(s - 1) % 4] }; }
  if (d >= dPaques && d <= dOctP) { const dif = Math.floor((d - dPaques) / 864e5), s = Math.floor(dif / 7) + 1; return { nom: "Octava de Pascua", numero: "", psalterio: romanWeek[(s - 1) % 4] }; }
  if (d > dOctP && d <= dPent) { const dif = Math.floor((d - dPaques) / 864e5), s = Math.floor(dif / 7) + 1; return { nom: "° semana del Tiempo Pascual", numero: Math.max(1, s), psalterio: romanWeek[(s - 1) % 4] }; }
  if (d >= o2D && d < o2F) {
    let pDO1 = new Date(o1D); pDO1.setDate(o1D.getDate() + ((7 - o1D.getDay()) % 7 || 7));
    let uDO1 = new Date(o1F); uDO1.setDate(o1F.getDate() - o1F.getDay());
    const sO1 = ((uDO1 - pDO1) / 864e5 / 7) + 2;
    let pDO2 = new Date(o2D); pDO2.setDate(o2D.getDate() + 6);
    if (d < pDO2) return { nom: "° semana del Tiempo Ordinario", numero: sO1 + 2, psalterio: romanWeek[(sO1 + 1) % 4] };
    const dif = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(pDO2.getFullYear(), pDO2.getMonth(), pDO2.getDate())) / 864e5);
    const s = Math.floor(dif / 7) + sO1 + 3; return { nom: "° semana del Tiempo Ordinario", numero: s, psalterio: romanWeek[(s - 1) % 4] };
  }
  return { nom: "Tiempo Ordinario", numero: "", psalterio: "I" };
}

// ===== Edition =====
const editBtn = document.getElementById('editBtn'), editFormContainer = document.getElementById('editFormContainer'), cancelBtn = document.getElementById('cancelBtn'), infos = document.getElementById('contenu-container'), form = document.getElementById('inputsContainer');
function showToast(msg, { duration = 2000, background = "green", gravity = "bottom", borderRadius = "70px", position = "center", padding = "10px 50px" } = {}) { Toastify({ text: msg, duration, gravity, position, style: { background, borderRadius, padding } }).showToast(); }
editBtn.addEventListener('click', async () => {
  const pw = prompt("🔒 Entrar clave para modificar datos :"); if (!pw) return;
  const res = await fetch("/.netlify/functions/check-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
  const data = await res.json();
  if (data.valid) {
    showToast("✅ Acceso autorizado"); editFormContainer.style.display = 'block'; editBtn.style.display = 'none'; infos.style.display = 'none';
    for (const [key, value] of Object.entries(itemAff)) { const lbl = document.createElement('label'); lbl.textContent = key; lbl.className = 'detail-title'; const inp = document.createElement('textarea'); inp.rows = 1; inp.name = key; inp.value = value; inp.className = 'detail-box'; if (key === "Fechas") { inp.readOnly = true; inp.style.backgroundColor = "#c1c1c1"; } lbl.appendChild(document.createElement('br')); lbl.appendChild(inp); form.appendChild(lbl); form.appendChild(document.createElement('br')); inp.style.height = inp.scrollHeight + "px"; }
  } else { showToast("❌ Clave incorrecta", { background: "red" }); }
});
cancelBtn.addEventListener('click', () => { form.innerHTML = ''; editFormContainer.style.display = 'none'; editBtn.style.display = 'block'; infos.style.display = 'block'; });
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault(); const nd = Object.fromEntries(new FormData(document.getElementById('editForm')).entries());
  tableau[indexAff] = nd; jsonData.data = tableau; jsonData.version = new Date().toISOString();
  const r = await fetch('/.netlify/functions/update-json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonData }) });
  const res = await r.json(); if (res.success) showToast('Actualización exitosa !'); else showToast('Error : ' + res.error, { background: 'red' });
  editFormContainer.style.display = 'none'; editBtn.style.display = 'block'; infos.style.display = 'block'; form.innerHTML = '';
});
