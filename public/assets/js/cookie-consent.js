/**
 * MS STUDIO — Cookie Consent Manager (WCAG 2.1 AA & GDPR Compliant)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ms_cookie_consent';

  const DEFAULT_CONSENT = {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
    timestamp: null
  };

  let currentConsent = getSavedConsent();
  let activeModalElement = null;
  let previousFocusedElement = null;

  function getSavedConsent() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return null;
    }
  }

  function saveConsent(consentData) {
    const dataToSave = {
      ...DEFAULT_CONSENT,
      ...consentData,
      necessary: true, // Always required
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save cookie consent:', e);
    }
    currentConsent = dataToSave;

    // Dispatch event for other scripts (Google Analytics, Pixel, etc.)
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: dataToSave }));

    removeBanner();
    closeModal();
  }

  /* --- Render Banner --- */
  function renderBanner() {
    if (document.getElementById('cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Polityka plików cookie i prywatności');

    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-banner-content">
          <h2 class="cookie-banner-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
            </svg>
            Pliki Cookie i Twoja Prywatność
          </h2>
          <p class="cookie-banner-desc">
            Używamy plików cookie, aby zapewnić najwyższą jakość obsługi naszej strony, analizować ruch oraz dostosowywać treści. 
            Możesz zaakceptować wszystkie pliki cookie, odrzucić opcjonalne lub dostosować swoje preferencje.
          </p>
        </div>
        <div class="cookie-banner-actions">
          <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-accept-all">
            Zaakceptuj wszystkie
          </button>
          <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-reject-optional">
            Odrzuć opcjonalne
          </button>
          <button type="button" class="cookie-btn cookie-btn-outline" id="cookie-open-settings">
            Dostosuj wybór
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Event listeners
    document.getElementById('cookie-accept-all').addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: true, marketing: true, functional: true });
    });

    document.getElementById('cookie-reject-optional').addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
    });

    document.getElementById('cookie-open-settings').addEventListener('click', () => {
      openModal();
    });
  }

  function removeBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.remove();
    }
  }

  /* --- Render Granular Settings Modal --- */
  function openModal() {
    previousFocusedElement = document.activeElement;

    if (document.getElementById('cookie-modal-backdrop')) return;

    const consent = currentConsent || DEFAULT_CONSENT;

    const backdrop = document.createElement('div');
    backdrop.id = 'cookie-modal-backdrop';
    backdrop.className = 'cookie-modal-backdrop';

    backdrop.innerHTML = `
      <div class="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title" aria-describedby="cookie-modal-desc">
        <div class="cookie-modal-header">
          <h2 id="cookie-modal-title" class="cookie-modal-title">Ustawienia Prywatności i Plików Cookie</h2>
          <button type="button" class="cookie-modal-close" id="cookie-modal-close-btn" aria-label="Zamknij okno ustawień">
            &times;
          </button>
        </div>
        <div class="cookie-modal-body">
          <p id="cookie-modal-desc" style="font-size: 0.9rem; color: var(--cookie-muted); margin-bottom: 8px;">
            Wybierz, na które kategorie plików cookie wyrażasz zgodę. Pliki niezbędne są wymagane do prawidłowego funkcjonowania serwisu.
          </p>

          <!-- Niezbędne -->
          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 class="cookie-category-title">1. Niezbędne (Wymagane)</h3>
              <label class="cookie-switch">
                <input type="checkbox" id="cookie-cat-necessary" checked disabled aria-label="Niezbędne pliki cookie - zawsze aktywne">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Gwarantują prawidłowe działanie strony, bezpieczeństwo oraz zapamiętywanie Twoich preferencji prywatności. Nie można ich wyłączyć.
            </p>
          </div>

          <!-- Analityka -->
          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 class="cookie-category-title">2. Analityka i Statystyki</h3>
              <label class="cookie-switch">
                <input type="checkbox" id="cookie-cat-analytics" ${consent.analytics ? 'checked' : ''} aria-label="Analityczne pliki cookie">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Pomagają nam zrozumieć, w jaki sposób odwiedzający korzystają ze strony, co pozwala udoskonalać jej funkcjonalność i wydajność.
            </p>
          </div>

          <!-- Funkcjonalne -->
          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 class="cookie-category-title">3. Funkcjonalne</h3>
              <label class="cookie-switch">
                <input type="checkbox" id="cookie-cat-functional" ${consent.functional ? 'checked' : ''} aria-label="Funkcjonalne pliki cookie">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Umożliwiają zapamiętanie wybranych przez Ciebie ustawień (np. preferencji językowych czy lokalizacyjnych) i personalizację interfejsu.
            </p>
          </div>

          <!-- Marketing -->
          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 class="cookie-category-title">4. Marketing i Reklama</h3>
              <label class="cookie-switch">
                <input type="checkbox" id="cookie-cat-marketing" ${consent.marketing ? 'checked' : ''} aria-label="Marketingowe pliki cookie">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Służą do śledzenia aktywności użytkowników w celu wyświetlania bardziej dopasowanych i wartościowych reklam.
            </p>
          </div>
        </div>

        <div class="cookie-modal-footer">
          <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-modal-reject-all">
            Odrzuć opcjonalne
          </button>
          <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-modal-save">
            Zapisz moje wybory
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    activeModalElement = backdrop;

    // Focus management (WCAG 2.4.3 Focus Order)
    const closeBtn = document.getElementById('cookie-modal-close-btn');
    if (closeBtn) closeBtn.focus();

    // Event handlers for Modal
    closeBtn.addEventListener('click', closeModal);

    document.getElementById('cookie-modal-reject-all').addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: false, marketing: false, functional: false });
    });

    document.getElementById('cookie-modal-save').addEventListener('click', () => {
      const analytics = document.getElementById('cookie-cat-analytics').checked;
      const functional = document.getElementById('cookie-cat-functional').checked;
      const marketing = document.getElementById('cookie-cat-marketing').checked;
      saveConsent({ necessary: true, analytics, functional, marketing });
    });

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    // Keyboard handlers (Escape & Focus Trap)
    document.addEventListener('keydown', handleModalKeydown);
  }

  function closeModal() {
    const backdrop = document.getElementById('cookie-modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    activeModalElement = null;
    document.removeEventListener('keydown', handleModalKeydown);

    if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
      previousFocusedElement.focus();
    }
  }

  /* --- WCAG Focus Trap & Escape Key Handling --- */
  function handleModalKeydown(e) {
    if (!activeModalElement) return;

    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = activeModalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }

  /* --- Initialize --- */
  function init() {
    if (!currentConsent) {
      renderBanner();
    }

    // Attach click listeners to any footer link / button with data-cookie-settings or id="cookie-settings-btn"
    document.addEventListener('click', (e) => {
      const target = e.target.closest('#cookie-settings-btn, [data-cookie-settings]');
      if (target) {
        e.preventDefault();
        openModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
