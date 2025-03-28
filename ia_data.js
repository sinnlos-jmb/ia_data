const express = require("express");
const {
  normalizeSymptoms,
  getOrInsertDiagnosis,
  insertSymptomCombination,
  getSymptomIds,
  findExistingDiagnosis,
} = require("./database");
const { generateDiagnosis } = require("./utils/llmService");

const app = express();
app.use(express.json());

/**
 * Generate a diagnosis based on symptoms.
 */
app.post("/diagnosis", async (req, res) => {
//  const { symptoms } = req.body; //el body del request es obj con campo symptoms array of strings
  const symptoms = req.body.symptoms;


  // Step 0: Validate input
  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: "Symptoms must be provided as an array." });
  }

  try {
    const normalizedSymptoms = normalizeSymptoms(symptoms); //array of strings
	console.log("Step 1: Normalized symptoms: "+normalizedSymptoms);

// Step 1: Retrieve symptom IDs
    const symptomRecords = await getSymptomIds(normalizedSymptoms); //array of objects
    const symptomIds = symptomRecords.map((record) => record.id); // array of ids
    console.log("lista de ids de sintomas a partir de los nombres: "+symptomIds);

    if (symptomIds.length < symptoms.length) {
      return res.status(404).json({ error: "at least one symptom not found in the dbase." });
    }
    
   

    //STEP 2  Checking for existing diagnosis.
    const existingDiagnosis = await findExistingDiagnosis(symptomIds);

    if (existingDiagnosis) {
      console.log("Diagnosis found in database.");
      return res.json({ diagnosis: existingDiagnosis });
    }
    


    // Step 3: Generate a diagnosis using the LLM
    const context = `
      The user reports the following symptoms: ${symptoms.join(", ")}.
      Provide a potential diagnosis and advice based on this information.
    `;
//    const llmDiagnosis = await generateDiagnosis(symptoms.join(", "), context);
// paso solo los sintomas, el contexto sería las definiciones locales para utilizar
// que solamente recorte y ordene de más a menos probable entre una lista que ya se le da. 
    const llmDiagnosis = await generateDiagnosis(symptoms.join(", "), "");
    //llmDiagnosis es objetos con dos campos: diagnoses que uso abajo y symptoms 
    if (!llmDiagnosis || !llmDiagnosis.diagnoses) {
      return res.status(500).json({ error: "LLM failed to generate a valid diagnosis." });
    }

    // Step 4: Storing new diagnosis in database..
    const diagnosisId = await getOrInsertDiagnosis(llmDiagnosis.diagnoses);


    // Step 5: Linking symptoms with diagnosis
    await insertSymptomCombination(symptomIds, diagnosisId);

    // Step 6: Return the diagnosis. Process complete
    res.json({ diagnosis: llmDiagnosis });
  } catch (error) {
    console.error("Error processing diagnosis:", error);
    res.status(500).json({ error: "Failed to generate diagnosis." });
  }
});



// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
