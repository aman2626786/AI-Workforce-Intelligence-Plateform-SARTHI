import fs from 'fs';
import path from 'path';

const FALLBACK_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'fallbackResources.json');

let resources: any[] | null = null;

function loadResources(): any[] {
  try {
    if (!fs.existsSync(FALLBACK_FILE_PATH)) return [];
    const parsed = JSON.parse(fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8'));
    return Array.isArray(parsed.resources) ? parsed.resources : [];
  } catch (error) {
    console.error('Error reading fallback resource data:', error);
    return [];
  }
}

export function getStoredResources(): any[] {
  if (resources === null) resources = loadResources();
  return resources.map((resource) => ({ ...resource }));
}

export function replaceStoredResources(nextResources: any[]): void {
  resources = nextResources.map((resource) => ({ ...resource }));
}