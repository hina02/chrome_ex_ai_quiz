import { create, insertMultiple, search } from "@orama/orama";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { pluginQPS } from "@orama/plugin-qps";

let db = null;
let embeddingModel = null;
let genAIModel = null;

// ページ読込時にDBとモデルを初期化
(async function () {
  await initDBandModel();
  const url = window.location.href;
  const pageData = await getPageElements(url);
  if (pageData && pageData.length > 0) {
    console.log(`${url}のページデータをキャッシュから読み込みました。`);
    return;
  }

  const article = document.querySelector("article");
  if (article) {
    const docs = separateChildren(article);
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

async function initDBandModel() {
  // 1. Orama DB 初期化
  db = create({
    schema: {
      className: "string",
      parentClass: "string",
      index: "number",
      textContent: "string",
      embedding: "vector[768]",
    },
    plugins: [pluginQPS()],
  });

  // 2. embeddingModel 初期化
  const apiKey = await getApiKeyFromStorage();
  if (!apiKey) {
    console.warn("No API Key found. Please set it in options.");
    chrome.runtime.sendMessage({
      type: "workerShowError",
      payload: "設定画面でAPI Keyを設定してください。",
    });
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  // 3. GenerativeAIModel 初期化
  const generationConfig = await getGenerationConfig();
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];
  genAIModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig,
  });
}


// chrome.storage
function getApiKeyFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get("apiKey", (data) => {
      resolve(data.apiKey || null);
    });
  });
}

function getGenerationConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get("generationConfig", (data) => {
      resolve(data.generationConfig || null);
    });
  });
}

function getPageElements(url) {
  return new Promise((resolve) => {
    chrome.storage.session.get(url, (data) => {
      resolve(data?.[url] || null);
    });
  });
}


// ページ解析
function separateChildren(article) {
  const docs = [];
  const children = Array.from(article.children);
  for (let i = 0; i < children.length; i++) {
    const textContent = children[i].textContent || "";

    if (textContent && textContent.length > 2000) {
      const grandChildren = Array.from(children[i].children);
      for (let j = 0; j < grandChildren.length; j++) {
        const grandChild = grandChildren[j];
        const className = grandChild.className || "";
        const parentClass = grandChild.parentElement?.className || "";
        if (grandChild.textContent.trim() == "") continue;
        docs.push({
          className: className.trim().split(/\s+/).join("."),
          parentClass: parentClass.trim().split(/\s+/).join("."),
          index: j,
          textContent: grandChild.textContent.trim(),
          embedding: [],
        });
      }
    } else if (textContent.trim() != "") {
      docs.push({
        className: (children[i].className || "").trim().split(/\s+/).join("."),
        parentClass: "article",
        index: i,
        textContent: textContent,
        embedding: [],
      });
    }
  }
  return docs;
}

async function createDB(docs) {
  if (!embeddingModel) {
    console.warn("No API Key found. Please set it in options.");
    chrome.runtime.sendMessage({
      type: "workerShowError",
      payload: "設定画面でAPI Keyを設定してください。",
    });
    return false;
  }

  const batchSize = 100;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const embeddings = await getEmbeddings(batch.map((doc) => doc.textContent));
    batch.forEach((doc, j) => {
      doc.embedding = embeddings[j];
    });
    insertMultiple(db, batch);
  }
  return true;
}

async function getEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function getEmbeddings(texts) {
  const requests = texts.map((text) => ({
    content: { role: "user", parts: [{ text }] },
  }));
  const result = await embeddingModel.batchEmbedContents({ requests });
  return result.embeddings.map((embedding) => embedding.values);
}

// query
async function queryDB(query) {
  if (!embeddingModel) {
    console.warn("No API Key found. Please set it in options.");
    chrome.runtime.sendMessage({
      type: "workerShowError",
      payload: "設定画面でAPI Keyを設定してください。",
    });
    return;
  }
  const embedding = await getEmbedding(query);
  const results = search(db, {
    mode: "hybrid",
    term: query,
    vector: {
      value: embedding,
      property: "embedding",
    },
    similarity: 0.4,
    includeVectors: true,
    limit: 5,
  });
  const filteredResults = results.hits.filter((result) => result.score > 0.3);
  console.log(filteredResults);
  highlightResult(filteredResults);
  return filteredResults.length;
}

function highlightResult(results) {
  if (results) {
    // const linksContainer = document.createElement("ul");
    // linksContainer.style.padding = "10px";
    // linksContainer.style.borderBottom = "1px solid #ccc";
    // linksContainer.style.listStyleType = "none";
    // const listItem = document.createElement("li");

    for (const result of results) {
      let targetElement;
      const className = result.document.className;
      if (className) {
        targetElement = document.querySelector(`.${className}`);
      } else {
        const parentClass = result.document.parentClass;
        const parentElement = document.querySelector(`.${parentClass}`);
        if (parentElement) {
          targetElement = parentElement.children[result.document.index];
        } else {
          console.error(`親要素が見つかりません: .${parentClass}`);
        }
      }

      if (targetElement) {
        targetElement.style.backgroundColor = "yellow";
        targetElement.style.color = "black";
        targetElement.style.fontWeight = "bold";
        targetElement.style.border = "3px double blue";

        // if (!targetElement.id) {
        //   targetElement.id = `highlight-${Math.random().toString(32).substring(2)}`;

        //   const link = document.createElement("a");
        //   link.textContent = `#${targetElement.textContent.substring(0, 10)}...`;
        //   link.href = `${id}`;
        //   link.style.marginRight = "10px";
        //   link.style.color = "blue";
        //   link.style.textDecoration = "none";
        //   listItem.appendChild(link);
        // }
      } else {
        console.log(
          `指定されたインデックスの要素が見つかりません: .${className}: ${result.document.index}`,
        );
      }
    }
    // linksContainer.appendChild(listItem);
    // article.body.insertBefore(linksContainer, article.body.firstChild);
  }
}

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

async function runPrompt(prompt) {
  try {
    const result = await genAIModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Prompt failed:", error);
    throw error;
  }
}
