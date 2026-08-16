// ===============================
// BrickLink API Key Loader
// ===============================
function getBLKeys() {
  return {
    consumerKey: localStorage.getItem("bl_consumer_key"),
    consumerSecret: localStorage.getItem("bl_consumer_secret"),
    token: localStorage.getItem("bl_token"),
    tokenSecret: localStorage.getItem("bl_token_secret")
  };
}

// ===============================
// OAuth 1.0a Signature Builder
// ===============================
function buildOAuthHeader(method, url) {
  const keys = getBLKeys();

  const nonce = Math.random().toString(36).substring(2);
  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    oauth_consumer_key: keys.consumerKey,
    oauth_token: keys.token,
    oauth_nonce: nonce,
    oauth_timestamp: timestamp,
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0"
  };

  const baseString = method.toUpperCase() + "&" +
    encodeURIComponent(url) + "&" +
    encodeURIComponent(
      Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join("&")
    );

  const signingKey = `${keys.consumerSecret}&${keys.tokenSecret}`;
  const signature = CryptoJS.HmacSHA1(baseString, signingKey)
    .toString(CryptoJS.enc.Base64);

  const headerParams = {
    ...params,
    oauth_signature: signature
  };

  const header = "OAuth " + Object.keys(headerParams)
    .map(k => `${k}="${headerParams[k]}"`)
    .join(", ");

  return header;
}

// ===============================
// Test BrickLink API Call
// ===============================
async function testBrickLink() {
  const url = "https://api.bricklink.com/api/store/v1/inventories";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": buildOAuthHeader("GET", url)
    }
  });

  const data = await response.json();
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}

// ===============================
// Your original lookup function
// ===============================
async function lookupPart() {
  const partNo = document.getElementById("partInput").value.trim();
  const output = document.getElementById("output");

  if (!partNo) {
    output.textContent = "Enter a part number.";
    return;
  }

  output.textContent = `Searching for part: ${partNo}`;
}
