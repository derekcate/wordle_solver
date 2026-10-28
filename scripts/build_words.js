// Builds site/words.json from the word lists in data/.
// Run with: npm run build
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function readWords(file) {
  const text = readFileSync(path.join(root, 'data', file), 'utf8');
  const words = new Set();
  for (const line of text.split(/\r?\n/)) {
    const word = line.trim().toLowerCase();
    if (/^[a-z]{5}$/.test(word)) words.add(word);
    else if (word) console.warn(`Skipping "${line}" in ${file}`);
  }
  return words;
}

const official = readWords('official_wordle_words.txt');
const all = readWords('all_5_letter_words.txt');
const other = [...all].filter((w) => !official.has(w));

const output = { official: [...official].sort(), other: other.sort() };
writeFileSync(path.join(root, 'site', 'words.json'), JSON.stringify(output));

console.log(`Wrote site/words.json: ${output.official.length} official, ${output.other.length} other`);
