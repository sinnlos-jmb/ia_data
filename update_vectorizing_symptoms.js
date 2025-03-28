// Import necessary modules
import pkg from 'pg';
import { pipeline } from '@xenova/transformers';

// PostgreSQL connection setup
const {Pool}=pkg;
const pool = new Pool({
        user: 'sinnlos',
        host: 'localhost',
        database: 'ia_data',
        password: '1234',
        port: 5432,
});

// Load transformer model pipeline for embedding generation
(async () => {
  console.log('Initializing embedding model...');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const embedder2 = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2');

  try {
    // Step 1: Fetch all symptoms from the database
    console.log('Fetching symptoms from the database...');
    const symptoms = await pool.query('SELECT id, name FROM symptoms');

    // Step 2: Iterate over each symptom, generate embedding, and update the database
    console.log('Vectorizing symptoms...');
    for (const symptom of symptoms.rows) {
    	//console.log("symptom.name)"+symptom.name);
//      	const embedding = (await embedder(symptom.name));
//      	const flattenedVector = Array.from(embedding.data);
//      	const formattedVector = JSON.stringify(flattenedVector);

    const queryEmbedding = await embedder(symptom.name, { pooling: 'mean', normalize: true });
    const queryEmbedding2 = await embedder2(symptom.name, { pooling: 'mean', normalize: true });
	const values = Object.values(queryEmbedding.data);
	const values2 = Object.values(queryEmbedding2.data);
	//values=JSON.parse(`[${values.join(',')}]`); 
    if (!Array.isArray(values) || values.length !== 384) {
	        throw new Error(`values is not a valid 384-dimensional array: ${values[0]}`				);}      	
      	
		//console.log("embedding.data: "+embedding.data);
  const numericValues = values.map(Number);// Convert embedding values to numbers
  const numericValues2 = values2.map(Number);// Convert embedding values to numbers

      	// Step 3: Update the vector field in the database
      	await pool.query(
        	'UPDATE symptoms SET vector2 = $1, vector3=$2 WHERE id = $3',
        	[`[${numericValues}]`,`[${numericValues2}]`, symptom.id]
	      	);
      	console.log(`Updated vector for symptom: ${symptom.name}`);
   		}
   	

    console.log('All symptoms have been vectorized successfully.');
  } catch (error) {
    console.error('An error occurred during the vectorization process:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
})();
