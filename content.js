import { create, insertMultiple, search } from "./node_modules/@orama/orama/dist/browser/index.js";
import { GoogleGenerativeAI } from "./node_modules/@google/generative-ai/dist/index.mjs";
// import { pluginQPS } from "./node_modules/@orama/plugin-qps/dist/index.js";

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
  // plugins: [
  //   pluginQPS(),
  // ],
});

const article = document.querySelector("article");

function separateChildren(article) {
  const docs = [];
  const children = Array.from(article.children);
  for (let i = 0; i < children.length; i++) {
    const textContent = children[i].textContent || "";

    if (textContent && textContent.length > 1000) {
      const grandChildren = Array.from(children[i].children).filter((grandChild) =>
        grandChild.textContent.trim() !== ""
      );
      for (let j = 0; j < grandChildren.length; j++) {
        const grandChild = grandChildren[j];
        docs.push({
          className: grandChild.className.split(" ")[0],
          parentClass: grandChild.parentElement?.className.split(" ")[0],
          index: j,
          textContent: grandChild.textContent || "",
          embedding: [],
        });
      }
    } else {
      docs.push({
        className: children[i].className.split(" ")[0],
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
  const embeddings = await getEmbeddings(docs.map((doc) => doc.textContent));
  docs.forEach((doc, i) => {
    doc.embedding = embeddings[i];
  });

  insertMultiple(db, docs);
}

// query
async function queryDB(query) {
  const embedding = await getEmbedding(query);

  return search(db, {
    mode: "hybrid",
    term: query,
    vector: {
      value: embedding,
      property: "embedding",
    },
    includeVectors: false,
  }).hits;
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
      if (className !== "") {
        targetElement = article.querySelector(`.${className}`);
      } else {
        const parentClass = result.document.parentClass;
        const index = result.document.index;
        const parentElement = article.querySelector(parentClass);
        targetElement = article.querySelector(
          `${parentClass} > :nth-child(${index + 1})`,
        );
      }

      if (targetElement) {
        targetElement.style.backgroundColor = "yellow";
        targetElement.style.color = "black"
        targetElement.style.fontWeight = "bold";
        targetElement.style.border = "3px double blue"
        console.log("ハイライトを適用しました:", targetElement);

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
        console.log("指定されたインデックスの要素が見つかりません");
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
  }

  const query = "Service Worker";
  const results = await queryDB(query);
  console.log(results);
  highlightResult(results);
})();