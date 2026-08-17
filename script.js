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

    // Show raw results for now
    output.textContent = JSON.stringify(data.results, null, 2);
  } catch (err) {
    output.textContent = `Fetch error: ${err}`;
  }
}
