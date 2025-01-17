let currentTabId = null;

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => error);

// activTab (background -> sidepanel)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.title) {
      currentTabId = activeInfo.tabId;
      sendUrlToSidePanel(tab.title);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.title) {
    sendUrlToSidePanel(changeInfo.title);
  }
});

function sendUrlToSidePanel(title) {
  chrome.runtime.sendMessage({ type: "activeTab", title: title });
}

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

const showError = (payload) => {
  chrome.runtime.sendMessage({ type: "showError", payload });
};
const showResponse = (payload) => {
  chrome.runtime.sendMessage({ type: "showResponse", payload });
};

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
              showError(
                "コンテンツスクリプトとの通信に失敗しました。APIキーの設定を確認し、ページをリロードしてください。",
              );
            } else if (response?.error) {
              showError(response.error);
            } else {
              const responseMessage =
                `「${text}」に関連する箇所が${response.length}件見つかりました。`;
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
              showError(
                "コンテンツスクリプトとの通信に失敗しました。APIキーの設定を確認し、ページをリロードしてください。",
              );
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
