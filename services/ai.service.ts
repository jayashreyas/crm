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
  static async lookupProperty(address: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const ai = getAIClient();
    if (!ai) return { success: false, error: "API Key Missing. Add VITE_GEMINI_API_KEY to configurations." };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Find real estate details for: ${address}.
        Search for recent listing data (Zillow, Redfin, Realtor.com).
        
        Return a JSON object with:
        - price (number, list price or Zestimate)
        - bed (number)
        - bath (number)
        - sqft (number)
        - year (number, year built)
        - estimate (number, estimated value if list price unavailable)
        - seller (string, listing agent or owner if public)
        - link (string, source url)
        
        If precise data is missing, make best estimates based on search results.`,
        config: {
          tools: [{ googleSearchRetrieval: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              price: { type: Type.NUMBER },
              bed: { type: Type.NUMBER },
              bath: { type: Type.NUMBER },
              sqft: { type: Type.NUMBER },
              year: { type: Type.NUMBER },
              estimate: { type: Type.NUMBER },
              seller: { type: Type.STRING },
              link: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      return text ? { success: true, data: JSON.parse(text) } : { success: false, error: "AI returned no data." };
    } catch (e: any) {
      console.error("Property Lookup Error:", e);
      let msg = "Could not find property details.";
      if (e.message?.includes("429")) msg = "Daily AI Quota Exceeded. Try again tomorrow or upgrade API key.";
      if (e.message?.includes("403")) msg = "API Key Invalid or unauthorized domain.";
      return { success: false, error: msg };
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
            Target Fields: address (string), sellerName (string), price (number), status ('Active'|'Under Contract'|'Sold'|'New'), notes (string), metadata (object).
            Current Date: ${today}
            
            Column Mappings:
            - Address: Combine "PropertyAddressFormatted", "PropertyCityState", "Zipcode"
            - Seller: "OwnerNames" (or "OwnerFirstName" + "OwnerLastName")
            - Price: "SaleAmt" (if 0 or empty, check "AnnualTax" or "TotalTotalAsmt" as fallback guess, else 0)
            - Status: 
               1. "SettleDate" or "DeedRecordDate" present? 
                  - Date < ${today} -> "Sold"
                  - Date > ${today} -> "Under Contract"
               2. Else -> "New"
            
            Metadata Extraction (Put these in 'metadata' keys):
            - bed: "Bedrooms"
            - bath: "Baths"
            - sqft: "BldgSqFtTotal"
            - year: "YearBuilt"
            - lot: "LotSqFt" or "LotAcres"
            - taxId: "TaxID"
            - mls: "MLS Number"
            - desc: "CountyBldgDesc"
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
                notes: { type: Type.STRING },
                metadata: {
                  type: Type.OBJECT,
                  properties: {
                    bed: { type: Type.STRING },
                    sqft: { type: Type.STRING },
                    year: { type: Type.STRING },
                    lot: { type: Type.STRING },
                    taxId: { type: Type.STRING },
                    mls: { type: Type.STRING }
                  }
                }
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
