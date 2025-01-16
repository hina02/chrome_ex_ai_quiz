import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "../node_modules/@google/generative-ai/dist/index.mjs";


// モデル生成
export async function createModel(generationConfig) {
  // const apiKey = await getApiKeyFromStorage();
  const apiKey = "AIzaSyBMqhyjCn7kWKb3ZRr9tEeVhMFh78ZzeQY";

  if (!apiKey) {
    throw new Error("API Key is not available in storage.");
  }

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig,
  });
  return model;
}

// モデル実行
export async function runPrompt(generationConfig, prompt) {
  try {
    const model = await createModel(generationConfig);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Prompt failed:", error);
    throw error;
  }
}
