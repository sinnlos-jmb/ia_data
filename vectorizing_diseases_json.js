import { pipeline } from '@xenova/transformers';
import { ChromaClient } from 'chromadb';
import fs from 'fs';

async function embedAndStoreDiseases() {
    const diseasesData = JSON.parse(fs.readFileSync('diseases.json', 'utf-8'));

    const embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const chromaClient = new ChromaClient();
    const collection = await chromaClient.getOrCreateCollection('diseases_embeddings');

    for (const record of diseasesData) {
        const text = `${record.symptom}: ${record.disease} - ${record.disease_explanation} Diagnosis: ${record.diagnosis}. ${record.diagnosis_explanation}`;
        const embedding = await embeddingPipeline(text, { pooling: 'mean', normalize: true });

        await collection.add({
            ids: [record.id],
            embeddings: [embedding],
            metadatas: [{
                severity: record.metadata.severity,
                category: record.metadata.category,
                keywords: record.keywords
            }],
        });

        console.log(`Embedded and stored: ${record.id}`);
    }

    console.log('All records embedded and stored in ChromaDB.');
}

embedAndStoreDiseases().catch(console.error);
