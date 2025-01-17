import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKeyFromStorage, getGenerationConfig } from "./storage";
import { queryDB } from "./orama";

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
    genAIModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig,
  });
}

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

const queryDBTool = {
    name: "queryDatabase",
    parameters: {
        type: "string",
        description: "Query the database for search active tab elements",
    }
};

async function queryDBFunction(query) {
    return await queryDB(query);
}


export { initGoogleClient, initModel, runPrompt };
