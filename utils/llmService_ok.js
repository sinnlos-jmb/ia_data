import http from "http";




/**
 * Generate a diagnosis using an llm model.
 * @returns {Promise<string>} - The generated diagnosis from the LLM.
 */
export const generateDiagnosis = async (llm, sys, prompt, is_chat, max_tokens, onChunk) => {
  try {
    
    //console.log(prompt);
    let payload, apiUrl;
    if (is_chat){
    	apiUrl = "http://localhost:11434/api/chat";
    	payload = JSON.stringify({ 
    		model: llm, 
    		messages:prompt,
    		options: {  "temperature": 0.3, 
    					"seed": 123, 
    					"mirostat": 1,
    					"mirostat_tau": 1,
    					"repeat_last_n": 0,
    					"top_k": 5,
    					"top_p": 0.2,
    					"num_ctx": 896,
    					"stop": [
        					"<|system|>",
        					"<|user|>",
        					"<|end|>",
        					"<|assistant|>"
    						],
    					"num_predict": max_tokens },//max_tokens: 250
      		 }); 
    	}
    else {
		console.log("ia generativa: \nprompt: "+prompt+"\nsystem: "+sys+"\nmodel: "+llm);
    	apiUrl = "http://localhost:11434/api/generate";
    	payload = JSON.stringify({ 
    			model: llm, 
    			prompt:prompt,
    			system: sys,
       			raw:false,
       			//format:"json",stream:false
       			stream:true,
    			options: {  "temperature": 0, 
    						"seed": 123,
    						"mirostat": 1,
    						"mirostat_tau": 1,
    						"repeat_last_n": 0,
    						"top_k": 5,
    						"top_p": 0.2,
    					"stop": [
        					"<|user|>",
        					"<|assistant|>"
    						],    						
    						"num_predict": max_tokens },//max_tokens: 250
      		 	}); 
    
    	}


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


    return new Promise((resolve, reject) => {
      	let responseData = "";
	
      	const request = http.request(options, (response) => {
 
        	response.on("data", (chunk) => {
          	try {
	          	let parsedChunk = JSON.parse(chunk.toString());
				if (is_chat){
            		if (parsedChunk.message.content) {
              			responseData += parsedChunk.message.content;
              			onChunk(parsedChunk.message.content); // Stream the chunk
              			}
              		}
              	else {
            		if (parsedChunk.response) {
              			responseData += parsedChunk.response;
              			onChunk(parsedChunk.response); // Stream the chunk
              			}
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

    
  } catch (error) {
    console.error("Error consulting LLM:", error.response?.data || error.message);
    throw new Error("Failed to generate diagnosis.");
  }
};
