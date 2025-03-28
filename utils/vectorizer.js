const tf = require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");

let model;

/**
 * Load the Universal Sentence Encoder model.
 */
const loadModel = async () => {
  if (!model) {
    console.log("Loading Universal Sentence Encoder model...");
    model = await use.load();
    console.log("Model loaded successfully.");
  }
  return model;
};

/**
 * Generate a vector embedding for a given text.
 * @param {string} text - The text to vectorize.
 * @returns {Promise<number[]>} - A promise that resolves to the embedding vector.
 */
const vectorizeText = async (text) => {
  try {
    const model = await loadModel();
    const embeddings = await model.embed([text]);
    return embeddings.arraySync()[0];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to vectorize text.");
  }
};

module.exports = { vectorizeText };
