/**
 * MS STUDIO — Calendar API Routes
 * GET  /api/calendar/slots?year=2026&month=7  → busy slots
 * POST /api/calendar/book                     → create booking
 */

const express           = require('express');
const router            = express.Router();
const { getBusySlots, createBookingEvent } = require('../services/googleCalendar');

/* ── GET /api/calendar/slots ── */
router.get('/slots', async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;

  if (month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid month' });
  }

  try {
    const busySlots = await getBusySlots(year, month);
    res.json({ year, month, busySlots });
  } catch (err) {
    console.error('[/api/calendar/slots]', err.message);
    // Return empty — frontend degrades gracefully (all slots open)
    res.json({ year, month, busySlots: [], warning: 'Calendar unavailable' });
  }
});

/* ── POST /api/calendar/book ── */
router.post('/book', async (req, res) => {
  const { service, clientName, phone, email, address, carModel, date, timeSlot, notes } = req.body;

  // Basic validation
  if (!clientName || !phone || !address || !date || !timeSlot || !service) {
    return res.status(400).json({
      error: 'Brakujące dane. Wymagane: service, clientName, phone, address, date, timeSlot.'
    });
  }

  try {
    const result = await createBookingEvent({ service, clientName, phone, email, address, carModel, date, timeSlot, notes });
    res.json({ success: true, eventId: result.eventId, message: 'Rezerwacja potwierdzona!' });
  } catch (err) {
    console.error('[/api/calendar/book]', err.message);
    res.status(500).json({ error: 'Błąd tworzenia rezerwacji. Spróbuj ponownie lub zadzwoń do nas.' });
  }
});

module.exports = router;
