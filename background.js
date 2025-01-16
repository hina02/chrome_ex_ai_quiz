chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => (error));

const showError = (payload) => {
  chrome.runtime.sendMessage({ type: "showError", payload });
};
const showResponse = (payload) => {
  chrome.runtime.sendMessage({ type: "showResponse", payload });
};

// (content -> background -> sidepanel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "workerShowResponse") {
    showResponse(message.payload);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "workerShowError") {
    showError(message.payload);
  }
});

// (sidepanel -> background -> content) => (content -> background -> sidepanel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "queryOrama") {
    const text = message.text;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "queryOrama", text },
          (response) => {
            if (chrome.runtime.lastError) {
              showError("コンテンツスクリプトとの通信に失敗しました。APIキーの設定を確認し、ページをリロードしてください。");
            } else if (response?.error) {
              showError(response.error);
            } else if (response?.hits !== undefined) {
              const responseMessage =
                `「${text}」に関連する箇所が${response.hits}件見つかりました。`;
              showResponse(responseMessage);
            }
          },
        );
      } else {
        showError("タブが見つかりません。");
      }
    });
  }
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPrompt") {
    const text = message.text;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "runPrompt", text },
          (response) => {
            if (chrome.runtime.lastError) {
              showError("コンテンツスクリプトとの通信に失敗しました。APIキーの設定を確認し、ページをリロードしてください。");
            } else if (response?.error) {
              showError(response.error);
            } else if (response?.response !== undefined) {
              showResponse(response.response);
            } else {
              showError("不明なエラーが発生しました。");
            }
          },
        );
      } else {
        showError("タブが見つかりません。");
      }
    });
  }
  return true;
});
