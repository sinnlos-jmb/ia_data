import fs from 'fs';
import { pipeline } from '@xenova/transformers';
import pg from 'pg';
import express from 'express';

const { Pool } = pg;

 const dbClient = new Pool({
  user: 'sinnlos',
  host: 'localhost',
  database: 'ia_data',
  password: '1234',
  port: 5432,
});
const app = express();
const port = 3000;



// Serve static HTML form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Symptom Matcher</title>
    </head>
    <body>
        <h1>Symptom Matcher</h1>
        <form action="/match-symptom" method="get">
            <label for="symptom">Enter a symptom:</label>
            <input type="text" id="symptom" name="symptom" required>
            <button type="submit">Submit</button>
        </form>
    </body>
    </html>
  `);
});


// Endpoint for symptom matching
app.get('/match-symptom', async (req, res) => {
  const symptom = req.query.symptom;

  if (!symptom) {
    return res.status(400).send('Symptom is required');
  }

  try {
    // Step 1: Generate embedding for the input symptom
    // Generate embedding for the query

//const embedding = await embedder(symptom); // No need for pooling explicitly
////const numericValues = Array.from(embedding.data); // Convert to a flat array
//const numericValues = embedding.data.slice(0, 384);


    await dbClient.connect();
    // Initialize embedding pipeline
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const embedder2 = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2');
    // Generate embedding for the query
    const queryEmbedding = await embedder(symptom, { pooling: 'mean', normalize: true });
    const queryEmbedding2 = await embedder2(symptom, { pooling: 'mean', normalize: true });
 	console.log(symptom+"\nqueryEmbedding: "+queryEmbedding);
	const values = Object.values(queryEmbedding.data);
	const values2 = Object.values(queryEmbedding2.data);
	//values=JSON.parse(`[${values.join(',')}]`); 
    if (!Array.isArray(values) || values.length !== 384) {
	        throw new Error(`values is not a valid 384-dimensional array: ${values[0]}`				);}

  const numericValues = values.map(Number);// Convert embedding values to numbers
  const numericValues2 = values2.map(Number);// Convert embedding values to numbers
  console.log("numeric values: "+numericValues.length);
  


// Build SQL query dynamically



//const embedding = await embedder(symptom, { pooling: 'mean', normalize: true });
//console.log("embedding dims: "+embedding.dims);
//const numericValues = Array.from(embedding.data);
//console.log("numeric values: "+numericValues.length);
    // Ensure the vector is 384-dimensional
//    if (numericValues.length !== 384) {
//      throw new Error(`Generated vector has incorrect dimensions: ${numericValues.length}`);
   // }    
// Convert array to PostgreSQL-compatible format
//onst pgVector = `{${numericValues.join(',')}}`;
//const pgVector = `[${numericValues.join(',')}]`;
// Format vector with precise numbers

//const pgVector = `[${numericValues.map(v => v.toFixed(6)).join(',')}]`;

//console.log("Formatted PostgreSQL vector length:", pgVector.length);
//console.log("PostgreSQL vector preview:", pgVector.slice(0, 100));

//console.log("PostgreSQL vector format: " + pgVector);

   // Step 2: Retrieve the most similar symptoms using PostgreSQL's vector type and similarity function
    
    const query2="WITH vector_matches AS ( "+
  "SELECT id, name, 1 - (vector2 <#> $1::vector) AS vector_similarity "+
  "FROM symptoms "+
"), "+
"text_matches AS ( "+
"  SELECT id, name, similarity(name, '$1') AS text_similarity "+
"  FROM symptoms "+
"  WHERE similarity(name, '$1') > 0.3 "+
") "+
"SELECT "+
"  v.name, "+
"  v.vector_similarity, "+
"  t.text_similarity, "+
"  v.vector_similarity + t.text_similarity AS combined_score "+
"FROM vector_matches v "+
"LEFT JOIN text_matches t ON v.id = t.id "+
"ORDER BY combined_score DESC "+
"LIMIT 5";
const query0="  SELECT id, name, similarity(name, '"+symptom+"') AS similarity "+
"  FROM symptoms where similarity(name, '"+symptom+"')>0 "+
" order by similarity desc ";
const query1=`SELECT id, name, (vector2 <#> $1::vector) AS similarity FROM symptoms ORDER BY similarity `;

	//cambiar el query por query0
	
	// probar con SELECT id, sentence, 1 - (embedding <=> %s) AS cosine_similarity  ... ORDER BY cosine_similarity 
/*    const dbResult = await dbClient.query(
      `SELECT id, name, (vector3 <#> $1::vector) AS similarity FROM symptoms ORDER BY similarity `,
      [`[${numericValues2}]`]
    );
*/
    const dbResult = await dbClient.query(query0);
    
    

   // console.log('Query Results:', dbResult.rows);



    // Step 3: Render results
    const resultHtml = `
      <h1>Symptom Matcher Results</h1>
      <p>Best match: ${dbResult.rows[0].name} (ID: ${dbResult.rows[0].id})</p>
      <h2>Top Matches</h2>
      <ul>
        ${dbResult.rows.map(row => `<li>${row.name} (Similarity: ${row.similarity.toFixed(4)})</li>`).join('')}
      </ul>
      <a href="/">Back to form</a>
    `;
    res.send(resultHtml);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
