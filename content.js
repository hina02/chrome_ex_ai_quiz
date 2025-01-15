import { create, insertMultiple, search } from "@orama/orama";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pluginQPS } from "@orama/plugin-qps";

const genAI = new GoogleGenerativeAI("AIzaSyD0jBc_JrWx0p5rbM2jBWbAZH_b7_JDIAU");
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function getEmbedding(text) {
  const result = await model.embedContent(text);
  return result.embedding.values;
}
function textToRequest(text) {
  return { content: { role: "user", parts: [{ text }] } };
}
async function getEmbeddings(texts) {
  const requests = texts.map((text) => textToRequest(text));
  const result = await model.batchEmbedContents({ requests });
  return result.embeddings.map((embedding) => embedding.values);
}

const db = create({
  schema: {
    className: "string",
    parentClass: "string",
    index: "number",
    textContent: "string",
    embedding: "vector[768]",
  },
  plugins: [
    pluginQPS(),
  ],
});


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
        if (grandChild.textContent.trim() == "") { continue }
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
  const batchSize = 100;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const embeddings = await getEmbeddings(batch.map((doc) => doc.textContent));
    batch.forEach((doc, j) => {
      doc.embedding = embeddings[j];
    });
    insertMultiple(db, batch);
  }
}

// query
async function queryDB(query) {
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

(async function () {
  const article = document.querySelector("article");
  if (article) {
    const docs = separateChildren(article);
    await createDB(docs);
    console.log("ページがデータベースに読み込まれました。");
    chrome.runtime.sendMessage({
      type: "showResponse",
      payload: "ページがデータベースに読み込まれました。",
    });
  }
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "queryOrama" && message.text) {
    queryDB(message.text).then((hits) => {
      sendResponse({ hits });
    });
    return true;
  }
});
