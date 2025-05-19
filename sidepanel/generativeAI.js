import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKeyFromStorage, getGenerationConfig } from "./storage";

let genAIModel = null;

async function initGoogleClient() {
  const apiKey = await getApiKeyFromStorage();
  if (!apiKey) {
    console.warn("No API Key found. Please set it in options.");
    chrome.runtime.sendMessage({
      type: "workerShowError",
      payload: "設定画面でAPI Keyを設定してください。",
    });
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    genAIModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await genAIModel.generateContent("Hello, World!");
    console.log("api key is valid");
    return genAI;
  } catch (error) {
    console.warn("Invalid API Key. Please check your configuration:", error);
    chrome.runtime.sendMessage({
      type: "workerShowError",
      payload: "無効なAPIキーが指定されています。設定を確認してください。",
    });
    return null; // Return null to prevent further execution
  }
}

async function initModel(googleClient) {
  const generationConfig = await getGenerationConfig();
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];
  genAIModel = googleClient.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings,
    generationConfig,
    systemInstruction: `あなたはチューターです。
    与えられたウェブページ情報に基づいて、問題文と回答のセットを作成したり、
    生徒からの質問に対して説明することが役割づけられています。
    質問に対しては、不要な話題を広げず、なるべく『端的に』回答してください。`,
  });
  return genAIModel;
}

async function runPrompt(prompt) {
  try {
    console.log("リクエスト中...");
    const result = await genAIModel.generateContent(
      "質問: " + prompt,
    );
    console.log("Prompt result:", result);
    return result.response.text();
  } catch (error) {
    console.error("Prompt failed:", error);
    throw error;
  }
}

export { initGoogleClient, initModel, runPrompt };
