import {*} from "mariadb";
import { pipeline }  from "@xenova/transformers";

// Database connection pool
const pool = mariadb.createPool({
  host: "localhost",
  user: "sinnlos",
  password: "1234",
  database: "ia_data",
});

/**
 * Generate embeddings for a given text using Xenova Transformers.
 */
const generateEmbedding = async (text) => {
  const embedder = await pipeline("feature-extraction", "Xenova/sentence-transformers/all-MiniLM-L6-v2");
  const embedding = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(embedding.data); // Convert Float32Array to standard array
};

/**
 * Precompute and store embeddings in the database.
 */
const precomputeEmbeddings = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Precompute embeddings for symptoms
    const symptoms = await connection.query("SELECT id, name FROM symptoms WHERE embedding IS NULL");
    for (const symptom of symptoms) {
      const embedding = await generateEmbedding(symptom.description);
      await connection.query("UPDATE symptoms SET embedding = ? WHERE id = ?", [JSON.stringify(embedding), symptom.id]);
    }

    // Precompute embeddings for diagnoses
    const diagnoses = await connection.query("SELECT id, diagnosis FROM diagnoses WHERE embedding IS NULL");
    for (const diagnosis of diagnoses) {
      const embedding = await generateEmbedding(diagnosis.description);
      await connection.query("UPDATE diagnoses SET embedding = ? WHERE id = ?", [JSON.stringify(embedding), diagnosis.id]);
    }

    console.log("Embeddings precomputed and stored.");
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Retrieve symptoms and diagnoses and perform similarity matching.
 */
const matchSymptomsToDiagnoses = async (userSymptoms) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch all symptoms and diagnoses
    const symptoms = await connection.query("SELECT id, description, severity, embedding FROM symptoms");
    const diagnoses = await connection.query("SELECT id, description, category, embedding FROM diagnoses");
    const symptomsDiagnoses = await connection.query("SELECT id_symptom, id_diagnosis, confidence FROM symptoms_diagnoses");

    // Generate embedding for user symptoms
    const userEmbedding = await generateEmbedding(userSymptoms.join(", "));

    // Match user symptoms to stored symptoms using embeddings
    const matchingSymptomIds = symptoms
      .filter((symptom) => {
        const symptomEmbedding = JSON.parse(symptom.embedding);
        return cosineSimilarity(userEmbedding, symptomEmbedding) > 0.8;
      })
      .map((symptom) => symptom.id);

    // Match symptoms to diagnoses with confidence filtering
    const matchingDiagnosisIds = new Set();
    for (const match of symptomsDiagnoses) {
      if (matchingSymptomIds.includes(match.id_symptom) && match.confidence > 0.7) {
        matchingDiagnosisIds.add(match.id_diagnosis);
      }
    }

    // Retrieve matching diagnoses descriptions with categories
    const matchingDiagnoses = diagnoses.filter((diagnosis) => matchingDiagnosisIds.has(diagnosis.id));

    return matchingDiagnoses;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Example Usage
 */
(async () => {
  // Step 1: Precompute and store embeddings
  await precomputeEmbeddings();

  // Step 2: Match user symptoms to diagnoses
  const userSymptoms = ["fever", "headache"];
  const diagnoses = await matchSymptomsToDiagnoses(userSymptoms);
  console.log("Matching Diagnoses:", diagnoses);
})();
