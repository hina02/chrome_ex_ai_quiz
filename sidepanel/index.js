import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "../node_modules/@google/generative-ai/dist/index.mjs";

const apiKey = "AIzaSyD0jBc_JrWx0p5rbM2jBWbAZH_b7_JDIAU";

let genAI = null;
let model = null;
let generationConfig = {
  temperature: 1,
};
const inputQuery = document.body.querySelector("#input-query");
const buttonQuery = document.body.querySelector("#button-query");
const inputPrompt = document.body.querySelector("#input-prompt");
const buttonPrompt = document.body.querySelector("#button-prompt");
const elementResponse = document.body.querySelector("#response");
const elementLoading = document.body.querySelector("#loading");
const elementError = document.body.querySelector("#error");
const sliderTemperature = document.body.querySelector("#temperature");
const labelTemperature = document.body.querySelector("#label-temperature");

function initModel(generationConfig) {
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig,
  });
  return model;
}

async function runPrompt(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (e) {
    console.log("Prompt failed");
    console.error(e);
    console.log("Prompt:", prompt);
    throw e;
  }
}

sliderTemperature.addEventListener("input", (event) => {
  labelTemperature.textContent = event.target.value;
  generationConfig.temperature = event.target.value;
});

buttonQuery.addEventListener("click", async () => {
  const query = inputQuery.value.trim();
  showResponse("クエリを送信中...");
  chrome.runtime.sendMessage(
    { action: "queryOrama", text: query },
    (response) => {
      showResponse(response.message);
    },
  );
});

buttonPrompt.addEventListener("click", async () => {
  const prompt = inputPrompt.value.trim();
  showLoading();
  try {
    const generationConfig = {
      temperature: sliderTemperature.value,
    };
    initModel(generationConfig);
    const response = await runPrompt(prompt, generationConfig);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "showResponse") {
    showResponse(message.payload);
  }
});

function showLoading() {
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  // Make sure to preserve line breaks in the response
  elementResponse.textContent = "";
  const paragraphs = response.split(/\r?\n/);
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    // Don't add a new line after the final paragraph
    if (i < paragraphs.length - 1) {
      elementResponse.appendChild(document.createElement("BR"));
    }
  }
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute("hidden");
}

function hide(element) {
  element.setAttribute("hidden", "");
}
