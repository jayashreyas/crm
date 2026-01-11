import { GoogleGenAI, Type } from "@google/genai";
import { Listing, Offer, Thread, Message, AIScore } from "../types";

// Lazy initialization wrapper
const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export class AIService {
  static async scoreDeal(listing: Listing, notes: string = ""): Promise<AIScore> {
    const ai = getAIClient();
    if (!ai) return { score: 0, explanation: "AI Key Missing", risks: [], urgency: "Low", lastUpdated: new Date().toISOString() };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Evaluate this real estate deal:
        Address: ${listing.address}
        Price: ${listing.price}
        Status: ${listing.status}
        Notes: ${notes}
        
        Return a score (0-100) and analysis.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              urgency: {
                type: Type.STRING,
                description: "The urgency of the deal: Low, Medium, or High"
              }
            },
            required: ["score", "explanation", "risks", "urgency"]
          }
        }
      });

      const text = response.text;
      const jsonStr = text ? text.trim() : "{}";
      const result = JSON.parse(jsonStr);

      return {
        ...result,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("AI Error:", error);
      return { score: 0, explanation: "AI Error", risks: [], urgency: "Low", lastUpdated: new Date().toISOString() };
    }
  }

  static async summarizeOffer(offer: Offer, listing: Listing): Promise<string> {
    const ai = getAIClient();
    if (!ai) return "AI Configuration Missing.";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Summarize this offer:
        Buyer: ${offer.buyerName}
        Amount: ${offer.price}
        Listing Price: ${listing.price}
        Financing: ${offer.financing}
        
        Provide a 2-sentence summary of deal quality and risks.`,
      });
      return response.text || "Summary unavailable.";
    } catch (e) {
      return "AI Service Unavailable.";
    }
  }

  static async draftResponse(thread: Thread, currentUser: string): Promise<string> {
    const ai = getAIClient();
    if (!ai) return "AI Configuration Missing.";

    try {
      const context = thread.messages.slice(-5).map(m => `${m.senderId}: ${m.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Thread context:
        ${context}
        
        You are agent ${currentUser}. Draft a professional, friendly, and brief follow-up message to suggest the next steps.`,
      });
      return response.text || "Drafting failed.";
    } catch (e) {
      return "AI Service Unavailable.";
    }
  }
}
