// chrome.storage
function getApiKeyFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get("apiKey", (data) => {
      resolve(data.apiKey || null);
    });
  });
}

function getGenerationConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get("generationConfig", (data) => {
      resolve(data.generationConfig || null);
    });
  });
}

export { getApiKeyFromStorage, getGenerationConfig };
