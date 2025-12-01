const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');

const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
];
const TOKEN_PATH = path.join(__dirname, '../credentials/tokens.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials/oauth-client.json');

/**
 * Create an OAuth2 client with the given credentials.
 */
async function authorize() {
    let credentials;
    try {
        const content = await fs.readFile(CREDENTIALS_PATH);
        credentials = JSON.parse(content);
    } catch (err) {
        console.error('Error loading client secret file:', err);
        return;
    }

    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3000');

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
            console.log('Token stored to', TOKEN_PATH);
        } catch (err) {
            console.error('Error retrieving access token', err);
        }
    });
}

authorize();
