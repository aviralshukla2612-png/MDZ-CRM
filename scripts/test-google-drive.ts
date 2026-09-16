import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { Readable } from "stream";

// Helper to manually load .env in standalone script if not already loaded
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        val = val.replace(/\\n/g, "\n");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function runDriveTest() {
  console.log("==================================================");
  console.log("    MDZ-CRM GOOGLE DRIVE INTEGRATION TEST         ");
  console.log("==================================================\n");

  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!clientEmail || !privateKey || !rootFolderId) {
    console.error("❌ Missing required Google Drive environment variables in .env:");
    if (!clientEmail) console.error("   - GOOGLE_DRIVE_CLIENT_EMAIL is missing");
    if (!privateKey) console.error("   - GOOGLE_DRIVE_PRIVATE_KEY is missing");
    if (!rootFolderId) console.error("   - GOOGLE_DRIVE_ROOT_FOLDER_ID is missing");
    console.log("\nPlease add them to your .env file and run this script again.");
    process.exit(1);
  }

  // Normalize private key line breaks
  privateKey = privateKey.replace(/\\n/g, "\n");

  console.log("ℹ️  Client Email :", clientEmail);
  console.log("ℹ️  Root Folder ID:", rootFolderId);
  console.log("🔑 Initializing Google JWT Authenticator...");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log("⏳ [1/5] Verifying Root Folder Access...");
  try {
    const rootFolder = await drive.files.get({
      fileId: rootFolderId,
      fields: "id, name, mimeType, capabilities",
      supportsAllDrives: true,
    });
    console.log(`✅ Root Folder Found: "${rootFolder.data.name}" (ID: ${rootFolder.data.id})`);
    if (!rootFolder.data.capabilities?.canAddChildren) {
      console.warn("⚠️ Warning: Service Account may lack 'canAddChildren' permission in this folder. Ensure it is shared with 'Editor' role.");
    }
  } catch (err: any) {
    console.error("❌ Failed to access Root Folder:", err.message);
    if (err.message?.includes("File not found")) {
      console.error("👉 Please ensure you shared the folder with the Service Account email:", clientEmail);
    }
    process.exit(1);
  }

  const testFolderName = `MDZ-Test-Folder-${Date.now()}`;
  console.log(`\n⏳ [2/5] Creating Test Subfolder: "${testFolderName}"...`);
  let testFolderId: string | undefined;
  try {
    const folderRes = await drive.files.create({
      requestBody: {
        name: testFolderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      },
      fields: "id, name",
      supportsAllDrives: true,
    });
    testFolderId = folderRes.data.id!;
    console.log(`✅ Test Subfolder Created! (Folder ID: ${testFolderId})`);
  } catch (err: any) {
    console.error("❌ Failed to create subfolder:", err.message);
    process.exit(1);
  }

  const testPayload = `MDZ-CRM Google Drive Integration Verification\nTimestamp: ${new Date().toISOString()}\nStatus: Operational`;
  const testFileName = `test-verification-${Date.now()}.txt`;
  console.log(`\n⏳ [3/5] Uploading Test File: "${testFileName}"...`);
  let testFileId: string | undefined;
  try {
    const fileRes = await drive.files.create({
      requestBody: {
        name: testFileName,
        parents: [testFolderId],
      },
      media: {
        mimeType: "text/plain",
        body: Readable.from([testPayload]),
      },
      fields: "id, name, size, mimeType",
      supportsAllDrives: true,
    });
    testFileId = fileRes.data.id!;
    console.log(`✅ Test File Uploaded Successfully! (File ID: ${testFileId}, Size: ${fileRes.data.size} bytes)`);
  } catch (err: any) {
    console.error("❌ Failed to upload test file:", err.message);
    // Cleanup folder
    if (testFolderId) {
      await drive.files.delete({ fileId: testFolderId, supportsAllDrives: true }).catch(() => {});
    }
    process.exit(1);
  }

  console.log("\n⏳ [4/5] Reading Back Stream & Verifying Integrity...");
  try {
    const streamRes = await drive.files.get(
      { fileId: testFileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    const chunks: Buffer[] = [];
    for await (const chunk of streamRes.data) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const retrievedContent = Buffer.concat(chunks).toString("utf-8");

    if (retrievedContent === testPayload) {
      console.log("✅ Content Integrity Verified 100%! Retrieved stream matches payload exactly.");
    } else {
      console.error("❌ Content mismatch!");
      console.log("Expected:", testPayload);
      console.log("Got:", retrievedContent);
    }
  } catch (err: any) {
    console.error("❌ Failed to stream file from Google Drive:", err.message);
  }

  console.log("\n⏳ [5/5] Cleaning Up Test Artifacts (Testing Deletion / Rollback)...");
  try {
    if (testFileId) {
      await drive.files.delete({ fileId: testFileId, supportsAllDrives: true });
      console.log(`✅ Test File Deleted (ID: ${testFileId})`);
    }
    if (testFolderId) {
      await drive.files.delete({ fileId: testFolderId, supportsAllDrives: true });
      console.log(`✅ Test Folder Deleted (ID: ${testFolderId})`);
    }
  } catch (err: any) {
    console.error("⚠️ Cleanup error:", err.message);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL GOOGLE DRIVE VERIFICATION TESTS PASSED!");
  console.log("==================================================");
}

runDriveTest().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
