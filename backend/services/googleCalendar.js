/**
 * MS STUDIO — Google Calendar API Service
 * Handles OAuth2 authentication and calendar operations
 */

const { google } = require('googleapis');
const fs         = require('fs');
const path       = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH       = path.join(__dirname, '..', 'token.json');
const SCOPES           = ['https://www.googleapis.com/auth/calendar'];

function getAuth() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'credentials.json not found. ' +
      'Run: npm run auth — to set up Google Calendar authentication.'
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
  } else {
    throw new Error(
      'token.json not found. ' +
      'Run: npm run auth — to authorize with Google Calendar.'
    );
  }

  return oAuth2Client;
}

/**
 * Get busy time slots for a given month
 * Returns array of { start, end } ISO strings
 */
async function getBusySlots(year, month) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59).toISOString();

  try {
    const auth     = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.list({
      calendarId,
      timeMin: startOfMonth,
      timeMax: endOfMonth,
      singleEvents: true,
      orderBy: 'startTime',
      fields: 'items(id,summary,start,end,status)',
    });

    const events = res.data.items || [];

    // Return simplified busy slots
    return events
      .filter(e => e.status !== 'cancelled')
      .map(e => ({
        id:      e.id,
        title:   e.summary || 'Zajęte',
        start:   e.start.dateTime || e.start.date,
        end:     e.end.dateTime   || e.end.date,
      }));

  } catch (err) {
    console.error('[Google Calendar] getBusySlots error:', err.message);
    // Return empty array — don't crash the frontend
    return [];
  }
}

/**
 * Create a booking event in Google Calendar
 */
async function createBookingEvent({ service, clientName, phone, email, address, carModel, date, timeSlot, notes }) {
  const calendarId  = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const [year, month, day] = date.split('-').map(Number);
  const [startHour, startMin] = timeSlot.split(':').map(Number);
  const endHour = startHour + 2; // 2-hour default slot

  const startDateTime = new Date(year, month - 1, day, startHour, startMin).toISOString();
  const endDateTime   = new Date(year, month - 1, day, endHour,   startMin).toISOString();

  const serviceLabels = {
    'mycie':    'Mycie zewnętrzne',
    'wnetrze':  'Sprzątanie wnętrza',
    'oba':      'Mycie + Wnętrze',
  };

  const eventSummary = `🚗 MS STUDIO — ${serviceLabels[service] || service} | ${clientName}`;
  const eventDesc = [
    `Klient: ${clientName}`,
    `Telefon: ${phone}`,
    email ? `Email: ${email}` : '',
    `Adres: ${address}`,
    carModel ? `Auto: ${carModel}` : '',
    notes ? `\nUwagi: ${notes}` : '',
  ].filter(Boolean).join('\n');

  try {
    const auth     = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.insert({
      calendarId,
      resource: {
        summary:     eventSummary,
        description: eventDesc,
        location:    address,
        start: { dateTime: startDateTime, timeZone: 'Europe/Warsaw' },
        end:   { dateTime: endDateTime,   timeZone: 'Europe/Warsaw' },
        colorId: '7', // Peacock (cyan-ish)
        reminders: {
          useDefault: false,
          overrides:  [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 1440 }, // 24h before
          ],
        },
      },
    });

    return { success: true, eventId: res.data.id };

  } catch (err) {
    console.error('[Google Calendar] createBookingEvent error:', err.message);
    throw err;
  }
}

module.exports = { getBusySlots, createBookingEvent };
