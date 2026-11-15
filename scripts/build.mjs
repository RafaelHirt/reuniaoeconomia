import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'data.json', 'favicon.svg', 'inter-latin.woff2']) await copyFile(file, `dist/${file}`);
for (const folder of ['assets', 'reuniao-subpas']) await cp(folder, `dist/${folder}`, { recursive: true });
console.log('Dashboard Glosas HUGO gerado em dist/');
