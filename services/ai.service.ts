
import { GoogleGenAI, Type } from "@google/genai";
import { Listing, Offer, Thread, Message, AIScore } from "../types";

// Always initialize GoogleGenAI with named apiKey parameter using VITE_GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export class AIService {
  static async scoreDeal(listing: Listing, notes: string = ""): Promise<AIScore> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    // response.text is a getter property. Use trim() before parsing JSON string.
    const text = response.text;
    const jsonStr = text ? text.trim() : "{}";
    const result = JSON.parse(jsonStr);

    return {
      ...result,
      lastUpdated: new Date().toISOString()
    };
  }

  static async summarizeOffer(offer: Offer, listing: Listing): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this offer:
      Buyer: ${offer.buyerName}
      Amount: ${offer.price}
      Listing Price: ${listing.price}
      Financing: ${offer.financing}
      
      Provide a 2-sentence summary of deal quality and risks.`,
    });
    // response.text is a property, not a method.
    return response.text || "Summary unavailable.";
  }

  static async draftResponse(thread: Thread, currentUser: string): Promise<string> {
    const context = thread.messages.slice(-5).map(m => `${m.senderId}: ${m.text}`).join("\n");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Thread context:
      ${context}
      
      You are agent ${currentUser}. Draft a professional, friendly, and brief follow-up message to suggest the next steps.`,
    });
    // response.text is a property, not a method.
    return response.text || "Drafting failed.";
  }
}
