function getQuerySelector() {
  return new Promise((resolve) => {
    chrome.storage.local.get("querySelector", (data) => {
      resolve(data.querySelector || null);
    });
  });
}

function checkIfCoursesPage(url) {
  const targetString = "https://www.nnn.ed.nico/courses/";
  return url.includes(targetString);
}

// URLからベースURL部分を抽出する関数
function extractBaseUrlPart(url) {
  const regex = /(https:\/\/www\.nnn\.ed\.nico\/)(?:contents\/)?(courses\/\d+\/chapters\/\d+\/)(?:movie|movies)\/(\d+)/;
  const match = url.match(regex);

  if (match && match.length >= 4) {
    // nnn.ed.nico/contents/courses/1391271847/chapters/297636086/movies/32210789183
    const baseUrlPart = match[1] + 'contents/' + match[2] + 'movies/' + match[3];
    console.log("抽出されたベースURL部分:", baseUrlPart);
    return baseUrlPart;
  } else {
    console.log("URLパターンが一致しませんでした。");
    return '';
  }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getArticleText") {
    getQuerySelector().then((querySelector) => {
      const actualQuerySelector = querySelector || "article";
      let articleText = "";

      if (checkIfCoursesPage(window.location.href)) {
        // URLからiframeへのアクセスに使うベースURL部分を抽出
        const currentUrl = window.location.href;
        const baseUrlPart = extractBaseUrlPart(currentUrl);
        if (!baseUrlPart) {
          console.error("No base URL part found.");
          sendResponse({ error: "No base URL part found." });
          return;
        }

        const outerIframeSelector = `iframe[src*="${baseUrlPart}?content_type=zen_univ"]`;
        const innerIframeSelector = `iframe[src*="${baseUrlPart}/references"]`;

        // 1. 外側のiframe要素を取得。
        const outerIframeElement = document.querySelector(outerIframeSelector);

        if (outerIframeElement && outerIframeElement.contentDocument) {
          const outerIframeDocument = outerIframeElement.contentDocument;

          // 2. 内側のiframe要素を取得。
          const innerIframeElement = outerIframeDocument.querySelector(innerIframeSelector);

          if (innerIframeElement && innerIframeElement.contentDocument) {
            const innerIframeDocument = innerIframeElement.contentDocument;

            // 3. 内側のiframeのドキュメント内から、目的のセクションを取得し、テキストを抽出。
            const targetSection = innerIframeDocument.querySelector('.main-content');

            if (targetSection) {
              articleText = targetSection.textContent;
            } else {
              console.log('内側のiframe内で指定されたセクションが見つかりませんでした。');
            }
          } else {
            console.log('内側のiframeが見つからないか、そのコンテンツドキュメントにアクセスできませんでした。');
          }
        } else {
          console.log('外側のiframeが見つからないか、そのコンテンツドキュメントにアクセスできませんでした。');
        }
      } else {
        articleText = document.querySelector(actualQuerySelector)?.textContent || "";
      }
      if (!articleText) {
        console.error("No article text found using the selector:", actualQuerySelector);
        sendResponse({ error: "No article text found." });
        return;
      }
      sendResponse({ text: articleText });
    });
    return true;
  }
});
