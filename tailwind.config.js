import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read all source files to extract Tailwind class usage.
function collectSourceContent() {
  const dirs = ['components', 'pages', 'src'];
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const raw = [];

  // Read index.html
  raw.push(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
  // Read App.tsx
  raw.push(fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8'));

  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) continue;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (exts.some(e => entry.name.endsWith(e))) {
          raw.push(fs.readFileSync(full, 'utf8'));
        }
      }
    };
    walk(dirPath);
  }

  return raw.join('\n');
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    { raw: collectSourceContent(), extension: 'tsx' },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#364FC7',
          accent: '#6A11CB'
        }
      }
    },
  },
  plugins: [],
};
