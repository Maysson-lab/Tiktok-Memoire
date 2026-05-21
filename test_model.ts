import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
async function run() {
  try {
    const res = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: 'test'
    });
    console.log(res.embeddings[0].values.length);
  } catch(e: any) {
    console.log("Error status:", e.status, "Message:", e.message);
  }
}
run();
