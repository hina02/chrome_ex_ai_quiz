chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "showResponse") {
    chrome.runtime.sendMessage({
      type: "showResponse",
      payload: message.payload,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "queryOrama") {
    const text = message.text;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "queryOrama", text },
          (response) => {
            const responseMessage =
              `「${text}」に関連する箇所が${response.hits}件見つかりました。`;
            sendResponse({ message: responseMessage });
          },
        );
      } else {
        sendResponse({ error: "アクティブなタブが見つかりません。" });
      }
    });
  }
  return true;
});
