/**
 * MS STUDIO — Express Server
 * Serves static frontend + Google Calendar API proxy
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const calendarRoutes = require('./backend/routes/calendar');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Static Assets ──
// Serve public frontend (includes fonts, logo, frames, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));


// ── API Routes ──
app.use('/api/calendar', calendarRoutes);

// ── SPA Fallback (serve index.html for unknown routes) ──
app.get('*', (req, res) => {
  // Don't serve index.html for API or asset requests
  if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 MS STUDIO Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving frontend & static assets from: public/`);
  console.log(`📅 Google Calendar API:    /api/calendar/*\n`);
});
