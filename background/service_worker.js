// import { gemini2apiRequest } from "./api.js";

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

// runPrompt (sidepanel -> background -> content 往復)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPrompt") {
    const text = message.text;
    console.log("runPrompt", text);

    // TODO （article不要なので）コンテンツスクリプトに送らずに、generativeAIに直接リクエスト
    // TODO ストレージからarticleを取得
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


// runAnalysis (sidepanel -> background 往復)
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "runAnalysis") {
    try {
      // activeTabのarticle textContentを取得
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];

      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: "getArticleText" },
          (responseCallback) => {
            if (chrome.runtime.lastError) {
              console.error("getArticleText エラー: セレクタが'article'にマッチしません。或いは、リロードで解決する場合があります。");
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log("記事のテキストを取得しました。");
              resolve(responseCallback);
            }
          }
        );
      });

      sendResponse(response.text);
      // TODO Check
      // const apiResponse = await gemini2apiRequest(response.text);

      // if (apiResponse.error) {
      //   console.log("エラーが発生しました。", apiResponse.error);
      //   showError(apiResponse.error);
      // } else {
      //   console.log("レスポンスを受信しました。", apiResponse);
      //   // object[]  object{comment, sentence, stamp}
      //   showResponse(apiResponse);
      // }
    } catch (error) {
      console.error("エラー:", error.message);
      sendResponse({ error: error.message });
    }
  }
});

// runExplain
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "runExplain",
    title: "Explain Selected Text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "runExplain" && info.selectionText) {
    const selectedText = info.selectionText;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "runPrompt", selectedText },
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
