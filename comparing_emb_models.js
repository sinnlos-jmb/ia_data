import { pipeline, cos_sim } from '@xenova/transformers';

/** node comparing_emb_models.js
 * Calculate cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Cosine similarity
 */
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

(async () => {
  // Load the embedding pipeline
  console.log('Loading embedding model...');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');

//  const extractor = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5');
const token = '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';
 // const extractor = await pipeline('feature-extraction', 'SapBERT-from-PubMedBERT-fulltext');
  
  process.env.HF_TOKEN = token;
console.log('Using token:', token ? '****' : 'No token provided');


  // Words or sentences to compare
  const text1 = 'fever';
  const text2 = 'ffever';

  console.log('Generating embeddings...');
  const embedding1 = await embedder(text1, { pooling: 'mean', normalize: true });
  const embedding2 = await embedder(text2, { pooling: 'mean', normalize: true });
  
  const embedding3 = await extractor(text1, { pooling: 'mean', normalize: true });
  const embedding4 = await extractor(text2, { pooling: 'mean', normalize: true });

  // Calculate cosine similarity
  const similarity = cosineSimilarity(embedding1.data, embedding2.data);
  const similarity2 = cosineSimilarity(embedding3.data, embedding4.data);
  console.log(`Cosine Similarity between "${text1}" and "${text2}" using mini: ${similarity}`);
  console.log(`Cosine Similarity2 between "${text1}" and "${text2} using mpNet": ${similarity2}`);
  
  
  
// List of documents you want to embed
const texts = [
    'Hello world.',
    'banana',
    'train',
    'truck',
    'car',
    'grapes',
    'tennis',
    'soccer',
    'basketball',
    'watermelon',
    'onion',
    'apple',
    'fever',
    'Fever is a symptom characterized by an elevated body temperature, often due to infection.',
    'The giant panda (Ailuropoda melanoleuca), sometimes called a panda bear or simply panda, is a bear species endemic to China.',
    'I love pandas so much!',
];

// Compute sentence embeddings
const embedding5 = await embedder(texts, { pooling: 'mean', normalize: true });
const embedding6 = await extractor(texts, { pooling: 'mean', normalize: true });

// Prepend recommended query instruction for retrieval.
const query_prefix = 'Represent this sentence for searching relevant passages: '
const query_prefix2 = 'which is the simptom more similar to the following word: '

const query1 = query_prefix + 'What is a panda?';
const query2 = query_prefix2 + 'ffever';
const query3 = 'ffevver';
const query4 = 'disease';

const query=query4;
const query_embedding_phrase1 = await embedder(query2, { pooling: 'mean', normalize: true });
const query_embedding_phrase2 = await extractor(query2, { pooling: 'mean', normalize: true });
console.log(query2);
// Sort by cosine similarity score
let scores = embedding5.tolist().map(
    (embedding, i) => ({
        id: i,
        score1:cos_sim(embedding1.data, embedding),
        score: cos_sim(query_embedding_phrase1.data, embedding),
        text: texts[i],
    })
).sort((a, b) => b.score - a.score);
console.log(scores);


scores = embedding6.tolist().map(
    (embedding, i) => ({
        id: i,
        score1:cos_sim(embedding3.data, embedding),
        score: cos_sim(query_embedding_phrase2.data, embedding),
        text: texts[i],
    })
).sort((a, b) => b.score - a.score);
console.log(scores);
  
  
})();
