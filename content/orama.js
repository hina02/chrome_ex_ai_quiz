import { create, insertMultiple, search } from "@orama/orama";
import { pluginQPS } from "@orama/plugin-qps";
import { separateChildren } from "./element";

let embeddingModel = null;
let db = null;

async function initOrama(googleClient) {
  db = create({
    schema: {
      url: "string",
      className: "string",
      parentClass: "string",
      index: "number",
      textContent: "string",
      embedding: "vector[768]",
    },
    components: {
      tokenizer: {
        stemming: true,
        stemmerSkipProperties: ["url"],
      },
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
async function queryDB(query, similarity = 0.7, limit = 3) {
  const embedding = await getEmbedding(query);
  const results = search(db, {
    mode: "hybrid",
    term: query,
    where: { url: window.location.href },
    vector: {
      value: embedding,
      property: "embedding",
    },
    similarity: similarity,
    includeVectors: false,
    limit: limit,
  });

  // active Tabの結果のみを取得
  const filteredResults = results.hits.filter((result) =>
    result.score > 0.3 && result.document.url === window.location.href
);

  // 結果が0の場合は、active Tabのテキストをデータベースに追加
  if (filteredResults.length === 0) {
    const article = document.querySelector("article");
    const docs = separateChildren(article);
    await createDB(docs);
    return await queryDB(query, similarity, limit);
  }

  console.log(filteredResults);
  return filteredResults;
}

export { createDB, initOrama, queryDB };
