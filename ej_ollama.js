// index.js
import readline from "readline";
import { Ollama } from "./Ollama.js";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const ollama = new Ollama();

ollama.setModel("phi4-mini:latest n");
ollama.setSystemMessage("Eres un asistente útil.");
ollama.setOptions({ temperature: 0.5, maxTokens: 100, stream: true });

rl.question("🧠 Escribe tu prompt: ", async userPrompt => {
	ollama.setPrompt(userPrompt);
	console.log("\n🤖 Respuesta de Ollama:\n");

	await ollama.getResponse();

	console.log("\n✅ Fin de la respuesta.");
	rl.close();
});