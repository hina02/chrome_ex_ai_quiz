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
import { initGoogleClient, runPrompt, runTestMaker, clearQuizHistory } from "./generativeAI";
import { displayQuiz, quizData } from "./quiz.js";
import { QuizSchema } from "./schema.js";

// DOMが読み込まれたら初期化
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

(async function () {
  // Google Client 初期化
  const googleClient = await initGoogleClient();
  if (!googleClient) return;
})();

// ウェブページのテキストを保存
let articleText = "";

function setupEventListeners() {
  // Promptボタン
  buttonPrompt.addEventListener("click", async () => {
    const prompt = inputPrompt.value.trim();
    if (!prompt) {
      showError("質問を入力してください。");
      return;
    }
    showLoading();
    try {
      const response = await runPrompt(prompt + "\n\n参考 ウェブページのテキスト: \n" + articleText);
      if (response.error) {
        showError(response.error);
      } else {
        showResponse(response);
      }
    } catch (error) {
      console.error("プロンプト実行エラー:", error);
      showError(error.message || "不明なエラーが発生しました。");
    }
  });

  // Analysisボタン
  buttonAnalysis.addEventListener("click", async () => {
    showLoading();
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      articleText = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(activeTab.id, { action: "getArticleText" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error("ウェブページの取得に失敗しました。ページをリロードしてください。" + chrome.runtime.lastError.message));
            showError("ウェブページの取得に失敗しました。ページをリロードして、やり直してください。");
            return;
          }

          if (response && response.error) {
            console.error("ウェブページの取得に失敗しました。", response.error);
            reject(new Error("ウェブページの取得に失敗しました。コンフィグ > 詳細設定から、ターゲットセレクタを変更することで、解決することがあります。"));
            showError("ウェブページの取得に失敗しました。コンフィグ > 詳細設定から、ターゲットセレクタを変更することで、解決することがあります。");
            return;
          }

          resolve(response.text);
        });
      });

      // 作成済みのテストを履歴に残しておく
      try {
        const response = await runTestMaker(articleText);

        if (response.error) {
          showError(response.error);
          return;
        }

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error("JSONパースエラー:", e);
          showError("レスポンスのパースに失敗しました。再度実行してください。");
          return;
        }

        let validatedData;
        try {
          validatedData = QuizSchema.parse(parsedResponse);
        } catch (e) {
          console.error("バリデーションエラー:", e);
          showError("レスポンスのバリデーションに失敗しました。再度実行してください。");
          return;
        }

        console.log("response:", validatedData);
        quizData.question = validatedData.question;
        quizData.answer = validatedData.answer;
        quizData.option = validatedData.option;
        quizData.explain = validatedData.explain;
        displayQuiz(quizData);
        showResponse("問題が生成されました。");
      } catch (error) {
        console.error("プロンプト実行エラー:", error);
        showError(error.message || "不明なエラーが発生しました。");
      }
    });
  });

  // Clearボタン
  buttonClear.addEventListener("click", () => {
    inputPrompt.value = "";
    articleText = "";
    clearDisplay();
    clearQuizHistory();
    document.querySelector("#quiz-container").style.display = "none";
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
