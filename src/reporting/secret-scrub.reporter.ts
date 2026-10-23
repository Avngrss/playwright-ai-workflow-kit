import fs from "node:fs";
import zlib from "node:zlib";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

/**
 * Takes every secret of .env out of what a test leaves behind — its trace (trace.zip: the values an
 * action typed, the page snapshots, request bodies) and its text attachments — before any other
 * reporter copies them into the Playwright or Allure report. A Playwright trace keeps whatever a
 * test types (a password typed on the test's own page by the `signIn` step, or by mistake), so the
 * value is replaced with "[secret]" in every form it can take there (as typed, JSON-escaped,
 * URL- and form-encoded, inside an HTTP Basic header). Runs first in playwright.config.ts, and
 * synchronously, so no reporter sees it before.
 * Secrets: every .env value whose name says PASSWORD, SECRET, TOKEN or KEY (at least 4 characters).
 */
const SECRET_NAME = /PASSWORD|SECRET|TOKEN|(^|_)KEY$/;
const MARK = Buffer.from("[secret]");

function secretForms(): Buffer[] {
  const values = Object.entries(process.env)
    .filter(([name, value]) => SECRET_NAME.test(name) && typeof value === "string" && value.length >= 4)
    .map(([, value]) => value as string);
  // As typed, JSON-escaped, URL-encoded, form-encoded (a sign-in form's body: "!" → "%21", " " → "+").
  const forms = values.flatMap((value) => [value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value), new URLSearchParams([["", value]]).toString().slice(1)]);
  // HTTP Basic (`api: basic`) sends base64 of "<login>:<password>" — each account's pair (<…>_LOGIN beside <…>_PASSWORD).
  for (const [name, password] of Object.entries(process.env)) {
    const login = /PASSWORD$/.test(name) ? process.env[name.replace(/PASSWORD$/, "LOGIN")] : undefined;
    if (login && password) forms.push(Buffer.from(`${login}:${password}`).toString("base64"));
  }
  return [...new Set(forms)].sort((a, b) => b.length - a.length).map((form) => Buffer.from(form, "utf8"));
}

/** The data with every secret replaced, or undefined when it holds none. */
function scrubbed(data: Buffer, secrets: Buffer[]): Buffer | undefined {
  let out = data;
  let changed = false;
  for (const secret of secrets) {
    let at = out.indexOf(secret);
    if (at === -1) continue;
    const parts: Buffer[] = [];
    let from = 0;
    while (at !== -1) {
      parts.push(out.subarray(from, at), MARK);
      from = at + secret.length;
      at = out.indexOf(secret, from);
    }
    parts.push(out.subarray(from));
    out = Buffer.concat(parts);
    changed = true;
  }
  return changed ? out : undefined;
}

interface ZipEntry {
  name: Buffer;
  method: number;
  time: number;
  date: number;
  crc: number;
  data: Buffer; // as stored (compressed for method 8)
  size: number;
}

/** Rewrites a zip with the secrets replaced in the entries that hold one; the others keep their bytes. */
function scrubZip(file: string, secrets: Buffer[]): void {
  const zip = fs.readFileSync(file);
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end === -1) return;
  const count = zip.readUInt16LE(end + 10);
  let central = zip.readUInt32LE(end + 16);
  const entries: ZipEntry[] = [];
  let dirty = false;
  for (let index = 0; index < count; index += 1) {
    const method = zip.readUInt16LE(central + 10);
    const nameLength = zip.readUInt16LE(central + 28);
    const local = zip.readUInt32LE(central + 42);
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    let entry: ZipEntry = {
      name: zip.subarray(central + 46, central + 46 + nameLength),
      method,
      time: zip.readUInt16LE(central + 12),
      date: zip.readUInt16LE(central + 14),
      crc: zip.readUInt32LE(central + 16),
      data: zip.subarray(start, start + zip.readUInt32LE(central + 20)),
      size: zip.readUInt32LE(central + 24),
    };
    central += 46 + nameLength + zip.readUInt16LE(central + 30) + zip.readUInt16LE(central + 32);
    const plain = method === 8 ? zlib.inflateRawSync(entry.data) : method === 0 ? entry.data : undefined;
    const clean = plain && scrubbed(plain, secrets);
    if (clean) {
      dirty = true;
      entry = { ...entry, method: 8, crc: zlib.crc32(clean), data: zlib.deflateRawSync(clean), size: clean.length };
    }
    entries.push(entry);
  }
  if (!dirty) return;
  const locals: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(entry.method, 8);
    header.writeUInt16LE(entry.time, 10);
    header.writeUInt16LE(entry.date, 12);
    header.writeUInt32LE(entry.crc, 14);
    header.writeUInt32LE(entry.data.length, 18);
    header.writeUInt32LE(entry.size, 22);
    header.writeUInt16LE(entry.name.length, 26);
    locals.push(header, entry.name, entry.data);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(entry.method, 10);
    record.writeUInt16LE(entry.time, 12);
    record.writeUInt16LE(entry.date, 14);
    record.writeUInt32LE(entry.crc, 16);
    record.writeUInt32LE(entry.data.length, 20);
    record.writeUInt32LE(entry.size, 24);
    record.writeUInt16LE(entry.name.length, 28);
    record.writeUInt32LE(offset, 42);
    directory.push(record, entry.name);
    offset += 30 + entry.name.length + entry.data.length;
  }
  const directoryData = Buffer.concat(directory);
  const tail = Buffer.alloc(22);
  tail.writeUInt32LE(0x06054b50, 0);
  tail.writeUInt16LE(entries.length, 8);
  tail.writeUInt16LE(entries.length, 10);
  tail.writeUInt32LE(directoryData.length, 12);
  tail.writeUInt32LE(offset, 16);
  fs.writeFileSync(file, Buffer.concat([...locals, directoryData, tail]));
}

const TEXT_FILE = /\.(md|txt|json|jsonl|log|yaml|yml|html|trace|network|stacks)$/;

/**
 * Takes the secrets out of every trace and text file under the given folders — at the start and the
 * end of every run (sweep.global.ts), so a run started with its own `--reporter` (which leaves this
 * reporter out) or an older run's leftovers never keep a password either.
 */
export function scrubFolders(root: string, folders: string[]): void {
  const secrets = secretForms();
  if (secrets.length === 0) return;
  const walk = (dir: string): string[] =>
    fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`])) : [];
  for (const file of folders.flatMap((folder) => walk(`${root}/${folder}`))) {
    try {
      if (file.endsWith(".zip")) scrubZip(file, secrets);
      else if (TEXT_FILE.test(file)) {
        const clean = scrubbed(fs.readFileSync(file), secrets);
        if (clean) fs.writeFileSync(file, clean);
      }
    } catch {
      // a file it cannot read stays as it is
    }
  }
}

export default class SecretScrubReporter implements Reporter {
  onTestEnd(_test: TestCase, result: TestResult): void {
    const secrets = secretForms();
    if (secrets.length === 0) return;
    for (const attachment of result.attachments as Array<{ contentType: string; path?: string; body?: Buffer }>) {
      try {
        if (attachment.path && fs.existsSync(attachment.path)) {
          if (attachment.path.endsWith(".zip")) scrubZip(attachment.path, secrets);
          else if (/^text\/|json|markdown|yaml/.test(attachment.contentType)) {
            const clean = scrubbed(fs.readFileSync(attachment.path), secrets);
            if (clean) fs.writeFileSync(attachment.path, clean);
          }
        }
        if (attachment.body) {
          const clean = scrubbed(attachment.body, secrets);
          if (clean) attachment.body = clean;
        }
      } catch {
        // a file it cannot read stays as it is — the reports still build
      }
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}
