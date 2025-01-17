import {
  buttonPrompt,
  buttonSettings,
  inputPrompt,
  showError,
  showLoading,
  showResponse,
} from "./ui.js";

// DOMが読み込まれたら初期化
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

function setupEventListeners() {
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

      case "activeTab":
        if (message.title) {
          document.getElementById("activeTabDisplay").textContent =
            message.title;
        }
        break;

      default:
        console.warn("不明なメッセージタイプ:", message.type);
        break;
    }
  });
}
