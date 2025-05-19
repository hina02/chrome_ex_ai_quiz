import {
  buttonAnalysis,
  buttonPrompt,
  buttonClear,
  buttonSettings,
  inputPrompt,
  showError,
  showLoading,
  showResponse,
  clearDisplay,
} from "./ui.js";
import { initGoogleClient, initModel, runPrompt } from "./generativeAI";

// DOMが読み込まれたら初期化
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

(async function () {
  // Google Client 初期化
  const googleClient = await initGoogleClient();
  if (!googleClient) return;

  await initModel(googleClient);
})();


function setupEventListeners() {
  // Promptボタン
  buttonPrompt.addEventListener("click", async () => {
    const prompt = inputPrompt.value.trim();
    if (!prompt) {
      showError("プロンプトを入力してください。");
      return;
    }
    showLoading();
    await runPrompt(prompt)
    .then((response) => {
      if (response.error) {
        showError(response.error);
      } else {
        showResponse(response);
      }
    })
    .catch((error) => {
      console.error("プロンプト実行エラー:", error);
      showError(error.message || "不明なエラーが発生しました。");
    });
  });

  // Analysisボタン
  buttonAnalysis.addEventListener("click", async () => {
    showLoading();
    console.log("Analysis button clicked");
    new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "runAnalysis" }, (responseCallback) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log("記事のテキストを取得しました。");
          resolve(responseCallback);
        }
      });
    })
    .then((response) => {
      showResponse(response);
    })
    .catch((error) => {
      console.error("解析エラー:", error);
      showError(error.message || "不明なエラーが発生しました。");
    });
  });

  // Clearボタン
  buttonClear.addEventListener("click", () => {
    inputPrompt.value = "";
    clearDisplay();
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
 
      // サイドパネルのサブタイトルに、ウェブページのタイトルを表示
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
