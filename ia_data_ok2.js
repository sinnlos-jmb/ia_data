import  {generateDiagnosis}  from "./utils/llmService_ok.js";
import session from "express-session";
import express from "express";
import {getPromptChat, getPrompts} from "./utils/prompts.js"

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let options = { maxAge: '2h', etag: false };  //cambiar a 2d
app.use(express.static('public', options));
app.use(session({ secret: "1234", resave: false, saveUninitialized: false, }));



// root URL
app.get("/", (req, res) => {
  res.sendFile("/home/manu/Documents/IFK/proyectos/ia_data/index_ok.html");
  if (!req.session.diagnosis) {
		req.session.diagnosis="";
		console.log("inicializo sesion diagnostico");
		}
});


// **************
// * Diagnostic *
// **************
app.post("/diagnosis", async (req, res) => {

  if (!req.session.diagnosis) {
		req.session.diagnosis="";
		console.log("inicializo sesion diagnostico");
		}
  const params={symptoms: req.body.symptoms||"", diagnostico: req.body.diagnostico||"", context: req.body.context||"", llm: req.body.llm||"phi3"};

const prompts=getPrompts(params.diagnostico, params.symptoms);

  //console.log("context: "+params.context+"\nprompt: "+prompt);
  if (!params.context || !params.symptoms || !params.diagnostico) {
    return res.status(400).json({ error: "context & prompt must be provided." });
  	}


    try {
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		
		const system="You are a medical assistant that explains diseases to patients. The doctors have already evaluated a patient and diagnosed the disease (you are not diagnosticating, you are only explaining). Use only the diagnosed disease and the list of symptoms.\ndisease diagnosticated: "+params.diagnostico+"\nlist of symptoms: "+params.symptoms+"."
    	let llm_rta = ""; // Variable to store the full response

		await generateDiagnosis(params.llm, system, prompts.hermes, false, 680, (chunk) => {
    	 	llm_rta += chunk;
        	res.write(chunk); // Write each chunk as SSE
      	});
      	
    	if (llm_rta.length==0) {
      		return res.status(500).json({error: "LLM failed to generate a diagnosis."});
    		}
    	else {
    		req.session.diagnosis=llm_rta; 
    		console.log("almeaceno respuesta previa: "+req.session.diagnosis.substring(0,3));
    		}
    	
    	res.end(); // Signal the end of the stream
    	}
  	catch (error) {
    	console.error("Error processing diagnosis:", error);
    	res.status(500).json({ error: "Failed to generate diagnosis." });
  		}
});




// ********
// * CHAT *
// ********
app.post('/ask', async (req, res) => {
  
  const params={question: req.body.question||"", llm: req.body.llm||"phi3"};
  const prompt=getPromptChat(req.session.diagnosis, params.question);
  
  if (!params.question || params.question.trim() === '') {
    return res.status(400).json({ error: 'La pregunta no puede estar vacía.' });
  	}

let conversationContext = [
  {
    role: "system",
    content: "You are a medical assistant tasked with helping patients understand their diagnosis as provided by a doctor. Your responses must:\n 1. Summarize or rephrase information from the provided diagnosis only.\n 2. Highlight key points or actionable advice from the diagnosis when applicable.\n 3. Avoid adding new information or speculating beyond what is stated in the diagnosis.\n 4. Maintain a professional and empathetic tone.",
  },
];

//mejor hacerlo como historial de preguntas y rtas: assist: what are your symptoms, user:fever, cough, soar throat, assist: the doctor have diagnosticated influenza as the most likely disease affecting you (not malaria nor covid). user: what treatment to get better? assist: three measures to get better
//you are an medical assistant chatting with a patient. The doctor made the following diagnosis taking into consideration the patient's referred symptoms. Answer questions very briefly with clear language based only on the doctor diagnosis.



  try {
    // Add the diagnosis to the context (toda pregunta busca responderse primero con el rag, y si no hubo rtas, va al llm limitado por el diagnostico y eventualmente algun doc vinculado con la disease para hablar del origen y resultados tipicos del tratamiento... el paciente va cargando info para ver si evoluciona ok... después dejar chatear sin problemas)
    if (req.session.diagnosis && req.session.diagnosis!="") {
      console.log("\ntengo diagnostico: "+req.session.diagnosis.substring(0,3));
      conversationContext.push({
        role: 'assistant',
        content: req.session.diagnosis,
      	});
      }
	else {console.log("NO tengo diagnostico: ");}

    // Add the patient's new question to the context
    conversationContext.push({
      role: 'user',
      content: params.question,
      });
      
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive"); 
    	
    	let llm_rta = ""; // Variable to store the full response
    	await generateDiagnosis(params.llm, '', prompt , true, 350, (chunk) => {
    	 	llm_rta += chunk;
        	res.write(chunk); // Write each chunk as SSE
      	});
      	
    	if (llm_rta.length==0) {
      		return res.status(500).json({ error: "LLM failed to generate chat rta." });
    		}
    	//req.session.previousResponse=llm_rta;
    	res.end(); // Signal the end of the stream

} catch (error) {
    console.error('Error processing question:', error);
    return 'There was an issue processing your question. Please try again.';
  }


});



// ***************
// * getSymptoms *
// ***************
app.post('/symptoms', async (req, res) => {
//  const { question } = req.body;
  
  const params={lista_symptoms: req.body.lista_symptoms||"", llm: req.body.llm||"phi3"};
  console.log("lista_symptoms: "+params.lista_symptoms);
  if (!params.lista_symptoms || params.lista_symptoms.trim() === '') {
    return res.status(400).json({ error: 'La lista de sintomas no puede estar vacía.' });
  	}

let diseases= [{id:1, symptom:"fever"}, {id:2, symptom:"cough"}, {id:3, symptom:"headache"}, {id:4, symptom:"frequent urination"}, {id:5, symptom:"palpitations"}, {id:6, symptom:"chest pain"}, {id:7, symptom:"fatigue"}];
//console.log(JSON.stringify(diseases));
let vec_dis=["1. fever", "2. cough", "3. headache", "4. frequent urination", "5. palpitations", "6. chest pain", "7. fatigue"];
//console.log(vec_dis);

  try {

    const chat=[{
    	role: "system",
    	content: "You are a medical assistant tasked with identifying the ids of the symptoms reported by the patient. You have only to list the ids of the symptoms you receive according to the following list: "+vec_dis.toString()+". Don't use any other data, if you cannot find a match of the symptom, ask the user for a synomym."
  		},
  		{
        role: 'assistant',
        content: "what's the list of symptoms I should give the ids?",
      	},
  		{
      	role: 'user',
      	content: "my symptoms are: "+params.lista_symptoms,
      	}
      	];

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive"); 
    	
    	let llm_rta = ""; // full response
    	await generateDiagnosis(params.llm, '', chat , true, 560, (chunk) => {
    	 	llm_rta += chunk;
        	res.write(chunk); // Write each chunk as SSE
      	});
      	
    	if (llm_rta.length==0) {
      		return res.status(500).json({ error: "LLM failed to generate chat rta." });
    		}
    	//req.session.previousResponse=llm_rta;
    	res.end(); // end of the stream




} catch (error) {
    console.error('Error processing question:', error);
    return 'There was an issue processing your question. Please try again.';
  }


});

// Start the server
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});


/*

const chat=[{
    	role: "system",
    	content: "You are a medical assistant tasked with identifying the ids of the symptoms reported by the patient. You have only to list the ids of the symptoms you receive according to the following list: "+vec_dis.toString()+". Don't use any other data, if you cannot find a match of the symptom, ask the user for a synomym."
  		},
  		{
        role: 'assistant',
        content: "how is the id defined in the list?",
      	},
  		{
        role: 'system',
        content: "the number on the left of the disease name is the id of that disease.",
      	},
  		{
        role: 'assistant',
        content: "give me an example?",
      	},
  		{
        role: 'system',
        content: "'1. fever', indicates that the id of fever is 1",
      	},
  		{
        role: 'assistant',
        content: "another example",
      	},
  		{
        role: 'system',
        content: "'5. palpitations', indicates the id of palpitations is 5",
      	},
  		{
        role: 'assistant',
        content: "what's the list of symptoms I should give the ids?",
      	},
  		{
      	role: 'user',
      	content: "my symptoms are: "+params.lista_symptoms,
      	}
      	];
*/