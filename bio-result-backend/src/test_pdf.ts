import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';

async function extractStreams(name: string) {
  const p = path.join(process.cwd(), 'templates', name);
  const bytes = fs.readFileSync(p);
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPages()[0];
  const { Contents } = page.node.normalizedEntries();
  console.log(`\n=== ${name} ===`);
  
  const contentRefs = Array.isArray(Contents) ? Contents : [Contents];
  for (const ref of contentRefs) {
    const stream = doc.context.lookup(ref);
    if (stream && (stream as any).getContents) {
      let raw = (stream as any).getContents();
      try {
        raw = zlib.inflateSync(Buffer.from(raw));
      } catch (e) {}
      const text = Buffer.from(raw).toString('utf-8');
      // Look for 1 0 0 1 x y cm or Tm with y between 50 and 230
      const matches = text.match(/(?:1 0 0 1|[\d.]+\s+0\s+0\s+[\d.]+)\s+([\d.]+)\s+([\d.]+)\s+[cT]m[^\n]*\n(?:[^\n]*\n){0,3}/g);
      if (matches) {
        for (const m of matches) {
          const parts = m.split(/\s+/);
          const y = parseFloat(parts[parts.length - 3] || parts[4] || '0');
          // if y between 50 and 220
          console.log(`Match: ${m.replace(/\n/g, ' ')}`);
        }
      }
    }
  }
}

async function run() {
  await extractStreams('sample_hpv20.pdf');
  await extractStreams('sample_hpv40.pdf');
  await extractStreams('sample_hpv23.pdf');
}
run();
