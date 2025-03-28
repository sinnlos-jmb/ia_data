
//const { generateDiagnosis } = require("./utils/llmService_ok");
import  {generateDiagnosis, msg_prueba}  from "./utils/llmService_ok.js";

import express from "express";
import {
  getOrInsertDiagnosis,
  insertSymptomCombination,
  getSymptomIds,
  findExistingDiagnosis,
  normalize_to_array,
} from "./database.js";

const models= {
	med: "thewindmom/llama3-med42-8b", 
	meta: "llama3.2",
	phi: "phi3", 
	smoll: "smollm", 
	google: "gemma2:2b",
	ibm: "granite3.1-dense:8b",
	mistral: "mistral-nemo",
	nvidia_chat: "llama3-chatqa",
	small: "smallthinker"};
const llm=models.nvidia_chat;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the `index.html` for the root URL
app.get("/", (req, res) => {
  console.log(msg_prueba);
  res.sendFile("/home/manu/Documents/IFK/proyectos/ia_data/index.html");
});


//Generate a diagnosis based on symptoms.
app.post("/diagnosis", async (req, res) => {

  const params={symptoms: req.body.symptoms||"", diagnostico: req.body.diagnostico||""};
  let symptoms = params.symptoms;
  console.log("sintomas: "+symptoms+"\ndiagnostico: "+params.diagnostico);
  if (!symptoms) {
    return res.status(400).json({ error: "Symptoms must be provided as a string." });
  	}

  // Step 0: Validate input
  symptoms = normalize_to_array(symptoms);
  if (!Array.isArray(symptoms)) {
    return res.status(400).json({ error: "couldn't make array" });
  	}
  let symptoms_pruned=symptoms.map(str => str.replace(/\s+/g, ''));
  console.log("sintomas normalizados: "+symptoms_pruned);

if (params.diagnostico!="") {
    	const context = `
      	Patient is 60 years old and has diabetes.
    	`;
 	
		const prompt = `As a healthcare assistant ready to start a chat reassuring the patient cool. Avoid greetings, the answers should be as short as possible but informative.
		Given the symptoms  ${symptoms_pruned}, and the disease ${params.diagnostico} diagnosticated by the physician in charge. Write to the patient the preliminar explanation of the realtion between symptoms and the disease (no less that 100 words), and tell the patient you are ready to answer any question.
		Remind the physician will review the preliminar diagnosis the following day. Take your time before answer.
    	`;
    let llm_diagnosis = ""; // Variable to store the full response
    await generateDiagnosis(llm, {prompt: prompt, context: context}, (chunk) => {
    	 llm_diagnosis += chunk;
        res.write(chunk); // Write each chunk as SSE
      });
      
    if (llm_diagnosis.length==0) {
      return res.status(500).json({ error: "LLM failed to generate a diagnosis." });
    }
    res.end(); // Signal the end of the stream	
	}
else{
  console.log("genero diagnostico, no recibio en parametro");
  try {

// Step 1: Retrieve symptom IDs
    const symptomRecords = await getSymptomIds(symptoms_pruned); //array of objects
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
 	
    
  // Set up Server-Sent Events headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");    	

    //const llm_diagnosis = await generateDiagnosis(models.llama, prompt, context, (chunk) 

    	const context = `
      	Patient is 60 years old and has diabetes.
    	`;
 	
		const prompt = `As a healthcare professional, given the symptoms  ${symptoms}, list the three more likely disseases causing those symptoms. Only enumerate the three diseases names. After the enumeration pick the most likely disease and explain why is the best one to pick. No more than 100 words. Take your time before answer.
    	`;
    		let llm_diagnosis = ""; // Variable to store the full response
    await generateDiagnosis(llm, {prompt: prompt, context: context}, (chunk) => {
    	 llm_diagnosis += chunk;
        res.write(chunk); // Write each chunk as SSE
      });
      
    if (llm_diagnosis.length==0) {
      return res.status(500).json({ error: "LLM failed to generate a diagnosis." });
    }
    res.end(); // Signal the end of the stream      


    // Step 4: Store new diagnosis in the database
    const diagnosisId = await getOrInsertDiagnosis(llm_diagnosis);

    // Step 5: Link symptoms with the new diagnosis
    await insertSymptomCombination(symptomIds, diagnosisId);

    //res.status(200).json({ diagnosis: fullResponse });
   // res.status(200).send(llm_diagnosis);
    }
  } catch (error) {
    console.error("Error processing diagnosis:", error);
    res.status(500).json({ error: "Failed to generate diagnosis." });
  }
 }//fin else: diagnostico==""
});



// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
