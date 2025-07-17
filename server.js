const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const UAParser = require('ua-parser-js'); // ✅ updated parser
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'Index')));

// ✅ Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SHEET_ID = process.env.SHEET_ID;

// ✅ Append data to Google Sheet
async function appendToSheet({ name, email, ip, location, browser, os, timestamp, path, referrer }) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const row = [timestamp, name, email, ip, location, browser, os, path, referrer];
    console.log("📄 Appending row:", row);

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'portfolio-server-log-03!A1:I1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log("✅ Row appended with status:", result.status);
  } catch (error) {
    console.error("❌ Google Sheets append error:", error);
    throw error;
  }
}

// ✅ POST route for logging
app.post('/log', async (req, res) => {
  console.log("📬 POST /log received");

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const parser = new UAParser(req.headers['user-agent']);
  const uaResult = parser.getResult();
  const browser = `${uaResult.browser.name} ${uaResult.browser.version}`;
  const os = `${uaResult.os.name} ${uaResult.os.version}`;
  const timestamp = new Date().toISOString();
  const requestPath = req.originalUrl;
  const referrer = req.headers['referer'] || 'Direct';

  const { name = 'Guest', email = '' } = req.body;

  if (!name || !email) {
    console.warn("⚠️ Missing name or email");
    return res.status(400).send('Missing name or email');
  }

  let locationInfo = '';
  try {
    const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = geoRes.data;
    locationInfo = data.status === 'success'
      ? `${data.city}, ${data.regionName}, ${data.country} | ISP: ${data.isp}`
      : 'Unknown';
  } catch (error) {
    console.error("❌ Location fetch failed:", error.message);
    locationInfo = '[Geo lookup failed]';
  }

  try {
    await appendToSheet({
      name,
      email,
      ip,
      location: locationInfo,
      browser,
      os,
      timestamp,
      path: requestPath,
      referrer
    });
    res.send('✅ Logged successfully to Google Sheets');
  } catch (err) {
    res.status(500).send('❌ Failed to log');
  }
});

// ✅ Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index', 'index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
