/**
 * Google Drive Diagnostics & Token Tester
 * Usage: node scripts/test-google-drive.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

async function runDiagnostics() {
  console.log('==============================================');
  console.log('   MDZ CRM - GOOGLE DRIVE DIAGNOSTICS TOOL');
  console.log('==============================================\n');

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  const saEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const saKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

  console.log('[1] Configuration Check:');
  console.log('  - OAuth Client ID:     ', clientId ? 'Configured (' + clientId.substring(0, 15) + '...)' : 'MISSING');
  console.log('  - OAuth Client Secret: ', clientSecret ? 'Configured' : 'MISSING');
  console.log('  - OAuth Refresh Token: ', refreshToken ? 'Configured (' + refreshToken.substring(0, 10) + '...)' : 'MISSING');
  console.log('  - Root Folder ID:      ', rootFolderId ? 'Configured (' + rootFolderId + ')' : 'MISSING');
  console.log('  - Service Account:     ', saEmail ? 'Configured (' + saEmail + ')' : 'Not configured (Optional)');

  console.log('\n[2] Testing Authentication...');

  if (clientId && clientSecret && refreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        process.env.GOOGLE_DRIVE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const tokenRes = await oauth2Client.getAccessToken();
      if (tokenRes && tokenRes.token) {
        console.log('  ✓ SUCCESS: Google OAuth Refresh Token is VALID and ACTIVE!');
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const about = await drive.about.get({ fields: 'user, storageQuota' });
        console.log('  ✓ Connected Google Account:', about.data.user.emailAddress);
        if (about.data.storageQuota) {
          const limitGb = (parseInt(about.data.storageQuota.limit || '0') / (1024**3)).toFixed(1);
          const usageGb = (parseInt(about.data.storageQuota.usage || '0') / (1024**3)).toFixed(1);
          console.log(`  ✓ Storage Quota: ${usageGb} GB used / ${limitGb} GB total`);
        }
        return;
      }
    } catch (err) {
      console.error('  ✗ FAILED: ' + err.message);
      if (err.message.includes('invalid_grant')) {
        console.error('\n--------------------------------------------------------------');
        console.error('EXPLANATION: "invalid_grant"');
        console.error('In Google Cloud Console, if your app Publishing status is "Testing",');
        console.error('Google automatically revokes refresh tokens after exactly 7 days.');
        console.error('\nHOW TO FIX PERMANENTLY:');
        console.error('1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials/consent');
        console.error('2. Click "PUBLISH APP" to switch Publishing Status from Testing to In Production.');
        console.error('   (In Production, refresh tokens NEVER expire!)');
        console.error('3. Generate a fresh token from https://developers.google.com/oauthplayground');
        console.error('   and paste it into .env as GOOGLE_DRIVE_REFRESH_TOKEN="..."');
        console.error('--------------------------------------------------------------\n');
      }
    }
  }

  if (saEmail && saKey) {
    try {
      console.log('  Testing fallback Service Account...');
      const auth = new google.auth.JWT({
        email: saEmail,
        key: saKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      const drive = google.drive({ version: 'v3', auth });
      const about = await drive.about.get({ fields: 'user' });
      console.log('  ✓ SUCCESS: Service Account is active! (' + about.data.user.emailAddress + ')');
    } catch (saErr) {
      console.error('  ✗ Service Account failed:', saErr.message);
    }
  }
}

runDiagnostics();
