const endpoint = process.env.API_ENDPOINT;
const apiKey = process.env.API_KEY;

async function gemini2apiRequest(text) {
  const requestBody = {
    contents: text,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    const data = await response.json();
    console.log("受信したデータ:", data);
    return data;
  } catch (error) {
    console.error("リクエストエラー:", error);
    return error;
  }
}

export { gemini2apiRequest };
