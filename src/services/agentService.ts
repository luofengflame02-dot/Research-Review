import { GoogleGenAI } from '@google/genai';

const getClient = (apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('API Key is missing');
  return new GoogleGenAI({ apiKey: key });
};

export async function runAgent1Extractor(text: string, apiKey?: string): Promise<string> {
  const ai = getClient(apiKey);
  const prompt = `You are an academic assistant. Extract extremely accurate core information from the following paper text. 
Output strictly in JSON format matching this exact structure:
{
  "Title": "...",
  "Background": "...",
  "Core_Problem": "...",
  "Key_Contributions": ["..."],
  "Datasets_Used": ["..."],
  "Evaluation_Metrics": ["..."]
}

Paper Text:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return response.text || "{}";
  } catch (error) {
    console.error("Agent 1 Error:", error);
    throw new Error('Agent 1 (Extractor) failed to process the document.');
  }
}

export async function runAgent2Reviewer(text: string, agent1Data: string, apiKey?: string): Promise<string> {
  const ai = getClient(apiKey);
  const prompt = `You are a top-tier academic conference Senior Reviewer (方法论审稿专家).
Read the paper text and the extracted structured data.
Execute a MUST step-by-step Chain of Thought (CoT) analysis:
1. 原理解构 (Principle Deconstruction)
2. 对比基线 (Baseline Comparison)
3. 寻找实验漏洞或局限性 (Identify Experimental Flaws or Limitations)

Provide a detailed, critical review in Chinese. Be analytical, objective, and extremely rigorous.

--- Extracted Data ---
${agent1Data}

--- Paper Text (Excerpt) ---
${text.substring(0, 100000)} 
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Agent 2 Error:", error);
    throw new Error('Agent 2 (Reviewer) failed to analyze the document.');
  }
}

export async function runAgent3Generator(agent1Data: string, agent2Review: string, apiKey?: string): Promise<string> {
  const ai = getClient(apiKey);
  const prompt = `You are an academic columnist (综述与排版助手). Synthesize the provided extracted data and the Critical Review into a final Chinese Markdown report.
Preserve English ONLY for specific technical terms and code logic.
Use EXACTLY these sections with the exact same emojis for headers:

📄 论文标题
💡 一分钟速览
🎯 核心问题与动机
🛠️ 核心方法论
📊 实验与性能
🧐 专家点评与局限性

Make it highly readable, beautifully formatted (use bullet points, bold text, quotes where applicable), and deeply insightful based on the provided data.

--- Extracted Data (Agent 1) ---
${agent1Data}

--- Critical Review (Agent 2) ---
${agent2Review}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Agent 3 Error:", error);
    throw new Error('Agent 3 (Generator) failed to synthesize the report.');
  }
}
