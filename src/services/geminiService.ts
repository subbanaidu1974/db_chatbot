import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface QueryResponse {
  query: string;
  explanation: string;
  dialect: string;
}

const SYSTEM_INSTRUCTION = `You are a specialist database engineer. Your task is to convert natural language requests into database queries.
You support two dialects: SQL (PostgreSQL compatible) and NoSQL (MongoDB shell syntax).

The schema you are working with is a 'Product' entity:
- id: string
- name: string
- description: string
- price: number
- stockQuantity: number
- category: string
- categoryId: string
- tags: string[]
- createdAt/updatedAt: string (ISO 8601)
- supplierInfo: { name: string, contact: string }
- dimensions: { length: number, width: number, height: number, unit: string }
- weight: number, weightUnit: string
- colorOptions: string[]
- materialType: string
- images: string[]
- discountPercentage: number
- status: 'active' | 'discontinued'
- isFeatured: boolean
- minOrderQuantity: number
- returnPolicy: string
- reviews: { id: string, userId: string, rating: number, comment: string, date: string }[]
- relatedProducts: string[]

COMPLEX QUERY RULES:
1. Support multiple conditions using AND/OR logic.
2. For SQL: Use 'products' table. Use standard operators. For nested fields use dot notation if applicable or JSON extraction if implied, but preferred simple dot notation for this exercise.
3. For NoSQL: Use 'products' collection. Use MongoDB $operators ($gt, $in, $and, $elemMatch for arrays).
4. For nested strings: access via dot notation (e.g. "supplierInfo.name").
5. For arrays: use $in or $all in NoSQL, and 'ANY' or 'IN' in SQL.

EXAMPLES:
Request: "Active products in Electronics over $500"
SQL: SELECT * FROM products WHERE status = 'active' AND category = 'Electronics' AND price > 500;
NoSQL: db.products.find({ status: "active", category: "Electronics", price: { $gt: 500 } });

Request: "Items with 'desk' tag and low stock"
SQL: SELECT * FROM products WHERE 'desk' = ANY(tags) AND stockQuantity < 10;
NoSQL: db.products.find({ tags: "desk", stockQuantity: { $lt: 10 } });

Return JSON: { "query": string, "explanation": string, "dialect": string }`;

export async function generateQuery(prompt: string, dialect: 'SQL' | 'NoSQL'): Promise<QueryResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dialect: ${dialect}\nRequest: ${prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            explanation: { type: Type.STRING },
            dialect: { type: Type.STRING }
          },
          required: ["query", "explanation", "dialect"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Error generating query:", error);
    throw error;
  }
}
