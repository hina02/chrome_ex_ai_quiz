import { create, insertMultiple, search } from "@orama/orama";
import { pluginQPS } from "@orama/plugin-qps";
import { highlightResult } from "./element";

let embeddingModel = null;
let db = null;

async function initOrama(googleClient) {
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

  // embeddingModel 初期化
  embeddingModel = googleClient.getGenerativeModel({
    model: "text-embedding-004",
  });
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

export { createDB, initOrama, queryDB };
