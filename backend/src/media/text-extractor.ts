import { readFile } from 'node:fs/promises';
import { inflateRawSync, inflateSync } from 'node:zlib';

const MAX_TEXT = 60_000;
const MAX_ARCHIVE_ENTRIES = 256;
const MAX_ENTRY_OUTPUT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_OUTPUT_BYTES = 24 * 1024 * 1024;
const MAX_PDF_STREAM_OUTPUT_BYTES = 8 * 1024 * 1024;

function decodeXml(text: string): string {
  return text
    .replace(/<w:tab\s*\/>|<a:tab\s*\/>/g, '\t')
    .replace(/<w:br\s*\/>|<a:br\s*\/>|<\/w:p>|<\/a:p>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function zipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let totalOutputBytes = 0;
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65_557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) return entries;
  const total = Math.min(buffer.readUInt16LE(eocd + 10), MAX_ARCHIVE_ENTRIES);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let index = 0; index < total && offset + 46 <= buffer.length; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    if (offset + 46 + nameLength + extraLength + commentLength > buffer.length) break;
    if (localOffset + 30 > buffer.length) break;
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    if (dataStart > buffer.length || dataStart + compressedSize > buffer.length) break;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    try {
      let output: Buffer | undefined;
      if (method === 0 && compressed.length <= MAX_ENTRY_OUTPUT_BYTES) output = compressed;
      if (method === 8) {
        output = inflateRawSync(compressed, { maxOutputLength: MAX_ENTRY_OUTPUT_BYTES });
      }
      if (output && totalOutputBytes + output.length <= MAX_TOTAL_OUTPUT_BYTES) {
        entries.set(name, output);
        totalOutputBytes += output.length;
      }
    } catch {
      // ข้าม entry ที่เสียหาย แต่ยังสกัด entry อื่นต่อได้
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function officeText(buffer: Buffer, extension: string): string {
  const entries = zipEntries(buffer);
  const names = [...entries.keys()].filter((name) =>
    extension === '.docx'
      ? name === 'word/document.xml' || name.startsWith('word/header') || name.startsWith('word/footer')
      : /^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/.test(name),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return names.map((name) => decodeXml(entries.get(name)?.toString('utf8') ?? '')).join('\n\n').slice(0, MAX_TEXT);
}

function pdfLiteralText(value: string): string {
  return value.replace(/\\([nrtbf()\\])/g, (_match, escaped: string) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' }[escaped] ?? escaped));
}

function extractPdfStrings(content: Buffer): string[] {
  const text = content.toString('latin1');
  return [...text.matchAll(/\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")/g)].map((match) => pdfLiteralText(match[0].slice(1, match[0].lastIndexOf(')'))));
}

function pdfText(buffer: Buffer): string {
  const chunks = extractPdfStrings(buffer);
  const raw = buffer.toString('latin1');
  for (const match of raw.matchAll(/<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    if (!/FlateDecode/.test(match[1])) continue;
    try {
      const inflated = inflateSync(Buffer.from(match[2], 'latin1'), {
        maxOutputLength: MAX_PDF_STREAM_OUTPUT_BYTES,
      });
      chunks.push(...extractPdfStrings(inflated));
    } catch { /* ข้าม stream ที่ถอดไม่ได้หรือขยายใหญ่เกินกำหนด */ }
  }
  return chunks.join('\n').replace(/\s+\n/g, '\n').trim().slice(0, MAX_TEXT);
}

export async function extractTextFromFile(path: string, name: string): Promise<string> {
  const extension = name.toLowerCase().slice(name.lastIndexOf('.'));
  if (!['.pdf', '.docx', '.pptx'].includes(extension)) return '';
  const buffer = await readFile(path);
  if (extension === '.pdf') return pdfText(buffer);
  return officeText(buffer, extension);
}
