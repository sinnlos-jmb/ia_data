import fs from 'fs';
import { pipeline } from '@xenova/transformers';
import pg from 'pg';
const { Client } = pg;

 const dbClient = new Client({
  user: 'sinnlos',
  host: 'localhost',
  database: 'ia_data',
  password: '1234',
  port: 5432,
});



async function querySimilar(queryText) {
	console.log(queryText);
    await dbClient.connect();
    // Initialize embedding pipeline
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    // Generate embedding for the query
    const queryEmbedding = await embedder(queryText, { pooling: 'mean', normalize: true });

	const values = Object.values(queryEmbedding.data);
	//values=JSON.parse(`[${values.join(',')}]`); 
    if (!Array.isArray(values) || values.length !== 384) {
	        throw new Error(`values is not a valid 384-dimensional array: ${values[0]}`				);}

  const numericValues = values.map(Number);// Convert embedding values to numbers

// Build SQL query dynamically
  const placeholders = numericValues.map((_, i) => `$${i + 1}`).join(', ');
 
  /*console.log(numericValues[0]+numericValues[1]);
  console.log(typeof numericValues[0]);
  console.log(typeof numericValues);
  console.log(Array.isArray(numericValues) );
  console.log(numericValues); */
  const query = `
    SELECT id, symptom, disease, metadata, keywords,
           1 - (vector <#> $1::vector) AS similarity
    FROM diseases
    ORDER BY similarity DESC
    LIMIT 5;
  `; 

    const result = await dbClient.query(query, [`[${numericValues.join(',')}]`]);
    console.log('Query Results:', result.rows);

    await dbClient.end();// Close database connection
}


// Main function
async function main() {
    await querySimilar("chest pain and reduced blood flow to the heart");
}

main().catch(console.error);
