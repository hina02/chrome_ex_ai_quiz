document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-button");
  const statusDiv = document.getElementById("status");
  const closeButton = document.getElementById("close-button");
  const toggleVisibilityButton = document.getElementById("toggle-visibility");
  const visibilityIcon = toggleVisibilityButton.querySelector(".material-icons");

  // APIキーをロード
  chrome.storage.local.get("apiKey", (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });

  // APIキーを保存
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ apiKey }, () => {
        statusDiv.textContent = "API Key saved!";
        statusDiv.hidden = false;
        setTimeout(() => (statusDiv.hidden = true), 3000);
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
