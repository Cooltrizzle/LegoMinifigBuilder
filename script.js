// ======================================================
//  GLOBAL DATA STRUCTURES
// ======================================================

let translator = {};   // Holds merged translator data (including BrickLink IDs)
let minifigs = {};      // Holds raw minifigs.csv data


//=======================================================
// CSV PARSER
//=======================================================
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && insideQuotes) {
      // Look ahead: escaped quote?
      if (line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        insideQuotes = false;
      }
    } else if (char === '"' && !insideQuotes) {
      insideQuotes = true;
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

//======================================
// BRICKLINK UPDATE ID FUNCTION
//======================================
function addBricklinkID(figNum) {
  const input = document.getElementById("blInput");
  const newID = input.value.trim();

  if (!newID) {
    alert("Please enter a BrickLink ID.");
    return;
  }

  translator[figNum].bricklink_id = newID;

  // Refresh summary box
  fetchMinifigSearch();
}

// ======================================================
//  CSV LOADERS
// ======================================================

// ---------- Load minifigs.csv ----------
function loadMinifigsText(text) {
  const rows = text.split("\n").slice(1);
  for (const row of rows) {
    if (!row.trim()) continue;
    const cols = parseCSVLine(row);
    const id = cols[0];
    const name = cols[1];
    const num_parts = cols[2];
    const img_url = cols[3];
    minifigs[id] = { name, img_url, num_parts };
  }
  console.log("Minifigs loaded:", minifigs);
}

// ---------- Load translator.csv ----------
function loadTranslatorText(text) {
  const rows = text.split("\n").slice(1);
  for (const row of rows) {
    if (!row.trim()) continue;
    const cols = parseCSVLine(row);
    const id = cols[0];
    const name = cols[1];
    const img_url = cols[2];
    const num_parts = cols[3];
    const bricklink_id = cols[4];
    translator[id] = { name, img_url, num_parts, bricklink_id };
  }
  console.log("Translator loaded:", translator);
}

// ======================================================
//  SYNC: MERGE MINiFIGS INTO TRANSLATOR
// ======================================================

function syncTranslatorWithMinifigs() {
  for (const id in minifigs) {
    if (!translator[id]) {
      // Add missing entry from minifigs.csv
      translator[id] = {
        name: minifigs[id].name,
        img_url: minifigs[id].img_url,
        num_parts: minifigs[id].num_parts,
        bricklink_id: ""   // blank until manually filled
      };
    }
  }
  console.log("Translator synced:", translator);
}


// ======================================================
//  API KEY SECTION (COLLAPSIBLE)
// ======================================================

// ---------- Toggle API key visibility ----------
function toggleApiSection() {
  const sec = document.getElementById("apiSection");
  sec.style.display = sec.style.display === "none" ? "block" : "none";
}

// ---------- Save API key ----------
function saveApiKey() {
  const key = document.getElementById("apiKeyInput").value.trim();
  const status = document.getElementById("apiKeyStatus");
  const tick = document.getElementById("apiKeyTick");

  if (!key) {
    status.textContent = "Please enter an API key.";
    return;
  }

  localStorage.setItem("rebrickable_api_key", key);

  status.innerHTML = `<span style="color:green;">✔</span> Key saved`;
  tick.innerHTML = `<span style="color:green;">✔</span>`;
}


// ======================================================
//  EXPORT UPDATED TRANSLATOR.CSV
// ======================================================

function downloadTranslatorCSV() {
  let csv = "rebrickable_id,name,img_url,num_parts,bricklink_id\n";

  for (const id in translator) {
    const t = translator[id];

    const row = [
      id,
      t.name,
      t.img_url,
      t.num_parts,
      t.bricklink_id
    ].map(v => `"${v}"`).join(",");

    csv += row + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "translator.csv";
  a.click();

  URL.revokeObjectURL(url);
}



// ======================================================
//  PAGE LOAD INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------- API key status ----------
const savedKey = localStorage.getItem("rebrickable_api_key");
const status = document.getElementById("apiKeyStatus");
const tick = document.getElementById("apiKeyTick");

if (savedKey) {
  status.innerHTML = `<span style="color:green;">✔</span> Key already loaded`;
  tick.innerHTML = `<span style="color:green;">✔</span>`;
} else {
  status.textContent = "No key saved";
  tick.textContent = "";
}

  // ---------- Wire up buttons ----------
  document.getElementById("saveApiKeyBtn").addEventListener("click", saveApiKey);
  document.getElementById("fetchFigBtn").addEventListener("click", fetchMinifigSearch);
  document.getElementById("elementSearchBtn").addEventListener("click", fetchMinifigsByElement);
  document.getElementById("updateTranslatorBtn").addEventListener("click", downloadTranslatorCSV);

  // ---------- AUTO LOAD CSV FILES ----------
  Promise.all([
    fetch("data/minifigs.csv").then(r => r.text()),
    fetch("data/translator.csv").then(r => r.text())
  ])
  .then(([minifigsText, translatorText]) => {
    loadMinifigsText(minifigsText);
    loadTranslatorText(translatorText);
    syncTranslatorWithMinifigs();   // merge missing figs
  })
  .catch(err => console.error("CSV load error:", err));
});


// ======================================================
//  MINIFIG SEARCH
// ======================================================

async function fetchMinifigSearch() {
  const apiKey = localStorage.getItem("rebrickable_api_key");
  const figNum = document.getElementById("figInput").value.trim();
  const output = document.getElementById("figOutput");
  const summary = document.getElementById("figSummary");

  if (!apiKey) return output.textContent = "No API key saved.";
  if (!figNum) return output.textContent = "Enter a minifig ID.";

  // ---------- Lookup from translator ----------
  const t = translator[figNum];

  const figName = t?.name || "Unknown Minifig";
  const figImg = t?.img_url || "";
  const bricklinkFigID = t?.bricklink_id || "";
  const numParts = t?.num_parts || "";

// =========================
// SUMMARY BOX (with BL ID editor)
// =========================

let bricklinkField;

if (!bricklinkFigID || bricklinkFigID.trim() === "") {
  bricklinkField = `
    <input type="text" id="blInput" placeholder="Enter BrickLink ID" style="width:120px;">
    <button onclick="addBricklinkID('${figNum}')">Add</button>
  `;
} else {
  bricklinkField = `
    <a href="https://www.bricklink.com/v2/catalog/catalogitem.page?M=${bricklinkFigID}" 
       target="_blank">
      ${bricklinkFigID}
    </a>
  `;
}



summary.innerHTML = `
  <div class="fig-summary-box">
    <img src="${figImg}" alt="${figName}" class="fig-summary-img">
    <div class="fig-summary-text">
      <h2>${figName}</h2>
      <p><strong>BrickLink ID:</strong> ${bricklinkField}</p>
      <p><strong>Rebrickable ID:</strong> 
        <a href="https://rebrickable.com/minifigs/${figNum}/" target="_blank">
          ${figNum}
        </a>
      </p>
      <p><strong>Number of Parts:</strong> ${numParts}</p>
    </div>
  </div>
`;

  // ---------- Fetch parts from Rebrickable ----------
  const url = `https://rebrickable.com/api/v3/lego/minifigs/${figNum}/parts/?key=${apiKey}`;

  try {
    output.textContent = "Loading...";
    const res = await fetch(url);
    if (!res.ok) return output.textContent = `Error: ${res.status}`;

    const data = await res.json();
    const parts = data.results;

    if (!parts.length) return output.textContent = "No parts found.";

    let html = `
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Part Number</th>
            <th>Name</th>
            <th>Colour</th>
            <th>Qty</th>
            <th>Element ID</th>
            <th>BrickLink Part</th>
            <th>BrickLink Colour</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const item of parts) {
      const p = item.part;
      const c = item.color;

      let blPart = "";
      if (p.external_ids && p.external_ids.BrickLink) {
        blPart = p.external_ids.BrickLink.join(", ");
      }

      let blColorId = "";
      let blColorName = "";
      if (c.external_ids && c.external_ids.BrickLink) {
        blColorId = c.external_ids.BrickLink.ext_ids[0];
        blColorName = c.external_ids.BrickLink.ext_descrs[0][0];
      }

      html += `
        <tr>
          <td><img src="${p.part_img_url}" alt=""></td>
          <td>${p.part_num}</td>
          <td>${p.name}</td>
          <td>${c.name}</td>
          <td>${item.quantity}</td>
          <td>${item.element_id || ""}</td>
          <td>${blPart}</td>
          <td>${blColorId} (${blColorName})</td>
        </tr>
      `;
    }

    html += `</tbody></table>`;
    output.innerHTML = html;

  } catch (err) {
    output.textContent = `Fetch error: ${err}`;
  }
}


// ======================================================
//  ELEMENT → MINIFIGS SEARCH
// ======================================================

async function fetchMinifigsByElement() {
  const apiKey = localStorage.getItem("rebrickable_api_key");
  const elementId = document.getElementById("elementInput").value.trim();
  const output = document.getElementById("elementOutput");

  if (!apiKey) return output.textContent = "No API key saved.";
  if (!elementId) return output.textContent = "Enter an element ID.";

  const url = `https://rebrickable.com/api/v3/lego/elements/${elementId}/minifigs/?key=${apiKey}`;

  try {
    output.textContent = "Loading...";
    const res = await fetch(url);
    if (!res.ok) return output.textContent = `Error: ${res.status}`;

    const data = await res.json();
    const figs = data.results;

    if (!figs.length) return output.textContent = "No minifigs use this element.";

    let html = `
      <table>
        <thead>
          <tr>
            <th>Minifig ID</th>
            <th>Name</th>
            <th>Num Parts</th>
            <th>Set</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const f of figs) {
      html += `
        <tr>
          <td>${f.fig_num}</td>
          <td>${f.name}</td>
          <td>${f.num_parts}</td>
          <td>${f.set_num} — ${f.set_name}</td>
        </tr>
      `;
    }

    html += `</tbody></table>`;
    output.innerHTML = html;

  } catch (err) {
    output.textContent = `Fetch error: ${err}`;
  }
}
