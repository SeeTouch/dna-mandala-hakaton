import { GoogleGenAI } from "@google/genai";

export const getGeminiInterpretation = async (activeCodons: any[], query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are an expert in Gene Keys, Human Design, and Joseph Campbell's Hero's Journey.
    Based on the following active DNA codons and the user's emotional query, generate a deep hermeneutic interpretation.
    
    IMPORTANT: The response MUST be in Russian.
    
    Active Codons: ${JSON.stringify(activeCodons.map(c => ({ gate: c.meta.gate, geneKey: c.meta.geneKey, element: c.visual.element })))}
    User Query: "${query}"
    
    Structure your response using:
    1. Тень (Текущая борьба)
    2. Дар (Потенциал роста)
    3. Сиддхи (Высшая реализация)
    4. Путь Героя (Повествовательное резюме с использованием архетипов)
    
    Keep it poetic, mystical, yet grounded in the user's query. Use Markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The cosmic signals are currently obscured. Try again when the resonance stabilizes.";
  }
};
