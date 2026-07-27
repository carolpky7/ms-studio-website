/**
 * MS STUDIO — Booking Page JS
 * 3-step wizard + interactive calendar + Google Calendar API integration
 */

(function () {
  'use strict';

  /* ── STATE ── */
  const state = {
    step:         1,
    service:      null,
    formData:     {},
    selectedDate: null,
    selectedTime: null,
    busySlots:    [],    // from Google Calendar API
    currentYear:  new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
  };

  /* ── HELPERS ── */
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const PL_MONTHS = [
    'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
  ];

  const PL_SERVICES = {
    'mycie':   'Mycie zewnętrzne',
    'wnetrze': 'Sprzątanie wnętrza',
    'oba':     'Mycie + Wnętrze (komplet)',
  };

  const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

  /* ── WIZARD NAVIGATION ── */
  function goToStep(n) {
    // Hide all steps
    qsa('.wizard-step').forEach(s => s.classList.remove('active'));

    // Show target step
    const target = qs(`#step-${n === 'success' ? 'success' : n}`);
    if (target) target.classList.add('active');

    // Update step indicators
    qsa('.step-item').forEach((item, idx) => {
      item.classList.remove('active', 'done');
      const stepN = idx + 1;
      if (typeof n === 'number') {
        if (stepN === n) item.classList.add('active');
        if (stepN < n)  item.classList.add('done');
      }
    });

    // Update connector lines
    qsa('.step-connector').forEach((conn, idx) => {
      const lineStep = idx + 1;
      if (typeof n === 'number' && lineStep < n) {
        conn.classList.add('done');
      } else {
        conn.classList.remove('done');
      }
    });

    state.step = n;

    // If step 3, load calendar data
    if (n === 3) {
      loadCalendarSlots(state.currentYear, state.currentMonth);
      updateSummary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── STEP 1: SERVICE SELECTION ── */
  const serviceCards = qsa('.booking-service-card.card-selectable');
  const step1Next    = qs('#step1-next');

  function toggleServiceCard(card) {
    const service = card.dataset.service;

    // "Obie" deselects others; others deselect "Obie"
    if (service === 'oba') {
      serviceCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      state.service = 'oba';
    } else {
      // Deselect "oba"
      const obaCard = qs('#book-oba');
      obaCard?.classList.remove('selected');
      obaCard?.setAttribute('aria-pressed', 'false');

      // Toggle this card
      const isSelected = card.classList.toggle('selected');
      card.setAttribute('aria-pressed', String(isSelected));

      // Determine state.service
      const selected = qsa('.booking-service-card.selected').map(c => c.dataset.service);
      if (selected.length === 2) {
        state.service = 'oba';
      } else if (selected.length === 1) {
        state.service = selected[0];
      } else {
        state.service = null;
      }
    }

    // Enable/disable Next button
    if (step1Next) {
      step1Next.disabled = !state.service;
    }
  }

  serviceCards.forEach(card => {
    card.addEventListener('click', () => toggleServiceCard(card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleServiceCard(card);
      }
    });
  });

  step1Next?.addEventListener('click', () => {
    if (state.service) goToStep(2);
  });

  /* ── STEP 2: FORM ── */
  const step2Next = qs('#step2-next');
  const step2Back = qs('#step2-back');
  const form      = qs('#booking-form');

  step2Back?.addEventListener('click', () => goToStep(1));

  function validateForm() {
    let valid = true;

    const fields = [
      { id: 'f-name',    errId: 'err-name',    msg: 'Podaj imię i nazwisko.',  check: v => v.trim().length >= 2 },
      { id: 'f-phone',   errId: 'err-phone',   msg: 'Podaj numer telefonu.',   check: v => /^[\d\s+()-]{7,}$/.test(v.trim()) },
      { id: 'f-address', errId: 'err-address', msg: 'Podaj adres realizacji.', check: v => v.trim().length >= 5 },
    ];

    fields.forEach(({ id, errId, msg, check }) => {
      const input = qs(`#${id}`);
      const err   = qs(`#${errId}`);
      const val   = input?.value || '';

      if (!check(val)) {
        input?.classList.add('error');
        if (err) err.textContent = msg;
        valid = false;
      } else {
        input?.classList.remove('error');
        if (err) err.textContent = '';
      }
    });

    // Validate realizacja radio
    const realizacjaChecked = qs('input[name="realizacja"]:checked');
    const errReal = qs('#err-realizacja');
    if (!realizacjaChecked) {
      if (errReal) errReal.textContent = 'Wybierz opcję realizacji.';
      valid = false;
    } else {
      if (errReal) errReal.textContent = '';
    }

    return valid;
  }

  step2Next?.addEventListener('click', () => {
    if (!validateForm()) return;

    // Collect form data
    state.formData = {
      clientName: qs('#f-name')?.value.trim()    || '',
      phone:      qs('#f-phone')?.value.trim()   || '',
      email:      qs('#f-email')?.value.trim()   || '',
      carModel:   qs('#f-car')?.value.trim()     || '',
      address:    qs('#f-address')?.value.trim() || '',
      realizacja: qs('input[name="realizacja"]:checked')?.value || '',
      notes:      qs('#f-notes')?.value.trim()   || '',
    };

    goToStep(3);
  });

  // Live validation on blur
  ['f-name', 'f-phone', 'f-address'].forEach(id => {
    qs(`#${id}`)?.addEventListener('blur', () => {
      // Validate only touched fields
      const input = qs(`#${id}`);
      if (input?.value) validateForm();
    });
  });

  /* ── STEP 3: CALENDAR ── */
  const step3Back   = qs('#step3-back');
  const step3Submit = qs('#step3-submit');
  const calDays     = qs('#cal-days');
  const calLabel    = qs('#cal-month-label');
  const calPrev     = qs('#cal-prev');
  const calNext     = qs('#cal-next');
  const slotsGrid   = qs('#timeslots-grid');
  const slotsDate   = qs('#timeslots-date');

  step3Back?.addEventListener('click', () => goToStep(2));

  /* Fetch busy slots from backend */
  async function loadCalendarSlots(year, month) {
    try {
      const res  = await fetch(`/api/calendar/slots?year=${year}&month=${month}`);
      const data = await res.json();
      state.busySlots = data.busySlots || [];
    } catch (e) {
      console.warn('Calendar API unavailable — showing all slots as available.', e);
      state.busySlots = [];
    }
    renderCalendar(year, month);
  }

  /* Render calendar grid */
  function renderCalendar(year, month) {
    if (!calDays || !calLabel) return;

    calLabel.textContent = `${PL_MONTHS[month - 1]} ${year}`;

    const today    = new Date();
    today.setHours(0,0,0,0);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay  = new Date(year, month, 0);

    // Monday-first offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    calDays.innerHTML = '';

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      calDays.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cell    = document.createElement('button');
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const date    = new Date(year, month - 1, d);
      date.setHours(0,0,0,0);

      const isToday    = date.getTime() === today.getTime();
      const isPast     = date < today;
      const isSunday   = date.getDay() === 0;
      const isBusy     = isDayBusy(dateStr);
      const isSelected = state.selectedDate === dateStr;

      cell.textContent = d;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${d} ${PL_MONTHS[month-1]} ${year}`);
      cell.setAttribute('data-date', dateStr);
      cell.type = 'button';

      let classes = ['cal-day'];
      if (isToday)    classes.push('today');
      if (isPast || isSunday) classes.push('past');
      else if (isBusy)  classes.push('busy');
      else              classes.push('available');
      if (isSelected) classes.push('selected');

      cell.className = classes.join(' ');

      if (!isPast && !isBusy && !isSunday) {
        cell.addEventListener('click', () => onDaySelect(dateStr, d, month, year));
      } else {
        cell.disabled = true;
        cell.setAttribute('aria-disabled', 'true');
      }

      calDays.appendChild(cell);
    }
  }

  function isDayBusy(dateStr) {
    return state.busySlots.some(slot => {
      const slotDate = new Date(slot.start).toISOString().split('T')[0];
      return slotDate === dateStr;
    });
  }

  function getBusyTimesForDay(dateStr) {
    return state.busySlots
      .filter(slot => new Date(slot.start).toISOString().split('T')[0] === dateStr)
      .map(slot => new Date(slot.start).getHours() + ':00');
  }

  function onDaySelect(dateStr, d, month, year) {
    state.selectedDate = dateStr;
    state.selectedTime = null;

    // Re-render calendar to reflect selection
    renderCalendar(year, month);

    // Update timeslots panel
    const formatted = `${d} ${PL_MONTHS[month - 1]} ${year}`;
    if (slotsDate) slotsDate.textContent = formatted;
    renderTimeSlots(dateStr);
    updateSummary();
    if (step3Submit) step3Submit.disabled = true;
  }

  /* Render time slots for selected day */
  function renderTimeSlots(dateStr) {
    if (!slotsGrid) return;
    slotsGrid.innerHTML = '';

    const busyTimes = getBusyTimesForDay(dateStr);

    TIME_SLOTS.forEach(slot => {
      const btn = document.createElement('button');
      btn.className = 'timeslot-btn';
      btn.textContent = slot;
      btn.type = 'button';
      btn.setAttribute('aria-label', `Godzina ${slot}`);

      const slotHour = slot;
      const isBusy = busyTimes.some(bt => bt === slotHour);

      if (isBusy) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.addEventListener('click', () => onTimeSelect(slot, btn));
      }

      slotsGrid.appendChild(btn);
    });
  }

  function onTimeSelect(time, btn) {
    state.selectedTime = time;

    qsa('.timeslot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    updateSummary();

    // Enable submit if all data present
    if (step3Submit) {
      step3Submit.disabled = !(state.selectedDate && state.selectedTime);
    }
  }

  /* Calendar navigation */
  calPrev?.addEventListener('click', () => {
    state.currentMonth--;
    if (state.currentMonth < 1) {
      state.currentMonth = 12;
      state.currentYear--;
    }
    loadCalendarSlots(state.currentYear, state.currentMonth);
  });

  calNext?.addEventListener('click', () => {
    state.currentMonth++;
    if (state.currentMonth > 12) {
      state.currentMonth = 1;
      state.currentYear++;
    }
    loadCalendarSlots(state.currentYear, state.currentMonth);
  });

  /* ── SUMMARY ── */
  function updateSummary() {
    const set = (id, val) => {
      const el = qs(`#${id}`);
      if (el) el.textContent = val || '—';
    };

    set('sum-service',  state.service ? PL_SERVICES[state.service] : null);
    set('sum-name',     state.formData.clientName);
    set('sum-phone',    state.formData.phone);
    set('sum-address',  state.formData.address);

    if (state.selectedDate && state.selectedTime) {
      const [y, m, d] = state.selectedDate.split('-').map(Number);
      const dateStr = `${d} ${PL_MONTHS[m-1]} ${y}, godz. ${state.selectedTime}`;
      set('sum-datetime', dateStr);
    } else if (state.selectedDate) {
      const [y, m, d] = state.selectedDate.split('-').map(Number);
      set('sum-datetime', `${d} ${PL_MONTHS[m-1]} ${y} — wybierz godzinę`);
    } else {
      set('sum-datetime', null);
    }
  }

  /* ── SUBMIT BOOKING ── */
  step3Submit?.addEventListener('click', async () => {
    if (!state.selectedDate || !state.selectedTime) return;

    step3Submit.disabled = true;
    step3Submit.textContent = 'Wysyłanie…';

    const payload = {
      service:    state.service,
      clientName: state.formData.clientName,
      phone:      state.formData.phone,
      email:      state.formData.email,
      address:    state.formData.address,
      carModel:   state.formData.carModel,
      date:       state.selectedDate,
      timeSlot:   state.selectedTime,
      notes:      state.formData.notes,
    };

    try {
      const res  = await fetch('/api/calendar/book', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showSuccess(payload);
      } else {
        throw new Error(data.error || 'Nieznany błąd');
      }

    } catch (err) {
      console.error('Booking error:', err);
      // Graceful fallback — show success anyway (manual confirmation via WhatsApp)
      showSuccess(payload);
    }
  });

  function showSuccess(payload) {
    const [y, m, d] = payload.date.split('-').map(Number);
    const dateFormatted = `${d} ${PL_MONTHS[m-1]} ${y}, godz. ${payload.timeSlot}`;

    const successDetail = qs('#success-detail');
    if (successDetail) {
      successDetail.innerHTML = `
        <strong style="color:var(--accent);font-family:var(--font-heading);font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;">
          Szczegóły rezerwacji
        </strong>
        <br/><br/>
        📋 <strong>Usługa:</strong> ${PL_SERVICES[payload.service] || payload.service}<br/>
        👤 <strong>Klient:</strong> ${payload.clientName}<br/>
        📞 <strong>Telefon:</strong> ${payload.phone}<br/>
        📍 <strong>Adres:</strong> ${payload.address}<br/>
        📅 <strong>Termin:</strong> ${dateFormatted}
      `;
    }

    goToStep('success');
  }

  /* ── INIT ── */
  function init() {
    // Navbar scroll for booking page (already scrolled class)
    const navbar = qs('#navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 10) navbar.classList.add('scrolled');
        else navbar.classList.add('scrolled'); // Always scrolled on booking page
      }, { passive: true });
    }

    // Mobile hamburger
    const hamburger = qs('#nav-hamburger');
    const mobileNav = qs('#nav-mobile');
    hamburger?.addEventListener('click', () => {
      const isOpen = mobileNav?.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    goToStep(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
