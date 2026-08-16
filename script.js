async function lookupPart() {
  const partNo = document.getElementById("partInput").value.trim();
  const output = document.getElementById("output");

  if (!partNo) {
    output.textContent = "Enter a part number.";
    return;
  }

  output.textContent = `Searching for part: ${partNo}`;
}
