document.addEventListener("DOMContentLoaded", () => {

  // Load saved API key
  const savedKey = localStorage.getItem("rebrickable_api_key");
  if (savedKey) {
    document.getElementById("apiKeyInput").value = savedKey;
    document.getElementById("apiKeyStatus").textContent = "API key loaded.";
  }

  // Wire up buttons
  document.getElementById("saveApiKeyBtn").addEventListener("click", saveApiKey);
  document.getElementById("fetchFigBtn").addEventListener("click", fetchMinifigParts);
  document.getElementById("elementSearchBtn").addEventListener("click", fetchMinifigsByElement);
});

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

// ---------- Minifig → Parts ----------

async function fetchMinifigParts() {
  const apiKey = localStorage.getItem("rebrickable_api_key");
  const figNum = document.getElementById("figInput").value.trim();
  const output = document.getElementById("figOutput");

  if (!apiKey) return output.textContent = "No API key saved.";
  if (!figNum) return output.textContent = "Enter a minifig ID.";

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
          </tr>
        </thead>
        <tbody>
    `;

    for (const item of parts) {
      const p = item.part;
      const c = item.color;

      html += `
        <tr>
          <td><img src="${p.part_img_url}" alt=""></td>
          <td>${p.part_num}</td>
          <td>${p.name}</td>
          <td>${c.name}</td>
          <td>${item.quantity}</td>
          <td>${item.element_id || ""}</td>
        </tr>
      `;
    }

    html += `</tbody></table>`;
    output.innerHTML = html;

  } catch (err) {
    output.textContent = `Fetch error: ${err}`;
  }
}

// ---------- Element → Minifigs ----------

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
