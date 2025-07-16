const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config(); // ✅ Load from .env

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Index')));

// ✅ Google Sheets setup using environment variables
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.SHEET_ID;

async function appendToSheet({ name, email, ip, location }) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const timestamp = new Date().toISOString();
    const row = [timestamp, name, email, ip, location];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'portfolio-server-log!A1:E1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log("✅ Row appended!");
  } catch (error) {
    console.error("❌ Google Sheets Error:", error.message);
  }
}


app.post('/log', async (req, res) => {
  const { name, email } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!name || !email) {
    return res.status(400).send('Missing name or email');
  }

  let locationInfo = '';
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = response.data;
    locationInfo =
      data.status === 'success'
        ? `${data.city}, ${data.regionName}, ${data.country} | ISP: ${data.isp}`
        : 'Unknown';
  } catch (error) {
    locationInfo = '[Geo lookup failed]';
  }

  try {
    await appendToSheet({ name, email, ip, location: locationInfo });
    res.send('Logged successfully to Google Sheets');
  } catch (err) {
    console.error('❌ Failed to log to Google Sheets:', err.message);
    res.status(500).send('Logging failed');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
