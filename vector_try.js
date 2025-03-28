import { pipeline } from "@xenova/transformers";

const generateEmbedding = async (text) => {
  const embedder = await pipeline("feature-extraction", "Xenova/sentence-transformers/all-MiniLM-L6-v2");
  const embedding = await embedder(text, { pooling: "mean", normalize: true });
  return embedding.data;
};

(async () => {
  const embedding = await generateEmbedding("fever and headache");
  console.log("Embedding:", embedding);
})();
