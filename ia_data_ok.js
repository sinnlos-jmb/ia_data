const http = require("http");
const express = require("express");
const {
  normalizeSymptoms,
  getOrInsertDiagnosis,
  insertSymptomCombination,
  getSymptomIds,
  findExistingDiagnosis,
} = require("./database");
const models= {med: "thewindmom/llama3-med42-8b", llama: "llama3.2"};

const { generateDiagnosis } = require("./utils/llmService");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the `index.html` for the root URL
app.get("/", (req, res) => {
  res.sendFile("/home/manu/Documents/IFK/proyectos/ia_data/index.html");
});

const normalize_to_array = (text) => {
  return text
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation
    .replace(/\b(the|and|or|of|to|by|a|an|is|are|in|on|for|with|such|as|can|may|be)\b/g, "") // Remove stop words
    .split(/\s+/) // Split into words
    .filter(word => word.length > 3) // Keep only meaningful words (length > 3)
    //.join(" "); // Rejoin into a single string
};

//Generate a diagnosis based on symptoms.
app.post("/diagnosis", async (req, res) => {

  let symptoms = req.body.symptoms;
  console.log("sintomas: "+symptoms);
  if (!symptoms) {
    return res.status(400).json({ error: "Symptoms must be provided as a string." });
  	}

  // Step 0: Validate input
  symptoms = normalize_to_array(symptoms);
  if (!Array.isArray(symptoms)) {
    return res.status(400).json({ error: "couldn't make array" });
  	}


  try {

// Step 1: Retrieve symptom IDs
    const symptomRecords = await getSymptomIds(symptoms); //array of objects
    const symptomIds = symptomRecords.map((record) => record.id); // array of ids
    console.log("lista de ids de sintomas a partir de los nombres: "+symptomIds);

    if (symptomIds.length < symptoms.length) {
      	return res.status(404).json({ error: "symptom not found in the dbase."});
    	}
    
   

    //STEP 2  Checking for existing diagnosis.
    const existingDiagnosis = await findExistingDiagnosis(symptomIds);

    if (existingDiagnosis) {
      	console.log("Diagnosis found in database.");
      	//return res.json({ diagnosis: existingDiagnosis });
		res.status(200).send(existingDiagnosis.diagnosis);
    	}
    else {
    	console.log("Diagnosis NOT found in database.");
	
	
    	// Step 3: Generate a diagnosis using the LLM
    	const context = `
      	The user reports the following symptoms: ${symptoms.join(", ")}.
      	Provide a potential diagnosis and advice based on this information.
    	`;
 	
		const prompt = `As a healthcare professional, given the symptoms  ${symptoms}, list the three more likely disseases causing those symptoms. Only the symptoms' names no explanations. 100 words max.
    	`;
  	const apiUrl = "http://localhost:11434/api/generate"; // Use https if applicable
  	const payload = JSON.stringify({ model: models.llama, prompt });
	
    	const fullResponse = await new Promise((resolve, reject) => {
      	const parsedUrl = new URL(apiUrl);
      	const options = {
        	hostname: parsedUrl.hostname,
        	port: parsedUrl.port,
        	path: parsedUrl.pathname,
        	method: "POST",
        	headers: {
          	"Content-Type": "application/json",
          	"Content-Length": Buffer.byteLength(payload),
        	},
      	};
	
      	let responseData = "";
	
      	const request = http.request(options, (response) => {
        	response.on("data", (chunk) => {
          	try {
            	const parsedChunk = JSON.parse(chunk.toString());
            	if (parsedChunk.response) {
              	responseData += parsedChunk.response;
            	}
          	} catch (err) {
            	console.error("Error parsing chunk:", err.message);
          	}
        	});
	
        	response.on("end", () => {
          	resolve(responseData);
        	});
	
        	response.on("error", (err) => {
          	reject(new Error(`Stream error: ${err.message}`));
        	});
      	});
	
      	request.on("error", (err) => {
        reject(new Error(`Request error: ${err.message}`));
      });

      request.write(payload);
      request.end();
    });

    console.log("LLM Full Response:", fullResponse);

    // Step 4: Store new diagnosis in the database
    const diagnosisId = await getOrInsertDiagnosis(fullResponse);

    // Step 5: Link symptoms with the new diagnosis
    await insertSymptomCombination(symptomIds, diagnosisId);

    //res.status(200).json({ diagnosis: fullResponse });
    res.status(200).send(fullResponse);
    }
  } catch (error) {
    console.error("Error processing diagnosis:", error);
    res.status(500).json({ error: "Failed to generate diagnosis." });
  }
});



// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
