const axios = require("axios");

/**
 * Generate a diagnosis using the Llama 3 LLM.
 */
const generateDiagnosis = async (symptoms, context) => {
  try {
    const prompt = "You are a medical assistant. Based on the symptoms: "+symptoms+" and the following related information: "+context;
	console.log("por llamar a llama3.2: \nprompt: "+prompt);
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2",
      prompt,
    }, {
      responseType: "stream",
    }
    );
    
    
    return new Promise((resolve, reject) => {
      let result = "";

      response.data.on("data", (chunk) => {
        try {
          const parsedChunk = JSON.parse(chunk.toString());
          if (parsedChunk.response) {
            result += parsedChunk.response;
          }
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }
      });

      response.data.on("end", () => resolve(result.trim()));
      response.data.on("error", (error) => reject(error));
    });  } catch (error) {
    console.error("Error generating diagnosis:", error);
    throw new Error("Failed to generate diagnosis.");
  }
};

module.exports = { generateDiagnosis };
