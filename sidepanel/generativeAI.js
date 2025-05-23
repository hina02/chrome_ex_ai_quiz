import { HarmBlockThreshold, HarmCategory, GoogleGenAI, Type } from "@google/genai/web";
import { getApiKeyFromStorage, getGenerationConfig, getSystemPrompt } from "./storage";

let apiKey = null;
let genAI = null;
let responseSchema = {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
          },
          option: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          answer: {
            type: Type.STRING,
          },
          explain: {
            type: Type.STRING,
          },
        },
        propertyOrdering: ["question", "answer", "option", "explain"],
      }

let quizHistory = [];

function clearQuizHistory() {
    quizHistory = [];
}


async function initGoogleClient() {
  apiKey = await getApiKeyFromStorage();
  if (!apiKey) {
    console.warn("No API Key found. Please set it in options.");
    chrome.runtime.sendMessage({
      type: "workerShowError",
      payload: "設定画面でAPI Keyを設定してください。",
    });
    return null;
  }

  try {
    genAI = new GoogleGenAI({ apiKey: apiKey });
    await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello, World!",
    })
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

async function runPrompt(prompt) {
  try {
    const generationConfig = await getGenerationConfig();
    const systemPrompt = await getSystemPrompt();
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "質問: " + prompt,
      config: {
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
        systemInstruction: `あなたはチューターです。
    与えられたウェブページ情報に基づいて、問題文と回答のセットを作成したり、
    生徒からの質問に対して説明することが役割づけられています。
    質問に対しては、不要な話題を広げず、なるべく『端的に』回答してください。
    文末や段落では適度に改行を入れてください。` + systemPrompt,
        temperature: generationConfig.temperature,
      } 
  });
    return result.text;
  } catch (error) {
    console.error("Prompt failed:", error);
    throw error;
  }
}

async function runTestMaker(articleText) {
  try {
    console.log("リクエスト中...");
    const generationConfig = await getGenerationConfig();
    const systemPrompt = await getSystemPrompt();
    const chat = genAI.chats.create({
      model: "gemini-2.0-flash",
      history: quizHistory,
      config: {
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      systemInstruction: `あなたはチューターです。
    与えられたウェブページ情報に基づいて、問題文と回答のセットを作成したり、
    生徒からの質問に対して説明することが役割づけられています。` + systemPrompt,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: generationConfig.temperature,
      }
    });
  
    const response = await chat.sendMessage({
      message: `以下のテキストに基づいて、新しい問題と選択肢4つ、それと正解と、なぜそれが正解なのかのテキストに基づく簡単な説明を出力してください。    
      出力例: 
        {
          "question": "3番目のアルファベットは?",
          "answer": "C",
          "option": ["A", "B", "C", "D"],
          "explain": "<ソースに基づく簡単な説明>"
        }` + 
      articleText,
    });
    if (quizHistory.length > 10) {
      quizHistory.shift();
    }
    quizHistory.push({
      role: "model",
      parts: [{ text: response.text }],
    });
    return response.text;
  }
  catch (error) {
    console.error("TestMaker failed:", error);
    throw error;
  }
}

export { initGoogleClient, runPrompt, runTestMaker, clearQuizHistory };
