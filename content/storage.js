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

function getPageElements(url) {
  return new Promise((resolve) => {
    chrome.storage.session.get(url, (data) => {
      resolve(data?.[url] || null);
    });
  });
}

export { getApiKeyFromStorage, getGenerationConfig, getPageElements };
