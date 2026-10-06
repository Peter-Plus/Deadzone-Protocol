import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
let sequence = 0;
export async function atomicWrite(file: string, data: string | Uint8Array): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  // Unique staging names also isolate a CLI build from a running watcher.
  const temporary = `${file}.${process.pid}.${sequence++}.tmp`;
  try {
    await writeFile(temporary, data);
    for (let attempt = 0; ; attempt++) {
      try { await rename(temporary, file); return; }
      catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        // Windows readers/AV may briefly hold the destination. Never unlink the
        // valid destination as a fallback: retries preserve the previous asset.
        if (attempt >= 7 || !['EPERM', 'EACCES', 'EBUSY'].includes(code ?? '')) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.min(15 * 2 ** attempt, 240)));
      }
    }
  } finally { await rm(temporary, { force: true }).catch(() => {}); }
}
