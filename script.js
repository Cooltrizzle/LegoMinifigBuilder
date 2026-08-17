// script.js

// Load saved key on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedKey = localStorage.getItem("rebrickable_api_key");
  if (savedKey) {
    document.getElementById("apiKeyInput").value = savedKey;
  }

  document.getElementById("saveApiKeyBtn").addEventListener("click", saveApiKey);
  document.getElementById("fetchBtn").addEventListener("click", fetchMinifigParts);
});

function saveApiKey() {
  const key = document.getElementById("apiKeyInput").value.trim();
  if (!key) {
    alert("Please enter an API key.");
    return;
  }
  localStorage.setItem("rebrickable_api_key", key);
  alert("API key saved in this browser.");
}
async function fetchMinifigParts() {
  const apiKey = localStorage.getItem("rebrickable_api_key");
  const figNum = document.getElementById("figInput").value.trim();
  const output = document.getElementById("output");

  if (!apiKey) {
    output.textContent = "No API key saved.";
    return;
  }
  if (!figNum) {
    output.textContent = "Please enter a minifig ID (e.g. fig-000001).";
    return;
  }

  const url = `https://rebrickable.com/api/v3/lego/minifigs/${figNum}/parts/?key=${apiKey}`;

  try {
    output.textContent = "Loading...";
    const res = await fetch(url);
    if (!res.ok) {
      output.textContent = `Error: ${res.status} ${res.statusText}`;
      return;
    }
    const data = await res.json();
    const parts = data.results;

    // Build readable table
    let html = `
      <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
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
          <td><img src="${p.part_img_url}" style="height:50px;"></td>
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

}
