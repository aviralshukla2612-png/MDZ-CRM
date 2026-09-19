import fs from 'fs';
import { google } from 'googleapis';

const credsPath = 'C:/Users/Aviral Shukla/Downloads/ess-crm-firebase-adminsdk-fbsvc-860381032b.json';
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
  try {
    const res = await drive.files.get({ fileId: '1IOEJj2lYPhJ8S56-k2jjK6abk3201bcL', fields: 'id, name, capabilities' });
    console.log('SUCCESS: Folder accessed successfully:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log('ERROR:', err.message);
    if (err.errors) console.log('Details:', JSON.stringify(err.errors, null, 2));
  }
}
check();
