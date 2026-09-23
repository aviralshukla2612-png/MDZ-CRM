import { google } from "googleapis";
import { Readable } from "stream";

let driveClientInstance: ReturnType<typeof google.drive> | null = null;

/**
 * Checks if all required Google Drive environment variables are set.
 * Supports either OAuth 2.0 (recommended for personal Gmail) or Service Account.
 */
export function isGoogleDriveConfigured(): boolean {
  const hasOAuth = Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  );
  const hasServiceAccount = Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL &&
    process.env.GOOGLE_DRIVE_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  );
  return hasOAuth || hasServiceAccount;
}

/**
 * Returns a singleton instance of the authenticated Google Drive v3 client.
 * Priority: OAuth 2.0 (User Quota) > Service Account.
 */
export function getDriveClient() {
  if (driveClientInstance) {
    return driveClientInstance;
  }

  // 1. Check for OAuth 2.0 Credentials (Personal Gmail with full storage quota)
  const oauthClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      oauthClientId,
      oauthClientSecret,
      process.env.GOOGLE_DRIVE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({
      refresh_token: oauthRefreshToken,
    });
    driveClientInstance = google.drive({ version: "v3", auth: oauth2Client });
    return driveClientInstance;
  }

  // 2. Fallback to Service Account
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Drive is not configured. Missing OAuth 2.0 credentials or Service Account credentials in .env."
    );
  }

  // Ensure newlines in PEM private key are properly formatted
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  driveClientInstance = google.drive({ version: "v3", auth });
  return driveClientInstance;
}

/**
 * Cache for resolved folder IDs to prevent redundant API queries.
 */
const folderIdCache = new Map<string, string>();

/**
 * Looks up or creates a subfolder within a parent folder.
 */
export async function getOrCreateSubfolder(
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const cacheKey = `${parentFolderId}::${folderName}`;
  const cached = folderIdCache.get(cacheKey);
  if (cached) return cached;

  const drive = getDriveClient();

  // Search for existing folder with same name and parent
  const escapedName = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = `'${parentFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const listRes = await drive.files.list({
    q,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1,
  });

  if (listRes.data.files && listRes.data.files.length > 0 && listRes.data.files[0].id) {
    const existingId = listRes.data.files[0].id;
    folderIdCache.set(cacheKey, existingId);
    return existingId;
  }

  // Create folder if not found
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id, name",
    supportsAllDrives: true,
  });

  const createdId = createRes.data.id;
  if (!createdId) {
    throw new Error(`Failed to create Google Drive subfolder: ${folderName}`);
  }

  folderIdCache.set(cacheKey, createdId);
  return createdId;
}

/**
 * Resolves or dynamically builds the folder hierarchy for an entity.
 * Example: Root -> Projects -> PRJ-123 -> Assets
 */
export async function resolveEntityFolder(
  entityType: string,
  entityId: string,
  category: string = "GENERAL"
): Promise<string> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is missing in environment variables.");
  }

  const normalizedEntity = (entityType || "GENERAL").toUpperCase();

  if (normalizedEntity === "PROJECT") {
    const projectsFolder = await getOrCreateSubfolder(rootId, "Projects");
    const projectFolder = await getOrCreateSubfolder(projectsFolder, `Project-${entityId}`);
    if (category && category !== "GENERAL") {
      return await getOrCreateSubfolder(projectFolder, category);
    }
    return projectFolder;
  }

  if (normalizedEntity === "CLIENT") {
    const clientsFolder = await getOrCreateSubfolder(rootId, "Clients");
    return await getOrCreateSubfolder(clientsFolder, `Client-${entityId}`);
  }

  if (normalizedEntity === "INVOICE") {
    return await getOrCreateSubfolder(rootId, "Invoices");
  }

  if (normalizedEntity === "USER") {
    return await getOrCreateSubfolder(rootId, "Avatars");
  }

  if (normalizedEntity === "LEAD" || normalizedEntity === "INQUIRY") {
    const leadsFolder = await getOrCreateSubfolder(rootId, "Leads");
    return await getOrCreateSubfolder(leadsFolder, `Lead-${entityId}`);
  }

  if (normalizedEntity === "EMPLOYEE") {
    const employeesFolder = await getOrCreateSubfolder(rootId, "Employees");
    return await getOrCreateSubfolder(employeesFolder, `Employee-${entityId}`);
  }

  if (normalizedEntity === "CHAT") {
    const chatFolder = await getOrCreateSubfolder(rootId, "Chat");
    return await getOrCreateSubfolder(chatFolder, `Chat-${entityId}`);
  }

  const generalFolder = await getOrCreateSubfolder(rootId, "General");
  if (category && category !== "GENERAL") {
    return await getOrCreateSubfolder(generalFolder, category);
  }
  return generalFolder;
}

/**
 * Uploads a readable stream to Google Drive.
 */
export async function uploadStreamToDrive({
  stream,
  fileName,
  mimeType,
  folderId,
}: {
  stream: Readable;
  fileName: string;
  mimeType: string;
  folderId?: string;
}): Promise<{ driveFileId: string; fileName: string; fileSize?: number }> {
  const drive = getDriveClient();
  const targetParents = folderId ? [folderId] : [];

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: targetParents,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id, name, size, mimeType",
    supportsAllDrives: true,
  });

  if (!res.data.id) {
    throw new Error("Failed to receive Google Drive file ID after upload.");
  }

  return {
    driveFileId: res.data.id,
    fileName: res.data.name || fileName,
    fileSize: res.data.size ? parseInt(res.data.size, 10) : undefined,
  };
}

/**
 * Streams a file binary directly from Google Drive for authorized CRM-proxied downloads.
 */
export async function getDriveFileStream(driveFileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
  fileName: string;
  size?: number;
}> {
  const drive = getDriveClient();

  // First fetch metadata to get accurate mimeType, name, and size
  const metaRes = await drive.files.get({
    fileId: driveFileId,
    fields: "id, name, mimeType, size",
    supportsAllDrives: true,
  });

  const streamRes = await drive.files.get(
    {
      fileId: driveFileId,
      alt: "media",
      supportsAllDrives: true,
    },
    { responseType: "stream" }
  );

  return {
    stream: streamRes.data as unknown as NodeJS.ReadableStream,
    mimeType: metaRes.data.mimeType || "application/octet-stream",
    fileName: metaRes.data.name || "downloaded-file",
    size: metaRes.data.size ? parseInt(metaRes.data.size, 10) : undefined,
  };
}

/**
 * Deletes a file from Google Drive (or trashes it).
 * Used during user deletion and transactional rollback on DB insert failures.
 */
export async function deleteDriveFile(driveFileId: string): Promise<boolean> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({
      fileId: driveFileId,
      supportsAllDrives: true,
    });
    return true;
  } catch (err: any) {
    console.error(`[GoogleDrive] Failed to delete file ${driveFileId}:`, err?.message || err);
    return false;
  }
}
