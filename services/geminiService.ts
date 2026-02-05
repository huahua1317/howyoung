import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReflectionFeedback = async (content: string, courseName?: string): Promise<string> => {
  try {
    const prompt = `
      你是一位溫暖、專業的青少年職涯輔導社工。
      學生正在撰寫一份關於「${courseName || '生涯探索活動'}」的心得反思，準備放入台灣 108 課綱的學習歷程檔案。
      
      學生的內容如下：
      """
      ${content}
      """
      
      請給予這位學生一段簡短的回饋 (約 100 字內)：
      1. 肯定他的觀察或感受。
      2. 提出一個引導性問題，幫助他思考得更深入（例如：關於能力培養、興趣確認、或未來的連結）。
      3. 語氣要親切、鼓勵，像個大哥哥/大姊姊。
      
      請直接輸出回饋內容，不需要任何開頭問候。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "AI 暫時無法提供回饋，請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 連線發生問題，請檢查網路或 API Key。";
  }
};

export const suggestCareerPaths = async (entries: string[]): Promise<string> => {
  try {
     const prompt = `
      根據以下這位學生的多篇心得反思，請條列出 3 個他可能適合或感興趣的職業發展方向，並簡述原因。
      
      心得內容集合：
      ${JSON.stringify(entries)}
     `;

     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error(error);
    return "無法分析職涯方向。";
  }
}