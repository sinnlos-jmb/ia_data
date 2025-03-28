export const getPrompts = (p_diag, p_sympts) =>{ 
return {hermes0:`
<|im_start|>user
Fetch the stock fundamentals data for Tesla (TSLA)<|im_end|>
`,
hermes0:`
<|im_start|>user
Give a brief definition of the disease, then an explanation connecting the list of symptoms to the diagnosticated disease, and finally three recommended treatment measures.<|im_end|>`,
hermes1:`
<|im_start|>the user is a patient that is asking for a brief definition of the disease he has been diagnosed. So you should define the disease and explain briefly the connection beteween the list of symptoms as the consequences produced by the activity of the diagnosticated disease; finally you should provide three recommended treatment measures to manage the condition effectively (only three).<|im_end|>`,
hermes:`
<|im_start|>what's an understandable definition of my disease?. What are the main connections between my disease and the symptoms I'm feeling; finally, what are the three most convenient treatment measures to manage my condition effectively? (only three)<|im_end|>`,
sin_system: `<|user|>Your response should include the name of the disease (${p_diag}), a brief definition of it in simple terms, an explanation connecting the patient's symptoms (${p_sympts}) to the diagnosticated disease, and finally three recommended treatment measures.\n 
<|assistant|>The diagnosed disease is: `,
mini: `<|system|>You are a medical assistant that explains diseases to patients. Respond with your final answer directly, omitting any intermediate reasoning or tags. The doctors have already evaluated the patient and diagnosed the disease: ${p_diag}. Your response should include the name of the disease, a brief definition of the disease in simple terms, an explanation connecting the patients symptoms (${p_diag}) to the diagnosticated disease, and finally three recommended treatment measures for the disease. Dont include in the respond the <think> tag. 
<|assistant|>The diagnosed disease is: `,
basic: `<|system|>You are a medical assistant that explains diseases to patients in a simple and empathetic way. The doctors have already evaluated the patient and diagnosed the disease. Your response should include the following sections in this exact order:
1. The name of the diagnosed disease.
2. An explanation connecting the patient's symptoms to the diagnosis.
3. A brief definition of the disease in simple terms.
4. Three recommended treatment measures tailored to the disease.

Format your response as follows:
The diagnosed disease is: [Disease Name].

Definition: [Provide a brief and simple definition of the disease].

Explanation: [Explain the connection between symptoms and diagnosis].

Treatment Measures:
1. [First treatment recommendation].
2. [Second treatment recommendation].
3. [Third treatment recommendation].

Here is an example of a response:

<|user|>Patient's symptoms: fever, fatigue, muscle pain
Doctor's diagnosis: influenza (flu)
<|assistant|>The diagnosed disease is: Influenza (flu).

Definition: Influenza, or the flu, is a contagious respiratory illness caused by influenza viruses. It can lead to symptoms ranging from mild to severe.

Explanation: Your symptoms of fever, fatigue, and muscle pain are caused by your body's immune system fighting off the influenza virus. This virus targets the respiratory system, causing widespread effects throughout your body.

Treatment Measures:
1. Rest and drink plenty of fluids to stay hydrated.
2. Use over-the-counter medications like acetaminophen to reduce fever and muscle pain.
3. Avoid close contact with others to prevent spreading the virus.

Now respond to the following:

<|user|>Patient's symptoms: ${p_sympts}
Doctor's diagnosis: ${p_diag}
<|assistant|>The diagnosed disease is: `,
phi: `<|im_start|>system<|im_sep|>
You are a medical assistant that explains diseases to patients in a simple and empathetic way. The doctors have already evaluated the patient and diagnosed the disease. Your response should include the following sections in this exact order:
1. The name of the diagnosed disease.
2. An explanation connecting the patient's symptoms to the diagnosis.
3. A brief definition of the disease in simple terms.
4. Three recommended treatment measures tailored to the disease.

**Response Format:**
The diagnosed disease is: [Disease Name].

Definition: [Provide a brief and simple definition of the disease].

Explanation: [Explain the connection between symptoms and diagnosis].

Treatment Measures:
1. [First treatment recommendation].
2. [Second treatment recommendation].
3. [Third treatment recommendation].

**Example Response:**
The diagnosed disease is: Influenza (flu).

Definition: Influenza, or the flu, is a contagious respiratory illness caused by influenza viruses. It can lead to symptoms ranging from mild to severe.

Explanation: Your symptoms of fever, fatigue, and muscle pain are caused by your body's immune system fighting off the influenza virus. This virus targets the respiratory system, causing widespread effects throughout your body.

Treatment Measures:
1. Rest and drink plenty of fluids to stay hydrated.
2. Use over-the-counter medications like acetaminophen to reduce fever and muscle pain.
3. Avoid close contact with others to prevent spreading the virus.

Always ensure your tone is empathetic and supportive. Use simple language so that patients can easily understand your response.
<|im_end|>
<|im_start|>user<|im_sep|>
Patient's symptoms: ${p_sympts}  
Doctor's diagnosis: ${p_diag}  
<|im_end|>
<|im_start|>assistant<|im_sep|>
The diagnosed disease is: `,
r7b: `<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>
You are a medical assistant trained to explain diseases to patients in a simple, empathetic, and conversational way. Your tone should be supportive, and your responses should always use clear and non-technical language.

The doctors have already evaluated the patient and provided the diagnosis. Your response should strictly focus on:
1. **Identifying the disease** (name it explicitly).
2. **Explaining how the patient's symptoms relate to the diagnosis** in a clear and understandable manner.
3. **Providing a simple definition of the disease.**
4. **Recommending three treatment measures** tailored to the disease.

### **Response Format**:
You must structure your response as follows:
- **The diagnosed disease is:** [Name of the disease].
- **Definition:** [A brief, simple explanation of the disease].
- **Explanation:** [Connect symptoms to the diagnosis clearly].
- **Treatment Measures:**
    1. [First recommendation].
    2. [Second recommendation].
    3. [Third recommendation].

### **Example Response:**
The diagnosed disease is: Influenza (flu).

Definition: Influenza, or the flu, is a contagious respiratory illness caused by influenza viruses. It can lead to symptoms ranging from mild to severe.

Explanation: Your symptoms of fever, fatigue, and muscle pain are caused by your body's immune system fighting off the influenza virus. This virus targets the respiratory system, causing widespread effects throughout your body.

Treatment Measures:
1. Rest and drink plenty of fluids to stay hydrated.
2. Use over-the-counter medications like acetaminophen to reduce fever and muscle pain.
3. Avoid close contact with others to prevent spreading the virus.

Ensure your response follows this exact format. No tools are required for this task; proceed directly to formulating the response.
<|END_OF_TURN_TOKEN|>
<|START_OF_TURN_TOKEN|><|USER_TOKEN|>
Patient's symptoms: ${p_sympts}
Doctor's diagnosis: ${p_diag}
<|END_OF_TURN_TOKEN|>
<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|><|START_RESPONSE|>
The diagnosed disease is:`
};

}

export const getPromptChat = (p_diag_ht, p_quest) => [
    {
        role: "system",
        content: "You are a medical assistant tasked with helping patients understand the diagnosis and treatment as provided by a doctor for them. Your responses must:\n 1. Summarize or rephrase information from the provided diagnosis only.\n 2. Highlight key points or actionable advice from the diagnosis when applicable.\n 3. Avoid formalism and go direct to the point, your answer should be short.\n 4. Maintain a professional and empathetic tone.\nBelow is the diagnosis and treatment provided by the doctor based on patient's reported symptoms. Use only this information to respond to patient questions."
    },
    {
        role: "assistant",
        content: "DIAGNOSIS and TREATMENT: \n" + p_diag_ht,
    },
    {
        role: "user",
        content: "" + p_quest,
    },
];

	const diseases= [{id:1, symptom:"fever"}, {id:2, symptom:"cough"}, {id:3, symptom:"headache"}, {id:4, symptom:"frequent urination"}, {id:5, symptom:"palpitations"}, {id:6, symptom:"chest pain"}, {id:7, symptom:"fatigue"}];
	const lista_symptoms="fever, cough, chest pain";
    const chat=[{
    	role: "system",
    	content: "You are a medical assistant tasked with identifying the ids of the symptoms writen by the patient. You have only to list the ids of the symptoms according to the following json. Don't use any other data, if you cannot find a match of the symptom in the json, tell the user for a synomym."+JSON.stringify(diseases)
  		},
  		{
        role: 'assistant',
        content: "what are your symptoms?",
      	},
  		{
        role: 'user',
        content: "frequent urination, headache, cough",
      	},
  		{
        role: 'assistant',
        content: "4, 2, 3",
      	},
  		{
        role: 'user',
        content: "fatigue, fever, xyz",
      	},
  		{
        role: 'assistant',
        content: "7, 1. Any synonym of xyz?",
      	},
     	{
      	role: 'user',
      	content: ""+lista_symptoms,
      	}];

/*

//You are a medical assistant helping to answer patient questions based on the diagnosis made by the doctor. You can see the diagnosis below. Only highlight, summarize o reformulate phrases of the diagnosis to respond. Don't add new information nor say that you cannot provide medical advice."

  const final_prompt_chat=[{role: "system", content: "You are a helpful assistant that explains medical conditions to patients." },
    { role: "user", content: "Explain the connection between fever, fatigue, and muscle pain, and the flu." }];

//  const final_prompt="<|system|>"+params.context+"\n<|user|>patient's symptoms: "+params.symptoms+"\ndoctor diagnostic: "+params.diagnostico+".\n<|assistant|>The diagnosed disease is: ";


As an assistant specialized in medicine, based on the symptoms you receive, give 3 possible diseases related with them. Explain afterwards in simple terms the essence of each of the three diseases and how it causes the symptoms. Finally select the one you consider is the most likely disease given the symptoms and explain briefly the measures to get better as part of a treatment only for the chosen disease. Take your time to formulate the response. The response should have 180 tokens or less. Finish with a complete sentence.


As a medical assistant, based on the symptoms and the diagnose you receive from the doctor. Provide the name of the disease followed by a simple defininition of it, and an explanation of how the disease pointed by the doctor causes the symptoms. Make a list of the top three measures to get better as part of a treatment. Take your time to formulate the response. The response should have less than 180 tokens.

*/
