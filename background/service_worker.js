let currentTabId = null;

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => error);

// activTab (background -> sidepanel)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab && tab.title) {
    currentTabId = activeInfo.tabId;
    await sendUrlToSidePanel(tab.title);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.title) {
    await sendUrlToSidePanel(changeInfo.title);
  }
});

async function sendUrlToSidePanel(title) {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['SIDE_PANEL']
  });

  if (contexts && contexts.length > 0) {
    const response = await chrome.runtime.sendMessage({ type: "activeTab", title: title });
  } else {
    console.log("サイドパネルがまだ開いていないため、'activeTab'のメッセージは更新されませんでした。");
  }
}

// TODO 確認
// 共通メッセージ(content -> background -> sidepanel)
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
