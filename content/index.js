// import { initGoogleClient, initModel, runPrompt } from "./generativeAI";

// TODO　修正
// ページ読込時にDBとモデルを初期化　
// (async function () {
//   // 1. Google Client 初期化
//   const googleClient = await initGoogleClient();
//   if (!googleClient) return;

//   // 2. GenerativeAI 初期化
//   await initModel(googleClient);
// })();

// TODO　修正
// (sidepanel -> background -> content) => (content -> background -> sidepanel)
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "runPrompt" && message.text) {
//     runPrompt(message.text).then((response) => {
//       sendResponse({ response });
//     }).catch((error) => {
//       sendResponse({ error });
//     });
//     return true;
//   }
// });

// (background <=> content)
// document.querySelector("article")で目的の要素が取得できるか注意。

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getArticleText") {
    const articleText = document.querySelector("article")?.textContent || "";
    sendResponse({ text: articleText });
  }
  return true;
});
