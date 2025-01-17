// UI 要素の取得
const inputPrompt = document.querySelector("#input-prompt");
const buttonPrompt = document.querySelector("#button-prompt");
const elementResponse = document.querySelector("#response");
const elementLoading = document.querySelector("#loading");
const elementError = document.querySelector("#error");
const buttonSettings = document.querySelector("#button-settings");

// UI制御用の関数
function show(element) {
  element.removeAttribute("hidden");
}
function hide(element) {
  element.setAttribute("hidden", "");
}

export function showLoading() {
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

export function showResponse(response) {
  hide(elementLoading);
  hide(elementError);
  show(elementResponse);

  elementResponse.textContent = "";
  const paragraphs = response.split(/\r?\n/);
  paragraphs.forEach((paragraph, index) => {
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    if (index < paragraphs.length - 1) {
      elementResponse.appendChild(document.createElement("br"));
    }
  });
}

export function showError(error) {
  hide(elementLoading);
  hide(elementResponse);
  show(elementError);
  elementError.textContent = error;
}

export { buttonPrompt, buttonSettings, inputPrompt, labelTemperature };
