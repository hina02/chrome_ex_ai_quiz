import { runPrompt } from "./generativeModel.js";
import {
  buttonPrompt,
  buttonQuery,
  buttonSettings,
  inputPrompt,
  inputQuery,
  labelTemperature,
  showError,
  showLoading,
  showResponse,
  sliderTemperature,
} from "./ui.js";

// グローバル設定
let generationConfig = { temperature: 1 };

// DOMが読み込まれたら初期化
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Temperatureスライダー
  sliderTemperature.addEventListener("input", (event) => {
    labelTemperature.textContent = event.target.value;
    generationConfig.temperature = event.target.value;
  });

  // Queryボタン
  buttonQuery.addEventListener("click", () => {
    const query = inputQuery.value.trim();
    showResponse("クエリを送信中...");
    chrome.runtime.sendMessage({ action: "queryOrama", text: query }, (res) => {
      showResponse(res.message);
    });
  });

  // Promptボタン
  buttonPrompt.addEventListener("click", async () => {
    const prompt = inputPrompt.value.trim();
    showLoading();
    try {
      const response = await runPrompt(generationConfig, prompt);
      showResponse(response);
    } catch (error) {
      showError(error);
    }
  });

  // Settingsボタン
  buttonSettings.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // 他拡張機能のメッセージ受信
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "showResponse") {
      showResponse(message.payload);
    }
  });
}
