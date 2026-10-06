import { writeFileSync } from 'node:fs';
import { buildOpenApiDocument } from '../src/docs/openapi.js';

const document = buildOpenApiDocument();
const outPath = new URL('../../docs/openapi.json', import.meta.url);
writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n', 'utf8');
console.log(`Wrote OpenAPI document to ${outPath.pathname}`);
