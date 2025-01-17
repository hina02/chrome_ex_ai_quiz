import { getPageElements } from "./storage";
import { separateChildren } from "./element";
import { createDB, initOrama, queryDB } from "./orama";
import { initGoogleClient, initModel, runPrompt } from "./generativeAI";

// ページ読込時にDBとモデルを初期化
(async function () {
  // 0. Google Client 初期化
  const googleClient = await initGoogleClient();
  if (!googleClient) return;

  // 1. Orama 初期化
  await initOrama(googleClient);

  // 2. GenerativeAI 初期化
  await initModel(googleClient);

  // 3. ページデータ読み込み
  const url = window.location.href;
  const pageData = await getPageElements(url);
  if (pageData && pageData.length > 0) {
    console.log(`${url}のページデータをキャッシュから読み込みました。`);
    return;
  }

  const article = document.querySelector("article");
  if (article) {
    const docs = separateChildren(article);

    // 4. Oramaに保存
    await createDB(docs).then((result) => {
      if (result) {
        console.log("ページがデータベースに読み込まれました。");
        chrome.storage.session.set({ [url]: docs });
        chrome.runtime.sendMessage({
          type: "workerShowResponse",
          payload: "ページがデータベースに読み込まれました。",
        });
      }
    });
  }
})();

// (sidepanel -> background -> content) => (content -> background -> sidepanel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "queryOrama" && message.text) {
    queryDB(message.text).then((hits) => {
      console.log(hits);
      sendResponse({ hits });
    }).catch((error) => {
      sendResponse({ error });
    });
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPrompt" && message.text) {
    runPrompt(message.text).then((response) => {
      sendResponse({ response });
    }).catch((error) => {
      sendResponse({ error });
    });
    return true;
  }
});
