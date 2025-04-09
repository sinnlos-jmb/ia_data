// Ollama.js
import http from "http";

export class Ollama {
	constructor(apiUrl = "http://localhost:11434/api/generate") {
		this.apiUrl = new URL(apiUrl);
		this.llm = "llama2";
		this.prompt = "";
		this.system = "";
		this.maxTokens = 250;
		this.temperature = 0.7;
		this.stream = true;
	}

	setModel(modelName) {
		this.llm = modelName;
	}

	setPrompt(promptText) {
		this.prompt = promptText;
	}

	setSystemMessage(systemMessage) {
		this.system = systemMessage;
	}

	setOptions({ maxTokens, temperature, stream }) {
		if (maxTokens !== undefined) this.maxTokens = maxTokens;
		if (temperature !== undefined) this.temperature = temperature;
		if (stream !== undefined) this.stream = stream;
	}

	async getResponse() {
		const payload = JSON.stringify({
			model: this.llm,
			prompt: this.prompt,
			system: this.system,
			stream: this.stream,
			options: {
				temperature: this.temperature,
				seed: 123,
				mirostat: 1,
				mirostat_tau: 1,
				repeat_last_n: 0,
				top_k: 5,
				top_p: 0.2,
				num_predict: this.maxTokens
			}
		});

		const options = {
			hostname: this.apiUrl.hostname,
			port: this.apiUrl.port,
			path: this.apiUrl.pathname,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(payload)
			}
		};

		return new Promise((resolve, reject) => {
			const req = http.request(options, res => {
				let result = "";
				res.on("data", chunk => {
					if (this.stream) {
						const lines = chunk.toString().split("\n").filter(line => line.trim() !== "");
						for (let line of lines) {
							try {
								const json = JSON.parse(line);
								process.stdout.write(json.response || "");
								result += json.response || "";
							} catch (e) {
								console.error("❌ Invalid JSON:", line);
							}
						}
					} else {
						result += chunk.toString();
					}
				});
				res.on("end", () => resolve(result));
			});

			req.on("error", e => reject(e));
			req.write(payload);
			req.end();
		});
	}
}
