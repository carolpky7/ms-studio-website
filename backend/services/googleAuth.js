/**
 * MS STUDIO — Google OAuth2 Setup Script
 * Run once: npm run auth
 * Follow the URL, authorize, paste the code.
 */

const { google } = require('googleapis');
const fs         = require('fs');
const path       = require('path');
const readline   = require('readline');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH       = path.join(__dirname, '..', 'token.json');
const SCOPES           = ['https://www.googleapis.com/auth/calendar'];

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('\n❌ Brak pliku credentials.json!');
  console.error('   Pobierz go z Google Cloud Console:');
  console.error('   https://console.cloud.google.com/apis/credentials\n');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n🔗 Otwórz ten URL w przeglądarce i zaloguj się na konto Google MS Studio:');
console.log('\n  ', authUrl, '\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('📋 Wklej tutaj kod autoryzacyjny z przeglądarki: ', (code) => {
  rl.close();

  oAuth2Client.getToken(code.trim(), (err, token) => {
    if (err) {
      console.error('\n❌ Błąd autoryzacji:', err.message);
      return;
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    console.log('\n✅ Autoryzacja zakończona! Plik token.json zapisany.');
    console.log('   Możesz teraz uruchomić serwer: npm run dev\n');
  });
});
