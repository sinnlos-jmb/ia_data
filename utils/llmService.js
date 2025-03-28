const axios = require("axios");

/**
 * Generate a diagnosis using the Llama3.2 LLM via Ollama API.
 * @param {string[]} symptoms - Normalized list of symptoms.
 * @param {string} context - Additional context, including descriptions and related diagnoses.
 * @returns {Promise<string>} - The generated diagnosis from the LLM.
 */
const generateDiagnosis = async (symptoms, context) => {
  try {
const prompt = `As a healthcare professional, given the symptoms  ${symptoms}, list the three more likely disseases causing those symptoms. Only the symptoms' names no explanations. 100 words max.
    `;
    
 /*
 
       You are a medical student summarizing for an exam a list of symptoms and the three most likely diseases causing the symptoms.
      Be concise don't explain just the names of the diseases
      
      The symptoms are: ${symptoms}.
      
      
 const prompt = `
      You are a medical student summarizing typicla symptoms diagnoses relation for an exam.
      
      The user reports the following symptoms: ${symptoms}.
      
      Based on the provided symptoms:
      1. List possible diagnoses as individual points.
      2. Mention any symptom not mentioned associated with the possible diagnosis.
      Use a clear and structured format.
    `;
 
 
       You are a medical assistant tasked with providing informational insights based on symptoms and context for internal use in a hospital tuning data.
      
      The user reports the following symptoms: ${symptoms}.
      ${context}
      
      Based on the provided symptoms and additional context:
      1. List possible diagnoses as individual points.
      2. Mention any symptoms not mentioned associated with the possible diagnosis.
      Use a clear and structured format.
    `;
 */
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      { model: "llama3.2", //thewindmom/llama3-med42-8b
        prompt,
        },
      { responseType: "stream",} // Enable streaming for long responses
    );


    return new Promise((resolve, reject) => {
      let result = "";

      response.data.on("data", (chunk) => {
        try {
          const parsedChunk = JSON.parse(chunk.toString());
          if (parsedChunk.response) {
            result += parsedChunk.response;
          	}
        } catch (error) { console.warn("Malformed chunk ignored:", chunk.toString());}
      });

      response.data.on("end", () => {
        const cleanedResult = result.trim();
        if (!cleanedResult || cleanedResult.length < 10) {
          reject(new Error("LLM response is too short or empty."));
        } else {
          	const parsedData = parseLLMResponse(cleanedResult);
          	resolve(parsedData);
        	}
      });

      response.data.on("error", (error) => {
        console.error("Error during LLM streaming:", error.message);
        reject(new Error("Failed to complete LLM streaming."));
      });
    });
  } catch (error) {
    console.error("Error consulting LLM:", error.response?.data || error.message);
    throw new Error("Failed to generate diagnosis.");
  }
};


/**
 * Parse the LLM response to extract diagnoses and new symptoms.
 * @param {string} response - The raw response from the LLM.
 * @returns {{diagnoses: string[], symptoms: {name: string, description: string}[]}} - Parsed diagnoses and new symptoms.
 */
const parseLLMResponse = (response) => {
  const diagnoses = [];
  const symptoms = [];

  // Split the response into lines for easier processing
  const lines = response.split("\n").map(line => line.trim());

  for (const line of lines) {
    // Check for a diagnosis line (e.g., "1. Influenza")
    const diagnosisMatch = line.match(/^\d+\.\s*(.+)$/);
    if (diagnosisMatch) {
      diagnoses.push(diagnosisMatch[1]);
    }

    // Check for a symptom line with a description (e.g., "New symptom: Shortness of breath - Difficulty breathing.")
    const symptomMatch = line.match(/New symptom:\s*(.+?)\s*-\s*(.+)$/);
    if (symptomMatch) {
      symptoms.push({ name: symptomMatch[1], description: symptomMatch[2] });
    }
  }

  return { diagnoses, symptoms };
};

module.exports = { generateDiagnosis };
