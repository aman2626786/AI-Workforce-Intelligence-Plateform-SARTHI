import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonFiles = [path.join(projectRoot, 'src', 'data', 'fallbackResources.json')];

for (const filePath of jsonFiles) {
  const bytes = fs.readFileSync(filePath);
  const relativePath = path.relative(projectRoot, filePath);

  if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    throw new Error(`${relativePath} must be UTF-8 without a BOM.`);
  }

  try {
    JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${relativePath} is invalid JSON: ${error.message}`);
  }
}

console.log('JSON validation passed.');