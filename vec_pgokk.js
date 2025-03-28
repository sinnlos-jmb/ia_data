import fs from 'fs';
import { pipeline } from '@xenova/transformers';
import pg from 'pg';
const { Client } = pg;

async function insertData(filePath) {
    // Initialize PostgreSQL client
    const dbClient = new Client({
        user: 'sinnlos',
        host: 'localhost',
        database: 'ia_data',
        password: '1234',
        port: 5432, // Default PostgreSQL port
    });

    await dbClient.connect();

    // Load JSON data
    const diseasesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Initialize embedding pipeline
    const embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    for (const record of diseasesData) {
        try {
            // Combine fields to form the text for embedding
            const text = `${record.symptoms}`;
            // Generate embedding
            let embedding = await embeddingPipeline(text, { pooling: 'mean', normalize: true });
            
            // Extract embedding data from object
            if (embedding && embedding.data) {
                embedding = Object.values(embedding.data); // Convert `data` object to an array
            	}
            
            
            // Validate embedding length
            if (!Array.isArray(embedding) || embedding.length !== 384) {
                throw new Error(`Embedding is not a valid 384-dimensional array: ${JSON.stringify(embedding)}`);
            }            
            
            // Format embedding as a PostgreSQL-compatible vector
            const formattedEmbedding = `[${embedding.join(',')}]`;                    

            const query = `
                INSERT INTO diseases (
                    disease, disease_explanation, diagnosis,
                    diagnosis_explanation, metadata, symptoms, embedding
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            const values = [
                record.disease,
                record.disease_explanation,
                record.diagnosis,
                record.diagnosis_explanation,
                JSON.stringify(record.metadata),
                JSON.stringify(record.symptoms),
                formattedEmbedding 
            ];

            await dbClient.query(query, values);
            console.log(`Inserted record with ID: ${record.id}`);
        } catch (err) {
            console.error(`Error inserting record ${record.id}:`, err.message);
        }
    }

    // Close database connection
    await dbClient.end();
}

// Run the function
(async () => {
    const filePath = './diseases.json'; // Replace with your file path
    await insertData(filePath);
})();
