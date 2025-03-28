import { pipeline } from '@xenova/transformers';

let extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
let result = await extractor('diarrhea', { pooling: 'mean', normalize: true });
console.log(result);
// Tensor {
//     type: 'float32',
//     data: Float32Array [0.09094982594251633, -0.014774246141314507, ...],
//     dims: [1, 384]
// }
