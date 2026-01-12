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
  static async parseCSV(csvData: any[], targetType: 'contact' | 'listing' | 'offer' | 'task'): Promise<any[]> {
    const ai = getAIClient();
    if (!ai) return csvData; // Fallback to raw data if AI fails

    try {
      // CHUNK PROCESSING: Process entire dataset in chunks of 20 to avoid token limits
      const CHUNK_SIZE = 20;
      const results: any[] = [];

      for (let i = 0; i < csvData.length; i += CHUNK_SIZE) {
        const chunk = csvData.slice(i, i + CHUNK_SIZE);

        let prompt = "";
        let expectedSchema = {};

        if (targetType === 'contact') {
          prompt = `Analyze this CSV data and map it to a Contact object.
            Target Fields: name (string), email (string), phone (string), notes (string), tags (string[]).
            
            Rules:
            - "phone": Normalize to digits (e.g. 555-0123 -> 5550123). If multiple, pick mobile.
            - "name": Combine First/Last if split.
            - "tags": Infer from status/stage columns (e.g. "New Lead").
            - "notes": Combine extra context fields.
            `;
          expectedSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                notes: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          };
        } else if (targetType === 'listing') {
          const today = new Date().toISOString().split('T')[0];
          prompt = `Analyze this Real Estate data and map it to a Listing object.
            Target Fields: address (string), sellerName (string), price (number), status ('Active'|'Under Contract'|'Sold'|'New'), notes (string).
            Current Date: ${today}
            
            Rules:
            - "address": combine street, city, state zip.
            - "price": parse currency string to number.
            - "status": CRITICAL LOGIC - PRIORITY ORDER:
               1. IF "Settlement Date" / "Closing Date" exists:
                  - Date is in PAST -> "Sold"
                  - Date is in FUTURE -> "Under Contract"
               2. IF explicit Status column exists:
                  - "Sold", "Closed", "Settled" -> "Sold"
                  - "Pending", "Under Contract", "Option", "Escrow" -> "Under Contract"
                  - "Active", "Listed", "New", "Available" -> "Active"
               3. Default -> "New"
            - "notes": Include Settlement Date if found, MLS #, or original status.
            `;
          expectedSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                address: { type: Type.STRING },
                sellerName: { type: Type.STRING },
                price: { type: Type.NUMBER },
                status: { type: Type.STRING, enum: ['Active', 'Under Contract', 'Sold', 'New'] },
                notes: { type: Type.STRING }
              }
            }
          };
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: `${prompt}
            
            Input Data (JSON chunk):
            ${JSON.stringify(chunk)}
            
            Return the MAPPED array for these rows only.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: expectedSchema
          }
        });

        const text = response.text;
        if (text) {
          const parsedChunk = JSON.parse(text);
          if (Array.isArray(parsedChunk)) {
            results.push(...parsedChunk);
          }
        }
      }

      return results.length > 0 ? results : csvData;

    } catch (e) {
      console.error("AI CSV Parse Error:", e);
      return csvData;
    }
  }
}
