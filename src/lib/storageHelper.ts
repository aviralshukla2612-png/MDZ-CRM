import fs from "fs";
import path from "path";
import os from "os";

let resolvedUploadDir: string | null = null;
let resolvedDataDir: string | null = null;

/**
 * Returns a guaranteed writable directory for file uploads.
 * Tries process.cwd()/uploads first; if permission denied (EACCES),
 * falls back to /tmp/mdz-crm-uploads.
 */
export async function getSafeUploadDir(): Promise<string> {
  if (resolvedUploadDir) {
    try {
      await fs.promises.access(resolvedUploadDir, fs.constants.W_OK);
      return resolvedUploadDir;
    } catch {
      resolvedUploadDir = null;
    }
  }

  const candidates = [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "public", "uploads"),
    path.join(os.tmpdir(), "mdz-crm-uploads"),
    "/tmp/mdz-crm-uploads",
  ];

  for (const dir of candidates) {
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      const testFile = path.join(dir, `.write_test_${Date.now()}_${Math.random().toString(36).substring(2)}`);
      await fs.promises.writeFile(testFile, "ok");
      await fs.promises.unlink(testFile);
      resolvedUploadDir = dir;
      return dir;
    } catch (err: any) {
      console.warn(`[StorageHelper] Candidate upload dir "${dir}" not writable:`, err?.message || err);
    }
  }

  const fallback = os.tmpdir();
  resolvedUploadDir = fallback;
  return fallback;
}

export function getSafeUploadDirSync(): string {
  if (resolvedUploadDir) {
    try {
      fs.accessSync(resolvedUploadDir, fs.constants.W_OK);
      return resolvedUploadDir;
    } catch {
      resolvedUploadDir = null;
    }
  }

  const candidates = [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "public", "uploads"),
    path.join(os.tmpdir(), "mdz-crm-uploads"),
    "/tmp/mdz-crm-uploads",
  ];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const testFile = path.join(dir, `.write_test_${Date.now()}_${Math.random().toString(36).substring(2)}`);
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
      resolvedUploadDir = dir;
      return dir;
    } catch {
      // try next
    }
  }

  resolvedUploadDir = os.tmpdir();
  return resolvedUploadDir;
}

/**
 * Searches candidate storage locations for an existing uploaded file.
 */
export function findLocalFile(fileName: string): string | null {
  const candidates = [
    path.join(process.cwd(), "uploads", fileName),
    path.join(process.cwd(), "public", "uploads", fileName),
    path.join(os.tmpdir(), "mdz-crm-uploads", fileName),
    path.join("/tmp", "mdz-crm-uploads", fileName),
    path.join(os.tmpdir(), fileName),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

/**
 * Returns a guaranteed writable directory for client portal JSON stores.
 */
export function getSafeDataDirSync(subFolder: string = "client-portal"): string {
  if (resolvedDataDir) {
    const full = path.join(resolvedDataDir, subFolder);
    try {
      if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
      }
      return full;
    } catch {
      resolvedDataDir = null;
    }
  }

  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(os.tmpdir(), "mdz-crm-data"),
    "/tmp/mdz-crm-data",
  ];

  for (const root of candidates) {
    try {
      const target = path.join(root, subFolder);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
      const testFile = path.join(target, `.data_test_${Date.now()}`);
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
      resolvedDataDir = root;
      return target;
    } catch {
      // try next
    }
  }

  const fallback = path.join(os.tmpdir(), subFolder);
  if (!fs.existsSync(fallback)) {
    fs.mkdirSync(fallback, { recursive: true });
  }
  return fallback;
}
