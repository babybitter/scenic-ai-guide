import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

// A .docx is a ZIP container; the body lives in word/document.xml. We read that
// single entry directly from the ZIP central directory with Node's zlib instead
// of shelling out to tar/unzip — that keeps extraction dependency-free,
// encoding-safe for Chinese paths, and cross-platform.
export function extractDocxText(filePath) {
  const buffer = readFileSync(filePath);
  const xml = readZipEntry(buffer, "word/document.xml");
  if (xml == null) {
    const error = new Error(`word/document.xml not found in ${filePath}`);
    error.code = "DOCX_ENTRY_NOT_FOUND";
    throw error;
  }
  return docxXmlToText(xml.toString("utf8"));
}

// Minimal ZIP reader: locate the End Of Central Directory record, walk the
// central directory to find the named entry, then inflate its local data.
// Using central-directory sizes means entries written with a streaming data
// descriptor (sizes zeroed in the local header) still read correctly.
function readZipEntry(buffer, entryName) {
  const EOCD_SIGNATURE = 0x06054b50;
  const target = Buffer.from(entryName, "utf8");

  let eocd = -1;
  const minEocd = 22;
  const scanStart = Math.max(0, buffer.length - (minEocd + 0xffff));
  for (let offset = buffer.length - minEocd; offset >= scanStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  if (eocd === -1) {
    return null;
  }

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let pointer = buffer.readUInt32LE(eocd + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) {
      break;
    }
    const method = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const nameStart = pointer + 46;
    const name = buffer.subarray(nameStart, nameStart + nameLength);

    if (name.equals(target)) {
      return readLocalEntry(buffer, localOffset, method, compressedSize);
    }
    pointer = nameStart + nameLength + extraLength + commentLength;
  }

  return null;
}

function readLocalEntry(buffer, localOffset, method, compressedSize) {
  if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
    return null;
  }
  const nameLength = buffer.readUInt16LE(localOffset + 26);
  const extraLength = buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  const data = buffer.subarray(dataStart, dataStart + compressedSize);

  // method 0 = stored (no compression), method 8 = raw DEFLATE.
  return method === 0 ? Buffer.from(data) : inflateRawSync(data);
}

export function docxXmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
