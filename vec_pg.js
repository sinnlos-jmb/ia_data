// Import required modules
import fs from 'fs';
import pg from 'pg';
import { pipeline } from '@xenova/transformers';
const { Vector } = pg.types;

const { Pool } = pg;

// PostgreSQL database configuration
const pool = new Pool({
  user: 'sinnlos',
  host: 'localhost',
  database: 'ia_data',
  password: '1234',
  port: 5432,
});

// Table creation query
const createTableQuery = `
CREATE TABLE IF NOT EXISTS diseases (
  id SERIAL PRIMARY KEY,
  disease_id VARCHAR(50),
  symptom TEXT,
  disease TEXT,
  disease_explanation TEXT,
  diagnosis TEXT,
  diagnosis_explanation TEXT,
  metadata JSONB,
  keywords TEXT[],
  embedding VECTOR(768) -- Use vector type with 768 dimensions
);
`;

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(createTableQuery);
    console.log('Table initialized successfully.');
  } catch (err) {
    console.error('Error initializing table:', err);
  }
}

// Load JSON data
function loadJsonData(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Embed text data using @xenova/transformers
async function generateEmbedding(text) {
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const embeddings = await embedder(text);
  return Array.isArray(embeddings[0]) ? embeddings[0] : Array.from(embeddings[0]); // Ensure array format
}

// Insert data into PostgreSQL
async function insertData(data) {
const insertQuery = `
  INSERT INTO diseases (
    disease_id, symptom, disease, disease_explanation, diagnosis, diagnosis_explanation, metadata, keywords, embedding
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
  `;

  
  

  for (const item of data) {
  
  const embedding = await generateEmbedding(item.disease);
  const vector = new Vector(embedding);  
  
  console.log(item.disease);
  console.log(embedding);
  console.log("vector: "+vector);
  
    try {
      //const textToEmbed = `${item.symptom} ${item.disease_explanation} ${item.diagnosis_explanation}`;
      //const embedding = await generateEmbedding(textToEmbed);
      //console.log(`Generated embedding for disease ID ${item.id}:`, JSON.stringify(embedding)); // Debug

      await pool.query(insertQuery, [
        item.id,
        item.symptom,
        item.disease,
        item.disease_explanation,
        item.diagnosis,
        item.diagnosis_explanation,
        item.metadata,
        item.keywords,
        embedding,
      ]);
      console.log(`Inserted disease ID: ${item.id}`);
    } catch (err) {
      console.error(`Error inserting disease ID: ${item.id}`, err);
    }
  }
}

// Main function
async function main() {
  await initializeDatabase();
  const jsonData = loadJsonData('./diseases_small.json'); // Update the path if needed
  await insertData(jsonData);
  console.log('Data embedding and insertion complete.');
  await pool.end();
}

main().catch((err) => console.error('Error in main execution:', err));
