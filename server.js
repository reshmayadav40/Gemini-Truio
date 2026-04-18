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

// Generic AI completion helper with Fallback
async function getAIResponse(prompt) {
  const modelsToTry = ["gemini-1.5-flash", "gemini-2.5-flash"];
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
      // If it's an expiration error, don't bother trying other models
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
    let message = "Failed to generate content";
    if (error.message.includes("API key expired")) {
      message =
        "API Key Expired. Please check your system date and renew the key.";
    } else if (
      error.message.includes("Quota exceeded") ||
      error.message.includes("429")
    ) {
      message =
        "Quota Exceeded. You have hit the daily/minute limit. Please try again in a few minutes or use a new project key.";
    } else if (error.message.includes("not found")) {
      message =
        "Model not found. All fallback models were unavailable for this key.";
    }
    console.error("Final Error:", error.message);
    res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
