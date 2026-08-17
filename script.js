// =========================
// GLOBAL DATA STRUCTURES
// =========================

let translator = {};
let minfigs = {};


// =========================
// LOAD CSV: MINFIGS
// =========================

function loadMinfigsCSV(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = reader.result.split("\n").slice(1); // skip header
    for (const row of rows) {
      if (!row.trim()) continue;
      const cols = row.split(",");
      const id = cols[0];
      const name = cols[1];
      const num_parts = cols[2];
      const img_url = cols[3];
      minfigs[id] = { name, img_url, num_parts };
    }
    console.log("Minifigs loaded:", minfigs);
  };
  reader.readAsText(file);
}


// =========================
// LOAD CSV: TRANSLATOR
// =========================

function loadTranslatorCSV(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = reader.result.split("\n").slice(1); // skip header
    for (const row of rows) {
      if (!row.trim()) continue;
      const cols = row.split(",");
      const id = cols[0];
      const name = cols[1];
      const img_url = cols[2];
      const num_parts = cols[3];
      const bricklink_id = cols[4];
      translator[id] = { name, img_url, num_parts, bricklink_id };
    }
    console.log("Translator loaded:", translator);
  };
  reader.readAsText(file);
}


// =========================
// PAGE LOAD
// =========================

document.addEventListener("DOMContentLoaded", () => {

  // Load saved API key
  const savedKey = localStorage.getItem("rebrickable_api_key");
  if (savedKey) {
    document.getElementById("apiKeyInput").value = savedKey;
    document.getElementById("apiKeyStatus").textContent = "API key loaded.";
  }

  // Buttons
  document.getElementById("saveApiKeyBtn").addEventListener("click", saveApiKey);
  document.getElementById("fetchFigBtn").addEventListener("click", fetchMinifigSearch);
  document.getElementById("elementSearchBtn").addEventListener("click", fetchMinifigsByElement);

  // CSV loaders
  document.getElementById("loadTranslatorBtn").addEventListener("click", () => {
    const file = document.getElementById("translatorFile").files[0];
    if (file) loadTranslatorCSV(file);
  });

  document.getElementById("loadMinfigsBtn").addEventListener("click", () => {
    const file = document.getElementById("minfigsFile").files[0];
    if (file) loadMinfigsCSV(file);
  });

});


// =========================
// SAVE API KEY
// =========================

function saveApiKey() {
  const key = document.getElementById("apiKeyInput").value.trim();
  const status = document.getElementById("apiKeyStatus");

  if (!key) {
    status.textContent = "Please enter an API key.";
    return;
  }

  localStorage.setItem("rebrickable_api_key", key);
  status.textContent = "API key saved.";
}


// =========================
// MINIFIG SEARCH
// =========================

async function fetchMinifigSearch() {
  const apiKey = localStorage.getItem("rebrickable_api_key");
  const figNum = document.getElementById("figInput").value.trim();
  const output = document.getElementById("figOutput");
  const summary = document.getElementById("figSummary");

  if (!apiKey) return output.textContent = "No API key saved.";
  if (!figNum) return output.textContent = "Enter a minifig ID.";

  // =========================
  // USE TRANSLATOR.CSV DATA
  // =========================

  const t = translator[figNum];

  const figName = t?.name || "Unknown Minifig";
  const figImg = t?.img_url || "";
  const bricklinkFigID = t?.bricklink_id || "Not Assigned";
  const numParts = t?.num_parts || "";

  // =========================
  // SUMMARY BOX
  // =========================

  summary.innerHTML = `
    <div class="fig-summary-box">
      <img src="${figImg}" alt="${figName}" class="fig-summary-img">
      <div class="fig-summary-text">
        <h2>${figName}</h2>
        <p><strong>BrickLink ID:</strong> ${bricklinkFigID}</p>
        <p><strong>Rebrickable ID:</strong> ${figNum}</p>
        <p><strong>Number of Parts:</strong> ${numParts}</p>
      </div>
    </div>
  `;

  // =========================
  // FETCH PARTS FROM API
  // =========================

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


// =========================
// ELEMENT → MINIFIGS
// =========================

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
