import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function generateMongoQuery(nlQuery: string, context: string) {
  // Fallback for demo if key is missing
  if (!process.env.GROQ_API_KEY) {
    console.warn("Using Mock AI Response: GROQ_API_KEY is not configured.");
    return {
      collection: "sales",
      pipeline: [{ "$match": { "crop": "Wheat" } }, { "$group": { "_id": null, "total": { "$sum": "$quantity" } } }],
      advice: "Bazaar mein gehu ke daam badh rahe hain, stock bechna sahi rahega. Beta, agle hafte tak ruko, 5% aur munafa ho sakta hai.",
      translation: "Gehu ki kul bikri ki jankari."
    };
  }

  const prompt = `
    You are an expert MongoDB developer. Your task is to convert Indian farmers' natural language questions (in Hindi or English) into a MongoDB Aggregation Pipeline.
    
    COLLECTION SCHEMA:
    The "sales" collection has: { cropName: string, totalAmount: number, quantity: number, date: Date, pricePerQuintal: number, profit: number, userId: ObjectId }
    The "crops" collection has: { cropName: string, quantity: number, pricePerQuintal: number, status: string, updatedAt: Date, userId: ObjectId }
    
    USER QUESTION: "${nlQuery}"
    DAK/CONTEXT: ${context}
    
    RESPONSE FORMAT:
    Return ONLY a JSON object with:
    1. "intent": ("data_query", "price_prediction", or "mandi_info")
    2. "pipeline": (The aggregation array, empty for prediction/mandi)
    3. "collection": (Either "sales", "crops", or "prices")
    4. "advice": (A helpful advice in Hindi. For mandi, mention current market mood)
    5. "translation": (The question in polished Hindi)
    6. "cropName": (The identified crop name in English, e.g. "Wheat")
    
    Example Mandi Input: "Indore mandi mein gehu ka rate kya hai?"
    Result: {
      "intent": "mandi_info",
      "cropName": "Wheat",
      "collection": "prices",
      "pipeline": [],
      "advice": "Indore mandi mein gehu ke daam mein badhotri dikh rahi hai.",
      "translation": "Indore mandi ke gehu ka bhav."
    }
  `;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a MongoDB expert. You MUST return ONLY a valid JSON object. No characters before or after the JSON. DO NOT wrap the JSON in markdown code blocks. NO comments. NO conversational filler." },
      { role: "user", content: prompt }
    ],
    temperature: 0, // Most deterministic
  });

  const content = response.choices[0].message.content;
  console.log("RAW AI RESPONSE:", content); // CRITICAL FOR DEBUGGING

  if (!content) throw new Error("Failed to generate query");

  // Robust JSON extraction
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch (e: any) {
    console.error("JSON PARSE ERROR:", e.message);
    console.error("MALFORMED CONTENT:", content);
    throw new Error(`AI generated invalid JSON: ${e.message}`);
  }
}

export async function generateResponse(message: string, language: string) {
  const systemPrompt = `
You are KisanDB AI Assistant.
You help farmers understand crop sales data.
Respond in ${language}.
Keep answers short and clear.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}
