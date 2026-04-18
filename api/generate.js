const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ override: true });

const app = express();
const port = process.env.PORT || 3000;

// Initialize Gemini
if (process.env.GEMINI_API_KEY) {
  const key = process.env.GEMINI_API_KEY;
  console.log(`API Key detected: ${key.slice(0, 6)}...${key.slice(-4)}`);
} else {
  console.log("API Key MISSING from process.env.GEMINI_API_KEY");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Favicon placeholder
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Generic AI completion helper with Fallback
async function getAIResponse(prompt) {
  const modelsToTry = [
    "gemini-1.5-flash", 
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash", 
    "gemini-2.0-flash-exp", 
    "gemini-1.5-pro",
    "gemini-2.5-flash"
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const fallbackModel = genAI.getGenerativeModel({ model: modelName });
      const result = await fallbackModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      if (error.message.includes("API key expired")) throw error;
      console.warn(`${modelName} failed: ${error.message}`);
      continue;
    }
  }
  throw lastError;
}

// API Routes
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const text = await getAIResponse(prompt);
    res.json({ text });
  } catch (error) {
    const errorMsg = error.message || "Unknown Error";
    let userMessage = "Failed to generate content";

    if (errorMsg.includes("API key expired") || errorMsg.includes("INVALID_ARGUMENT")) {
      userMessage = "API Key Expired or Invalid. Please renew your key in the dashboard.";
    } else if (errorMsg.includes("Quota exceeded") || errorMsg.includes("429")) {
      userMessage = "Quota Exceeded. Please try again later or use a different key.";
    } else if (errorMsg.includes("not found")) {
      userMessage = "Model not found. Please check your project settings.";
    }

    console.error("Final Error:", errorMsg);
    res.status(500).json({ error: userMessage, details: errorMsg });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
