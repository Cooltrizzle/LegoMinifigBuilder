async function lookupPart() {
  const partNo = document.getElementById("partInput").value.trim();
  const output = document.getElementById("output");

  if (!partNo) {
    output.textContent = "Enter a part number.";
    return;
  }

  output.textContent = `Searching for part: ${partNo}`;
}

async function testBrickLink() {
  const url = "https://api.bricklink.com/api/store/v1/inventories";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": buildOAuthHeader("GET", url)
    }
  });

  const data = await response.json();
  document.getElementById("output").textContent = JSON.stringify(data, null, 2);
}
