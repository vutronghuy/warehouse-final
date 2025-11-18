// utils/geminiClient.js
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";

// Khởi tạo Gemini client
const genAI = new GoogleGenerativeAI(API_KEY);

// Hàm gọi Gemini sử dụng SDK
async function generateFromGemini(prompt, opts = {}) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not set in .env");

  try {
    // Lấy model
    const model = genAI.getGenerativeModel({ model: MODEL });
    
    // Tạo prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { 
      raw: { 
        candidates: [{ 
          content: { 
            parts: [{ text }] 
          } 
        }] 
      }, 
      text 
    };
  } catch (err) {
    // log nhẹ, trả lỗi lên caller
    console.error("Gemini request failed:", err.message);
    throw err;
  }
}

// Export function for CommonJS
module.exports = {
  generateFromGemini
};
