const quizContainer = document.querySelector("#quiz-container");
const quizQuestion = document.querySelector("#quiz-question");
const quizOptions = document.querySelector("#quiz-options");
const quizSubmitButton = document.querySelector("#quiz-submit-button");
const quizResult = document.querySelector("#quiz-result");

let quizExplanation = document.querySelector("#quiz-explanation");
if (!quizExplanation) { // もし要素がまだ存在しなければ作成
  quizExplanation = document.createElement('div');
  quizExplanation.id = 'quiz-explanation';
  quizExplanation.style.fontSize = '0.9em'; // 小さい文字
  quizExplanation.style.color = 'black';    // 黒い文字
  quizExplanation.style.marginTop = '5px';  // quiz-resultとの間隔
  quizResult.parentNode.insertBefore(quizExplanation, quizResult.nextSibling); // quiz-resultの下に追加
}

// クイズデータの初期化
let quizData = {
  "question": "",
  "answer": "",
  "option": [],
  "explain": ""
};

// クイズを表示する関数
function displayQuiz(quizData) {
  quizContainer.style.display = 'block'; // クイズコンテナを表示
  quizExplanation.textContent = ''; // 説明をクリア
  quizQuestion.textContent = quizData.question;
  quizOptions.innerHTML = ''; // オプションをクリア

  // オプションをシャッフル
  const shuffledOptions = [...quizData.option].sort(() => Math.random() - 0.5);

  shuffledOptions.forEach((option, index) => {
    const div = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `option-${index}`;
    input.name = 'quizOption';
    input.value = option;
    input.style.marginRight = '10px'; // スペースを追加

    const label = document.createElement('label');
    label.htmlFor = `option-${index}`;
    label.textContent = option;

    div.appendChild(input);
    div.appendChild(label);
    quizOptions.appendChild(div);
  });

  quizResult.textContent = ''; // 結果表示をリセット
  quizSubmitButton.disabled = false; // ボタンを有効化
}

// 回答をチェックするイベントリスナー
quizSubmitButton.addEventListener('click', () => {
  const selectedOption = document.querySelector('input[name="quizOption"]:checked');

  if (selectedOption) {
    if (selectedOption.value === quizData.answer) {
      quizResult.textContent = '正解です！';
      quizResult.style.color = 'green';
    } else {
      quizResult.textContent = `不正解です。正解は "${quizData.answer}" です。`;
      quizResult.style.color = 'red';
    }
    quizExplanation.textContent = quizData.explain; // 説明を表示
    quizSubmitButton.disabled = true; // 回答後はボタンを無効化
  } else {
    quizResult.textContent = '選択肢を選んでください。';
    quizResult.style.color = 'orange';
    quizExplanation.textContent = '';
  }
});

// ページロード時にクイズを表示
export { displayQuiz, quizData };