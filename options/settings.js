document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-button");
  const statusDiv = document.getElementById("status");
  const closeButton = document.getElementById("close-button");
  const toggleVisibilityButton = document.getElementById("toggle-visibility");
  const visibilityIcon = toggleVisibilityButton.querySelector(
    "#text-visibility",
  );
  const sliderTemperature = document.querySelector("#temperature");
  const labelTemperature = document.querySelector("#label-temperature");

  // Temperatureスライダー
  sliderTemperature.addEventListener("input", (event) => {
    labelTemperature.textContent = event.target.value;
  });

  // システムプロンプト入力エリア
  const systemPromptInput = document.getElementById("system-prompt") || "";

  // 設定をロード
  chrome.storage.local.get("apiKey", (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });
  chrome.storage.local.get("systemPrompt", (data) => {
    if (data.systemPrompt) {
      systemPromptInput.value = data.systemPrompt;
    }
  }
  );
  chrome.storage.local.get("generationConfig", (data) => {
    if (data.generationConfig) {
      sliderTemperature.value = data.generationConfig.temperature;
      labelTemperature.textContent = data.generationConfig.temperature;
    }
  });

  // 設定を保存
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ apiKey }, () => {
        statusDiv.textContent = "API settings saved!";
        statusDiv.hidden = false;
        setTimeout(() => (statusDiv.hidden = true), 3000);
      });
      chrome.storage.local.set({
        generationConfig: { temperature: sliderTemperature.value },
      });
      chrome.storage.local.set({
        systemPrompt: systemPromptInput.value,
      });
    } else {
      statusDiv.textContent = "Please enter a valid API Key.";
      statusDiv.hidden = false;
      setTimeout(() => (statusDiv.hidden = true), 3000);
    }
  });

  // パスワードの表示/非表示を切り替え
  toggleVisibilityButton.addEventListener("click", () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
    visibilityIcon.textContent = isPassword ? "visibility" : "visibility_off";
  });

  // 設定画面を閉じる
  closeButton.addEventListener("click", () => {
    window.close();
  });
});
