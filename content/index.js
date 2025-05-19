// (background <=> content)
// document.querySelector("article")で目的の要素が取得できるか注意。

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getArticleText") {
    const articleText = document.querySelector("article")?.textContent || "";
    sendResponse({ text: articleText });
  }
  return true;
});
