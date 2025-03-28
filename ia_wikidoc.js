const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());

// Load the dataset once
const datasetPath = path.resolve(__dirname, "./data/train.json");
let dataset = [];

try {
  dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  console.log("Dataset loaded successfully.");
} catch (error) {
  console.error("Error loading dataset:", error);
}

/**
 * Filter dataset for relevant entries based on user symptoms.
 */
const filterDatasetBySymptoms = (symptoms) => {
  return dataset.filter((entry) =>
    symptoms.some((symptom) =>
      entry.instruction.toLowerCase().includes(symptom.toLowerCase())
    )
  );
};

/**
 * Generate diagnosis using Ollama Llama 3.2.
 */
const generateDiagnosis = async (symptoms, context) => {
  const prompt = `
    The user reports the following symptoms: ${symptoms.join(", ")}.
    Relevant medical information:
    ${context}
    Provide a potential diagnosis and advice based on this information.
  `;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama-3.2",
      prompt,
    });
    return response.data.generated_text.trim();
  } catch (error) {
    console.error("Error generating diagnosis:", error.response?.data || error.message);
    throw new Error("Failed to generate diagnosis.");
  }
};

/**
 * POST /diagnosis
 * Generates a diagnosis based on user symptoms and dataset context.
 */
app.post("/diagnosis", async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: "Symptoms must be provided as an array." });
  }

  try {
    // Filter dataset for relevant entries
    const relevantData = filterDatasetBySymptoms(symptoms);
    const context = relevantData
      .map((entry) => `Instruction: ${entry.instruction}\nResponse: ${entry.response}`)
      .join("\n\n");

    if (!context) {
      console.log("No relevant context found for symptoms.");
    }

    // Generate diagnosis using Llama 3.2
    const diagnosis = await generateDiagnosis(symptoms, context || "No additional context available.");
    res.json({ diagnosis });
  } catch (error) {
    console.error("Error processing diagnosis:", error);
    res.status(500).json({ error: "Failed to generate diagnosis." });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
