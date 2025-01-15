import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "../node_modules/@google/generative-ai/dist/index.mjs";

const apiKey = "AIzaSyD0jBc_JrWx0p5rbM2jBWbAZH_b7_JDIAU";

// モデル生成
export function createModel(generationConfig) {
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
export async function runPrompt(model, prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Prompt failed:", error);
    throw error;
  }
}
