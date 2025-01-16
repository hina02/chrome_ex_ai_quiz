import {
  buttonPrompt,
  buttonQuery,
  buttonSettings,
  inputPrompt,
  inputQuery,
  showError,
  showLoading,
  showResponse,
} from "./ui.js";

// DOMが読み込まれたら初期化
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Queryボタン
  buttonQuery.addEventListener("click", () => {
    const query = inputQuery.value.trim();
    showResponse("クエリを送信中...");
    chrome.runtime.sendMessage({ action: "queryOrama", text: query });
  });

  // Promptボタン
  buttonPrompt.addEventListener("click", async () => {
    const prompt = inputPrompt.value.trim();
    if (!prompt) {
      showError("プロンプトを入力してください。");
      return;
    }
    showLoading();
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "runPrompt", text: prompt });
    });
  });

  // Settingsボタン
  buttonSettings.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // 他拡張機能のメッセージ受信
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "showResponse":
          showResponse(message.payload);
          break;

        case "showError":
          showError(message.payload);
          break;

        default:
          console.warn("不明なメッセージタイプ:", message.type);
          break;
      }
  });
}
