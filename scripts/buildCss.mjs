#!/usr/bin/env node
/**
 * Pre-build Tailwind CSS.
 * Bypasses fast-glob by reading source files directly (fs.readFileSync)
 * and passing raw content to Tailwind's PostCSS plugin.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// 1. Collect all source file contents
function collectSourceContent() {
  const dirs = ['components', 'pages'];
  const exts = ['.ts', '.tsx', '.js', '.jsx'];
  const raw = [];

  raw.push(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
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

async function main() {
  console.log('[tailwind] Collecting source files...');
  const rawContent = collectSourceContent();
  console.log(`[tailwind] ${rawContent.length} chars of source content collected`);

  const inputCss = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');

  console.log('[tailwind] Processing CSS with Tailwind + Autoprefixer...');
  const result = await postcss([
    tailwindcss({
      content: [{ raw: rawContent, extension: 'tsx' }],
      theme: {
        extend: {
          colors: {
            brand: { DEFAULT: '#364FC7', accent: '#6A11CB' },
          },
        },
      },
      plugins: [],
    }),
    autoprefixer(),
  ]).process(inputCss, { from: path.join(__dirname, 'index.css') });

  // Write to index.compiled.css which Vite will import
  const outPath = path.join(__dirname, 'index.compiled.css');
  fs.writeFileSync(outPath, result.css);
  console.log(`[tailwind] ✅ Output written to index.compiled.css (${(result.css.length / 1024).toFixed(1)} KB)`);
}

main().catch(e => { console.error('[tailwind] ❌ Error:', e.message); process.exit(1); });
