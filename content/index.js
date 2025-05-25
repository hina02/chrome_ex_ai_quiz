function getQuerySelector() {
  return new Promise((resolve) => {
    chrome.storage.local.get("querySelector", (data) => {
      resolve(data.querySelector || null);
    });
  });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getArticleText") {
    getQuerySelector().then((querySelector) => {
      const actualQuerySelector = querySelector || "article";
      let articleText = "";

      articleText = document.querySelector(actualQuerySelector)?.textContent || "";

      if (!articleText) {
        console.error("No article text found using the selector:", actualQuerySelector);
        sendResponse({ error: "No article text found." });
        return;
      }
      sendResponse({ text: articleText });
    });
    return true;
  }
});
